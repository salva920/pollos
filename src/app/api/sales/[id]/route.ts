import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener una venta por ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json(sale)
  } catch (error: any) {
    console.error('Error al obtener venta:', error)
    return NextResponse.json(
      { error: 'Error al obtener venta', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Cancelar una venta (devuelve el stock)
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo permitir a administradores cancelar ventas
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para cancelar ventas' },
        { status: 403 }
      )
    }

    const sale = await prisma.sale.findUnique({
      where: { id: params.id },
      include: {
        items: true,
      },
    })

    if (!sale) {
      return NextResponse.json(
        { error: 'Venta no encontrada' },
        { status: 404 }
      )
    }

    if (sale.status === 'cancelada') {
      return NextResponse.json(
        { error: 'La venta ya está cancelada' },
        { status: 400 }
      )
    }

    // Cancelar en una transacción
    await prisma.$transaction(async (tx) => {
      // Devolver el stock (agregar a lotes más recientes)
      for (const item of sale.items) {
        // Buscar el lote más reciente del producto
        const loteReciente = await tx.loteProducto.findFirst({
          where: {
            productId: item.productId,
          },
          orderBy: {
            fechaIngreso: 'desc',
          },
        })

        if (loteReciente) {
          await tx.loteProducto.update({
            where: { id: loteReciente.id },
            data: {
              stockActual: loteReciente.stockActual + item.quantity,
            },
          })
        }

        // Actualizar stock total del producto
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: item.quantity,
            },
          },
        })
      }

      // Actualizar estado de la venta
      await tx.sale.update({
        where: { id: params.id },
        data: {
          status: 'cancelada',
        },
      })

      // Registrar transacción negativa en caja
      const saldoActual = await tx.transaccion.findFirst({
        orderBy: { fecha: 'desc' },
      })

      await tx.transaccion.create({
        data: {
          tipo: 'ajuste',
          concepto: `Cancelación de venta #${sale.invoiceNumber}`,
          moneda: 'VES',
          entrada: 0,
          salida: sale.total,
          saldo: (saldoActual?.saldo || 0) - sale.total,
          tasaCambio: sale.tasaCambio || 0,
          referenciaId: sale.id,
        },
      })
    })

    return NextResponse.json({ message: 'Venta cancelada exitosamente' })
  } catch (error: any) {
    console.error('Error al cancelar venta:', error)
    return NextResponse.json(
      { error: 'Error al cancelar venta', details: error.message },
      { status: 500 }
    )
  }
}




