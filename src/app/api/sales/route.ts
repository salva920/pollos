import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateInvoiceNumber, getLoteStatus } from '@/lib/utils'

/**
 * GET - Obtener todas las ventas
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {}

    if (from && to) {
      where.createdAt = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(sales)
  } catch (error: any) {
    console.error('Error al obtener ventas:', error)
    return NextResponse.json(
      { error: 'Error al obtener ventas', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear una nueva venta con sistema FIFO
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const {
      customerId,
      items,
      paymentMethod,
      paymentType,
      amountPaidBs,
      amountPaidUsd,
      tasaCambio,
      bank,
      referencia,
    } = data

    if (!customerId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Cliente e items son requeridos' },
        { status: 400 }
      )
    }

    // Verificar stock disponible y calcular precios usando FIFO
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          lotes: {
            where: {
              stockActual: { gt: 0 },
              estado: { not: 'vencido' },
            },
            orderBy: {
              fechaVencimiento: 'asc', // FIFO
            },
          },
        },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.productId} no encontrado` },
          { status: 404 }
        )
      }

      const stockDisponible = product.lotes.reduce(
        (sum, lote) => sum + lote.stockActual,
        0
      )

      if (stockDisponible < item.quantity) {
        return NextResponse.json(
          {
            error: `Stock insuficiente para ${product.name}. Disponible: ${stockDisponible}, Solicitado: ${item.quantity}`,
          },
          { status: 400 }
        )
      }
    }

    // Calcular totales
    let total = 0
    let gananciaTotal = 0

    const itemsConPrecio = await Promise.all(
      items.map(async (item: any) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            lotes: {
              where: {
                stockActual: { gt: 0 },
                estado: { not: 'vencido' },
              },
              orderBy: {
                fechaVencimiento: 'asc',
              },
            },
          },
        })

        if (!product) throw new Error('Producto no encontrado')

        const precioVenta = item.price || product.pricePerUnit
        const subtotal = precioVenta * item.quantity

        // Ganancia con FIFO real: repartir la cantidad vendida entre lotes en orden y sumar (precioVenta - costo lote) por cada tramo
        let ganancia = 0
        let cantidadRestante = item.quantity
        const detalleLotes: Array<{ loteNumber: string; cantidad: number; precioCompra: number; gananciaTramo: number }> = []
        for (const lote of product.lotes) {
          if (cantidadRestante <= 0) break
          const cantidadDelLote = Math.min(lote.stockActual, cantidadRestante)
          const costoUnit = lote.precioCompra ?? 0
          const gananciaLote = (precioVenta - costoUnit) * cantidadDelLote
          ganancia += gananciaLote
          detalleLotes.push({
            loteNumber: lote.loteNumber,
            cantidad: cantidadDelLote,
            precioCompra: costoUnit,
            gananciaTramo: gananciaLote,
          })
          cantidadRestante -= cantidadDelLote
        }

        console.log('[API Ventas] Item ganancia (FIFO):', {
          productId: item.productId,
          productName: product.name,
          quantity: item.quantity,
          precioVenta,
          subtotal,
          gananciaItem: ganancia,
          lotesUsados: detalleLotes,
        })

        total += subtotal
        gananciaTotal += ganancia

        return {
          productId: item.productId,
          quantity: item.quantity,
          price: precioVenta,
          subtotal: Math.round(subtotal * 100) / 100,
          ganancia: Math.round(ganancia * 100) / 100,
        }
      })
    )

    total = Math.round(total * 100) / 100
    gananciaTotal = Math.round(gananciaTotal * 100) / 100

    console.log('[API Ventas] Totales venta:', { total, gananciaTotal, itemsCount: itemsConPrecio.length })

    // Crear la venta en una transacción
    const sale = await prisma.$transaction(async (tx) => {
      // Crear la venta
      const newSale = await tx.sale.create({
        data: {
          customerId,
          invoiceNumber: generateInvoiceNumber(),
          total,
          ganancia: gananciaTotal,
          status: 'completada',
          paymentMethod,
          paymentType,
          amountPaidBs: amountPaidBs || null,
          amountPaidUsd: amountPaidUsd || null,
          tasaCambio: tasaCambio || null,
          bank,
          referencia,
        },
      })

      // Crear los items de venta y descontar stock usando FIFO
      for (const item of itemsConPrecio) {
        await tx.saleItem.create({
          data: {
            saleId: newSale.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
            ganancia: item.ganancia,
          },
        })

        // Descontar stock usando FIFO
        const lotes = await tx.loteProducto.findMany({
          where: {
            productId: item.productId,
            stockActual: { gt: 0 },
            estado: { not: 'vencido' },
          },
          orderBy: {
            fechaVencimiento: 'asc',
          },
        })

        let cantidadRestante = item.quantity
        for (const lote of lotes) {
          if (cantidadRestante <= 0) break

          const cantidadADescontar = Math.min(lote.stockActual, cantidadRestante)

          await tx.loteProducto.update({
            where: { id: lote.id },
            data: {
              stockActual: lote.stockActual - cantidadADescontar,
            },
          })

          cantidadRestante -= cantidadADescontar
        }

        // Actualizar stock total del producto
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })

        if (product) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: product.stock - item.quantity,
            },
          })
        }
      }

      // Registrar transacción en caja
      const saldoActual = await tx.transaccion.findFirst({
        orderBy: { fecha: 'desc' },
      })

      const montoEnBs =
        paymentType === 'bolivares'
          ? total
          : paymentType === 'dolares' && tasaCambio
          ? total * tasaCambio
          : (amountPaidBs || 0) + (amountPaidUsd || 0) * (tasaCambio || 1)

      await tx.transaccion.create({
        data: {
          tipo: 'venta',
          concepto: `Venta #${newSale.invoiceNumber}`,
          moneda: paymentType === 'dolares' ? 'USD' : 'VES',
          entrada: montoEnBs,
          salida: 0,
          saldo: (saldoActual?.saldo || 0) + montoEnBs,
          tasaCambio: tasaCambio || 0,
          referenciaId: newSale.id,
        },
      })

      return newSale
    })

    // Obtener la venta completa con relaciones
    const completeSale = await prisma.sale.findUnique({
      where: { id: sale.id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(completeSale, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear venta:', error)
    return NextResponse.json(
      { error: 'Error al crear venta', details: error.message },
      { status: 500 }
    )
  }
}




