import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateLoteNumber, getLoteStatus } from '@/lib/utils'

/**
 * GET - Obtener todas las compras
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
      where.fecha = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    const compras = await prisma.compra.findMany({
      where,
      include: {
        proveedor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
    })

    return NextResponse.json(compras)
  } catch (error: any) {
    console.error('Error al obtener compras:', error)
    return NextResponse.json(
      { error: 'Error al obtener compras', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Registrar una nueva compra y crear lotes
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const {
      proveedorId,
      items,
      numeroFactura,
      moneda,
      tasaCambio,
    } = data

    if (!proveedorId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Proveedor e items son requeridos' },
        { status: 400 }
      )
    }

    // Validar que todos los productos existan
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      })

      if (!product) {
        return NextResponse.json(
          { error: `Producto ${item.productId} no encontrado` },
          { status: 404 }
        )
      }
    }

    // Calcular total
    const total = items.reduce(
      (sum: number, item: any) => sum + item.precioUnitario * item.cantidad,
      0
    )

    // Crear la compra en una transacción
    const compra = await prisma.$transaction(async (tx) => {
      // Crear la compra
      const newCompra = await tx.compra.create({
        data: {
          proveedorId,
          numeroFactura,
          total,
          moneda: moneda || 'VES',
          tasaCambio: tasaCambio || null,
        },
      })

      // Crear los items y lotes
      for (const item of items) {
        const loteNumber = generateLoteNumber()

        // Crear el item de compra
        await tx.compraItem.create({
          data: {
            compraId: newCompra.id,
            productId: item.productId,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario,
            loteNumber,
            fechaVencimiento: new Date(item.fechaVencimiento),
          },
        })

        // Crear el lote del producto
        const loteStatus = getLoteStatus(item.fechaVencimiento)

        await tx.loteProducto.create({
          data: {
            productId: item.productId,
            loteNumber,
            cantidad: item.cantidad,
            stockActual: item.cantidad,
            precioCompra: item.precioUnitario,
            precioVenta: item.precioVenta || item.precioUnitario * 1.3, // 30% markup por defecto
            fechaIngreso: new Date(),
            fechaVencimiento: new Date(item.fechaVencimiento),
            estado: loteStatus,
            compraId: newCompra.id,
          },
        })

        // Actualizar stock del producto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.cantidad,
            },
          },
        })
      }

      // Registrar transacción en caja (salida de dinero)
      const saldoActual = await tx.transaccion.findFirst({
        orderBy: { fecha: 'desc' },
      })

      const montoEnBs =
        moneda === 'USD' && tasaCambio ? total * tasaCambio : total

      await tx.transaccion.create({
        data: {
          tipo: 'compra',
          concepto: `Compra a proveedor - Factura ${numeroFactura || 'S/N'}`,
          moneda: moneda || 'VES',
          entrada: 0,
          salida: montoEnBs,
          saldo: (saldoActual?.saldo || 0) - montoEnBs,
          tasaCambio: tasaCambio || 0,
          referenciaId: newCompra.id,
        },
      })

      return newCompra
    })

    // Obtener la compra completa
    const completeCompra = await prisma.compra.findUnique({
      where: { id: compra.id },
      include: {
        proveedor: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    return NextResponse.json(completeCompra, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear compra:', error)
    return NextResponse.json(
      { error: 'Error al crear compra', details: error.message },
      { status: 500 }
    )
  }
}




