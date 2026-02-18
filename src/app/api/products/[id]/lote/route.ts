import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { generateLoteNumber, getLoteStatus } from '@/lib/utils'

/**
 * POST - Agregar un nuevo lote a un producto existente
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { cantidad, precioCompra, fechaIngreso, fechaVencimiento } = data

    if (!cantidad || cantidad <= 0) {
      return NextResponse.json(
        { error: 'La cantidad es requerida y debe ser mayor a 0' },
        { status: 400 }
      )
    }

    if (!precioCompra || precioCompra < 0) {
      return NextResponse.json(
        { error: 'El precio de compra es requerido' },
        { status: 400 }
      )
    }

    if (!fechaVencimiento) {
      return NextResponse.json(
        { error: 'La fecha de vencimiento es requerida' },
        { status: 400 }
      )
    }

    // Verificar que el producto existe
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    // Crear el nuevo lote y actualizar el stock en una transacción
    const result = await prisma.$transaction(async (tx) => {
      const loteNumber = generateLoteNumber()
      const fechaIngresoDate = fechaIngreso ? new Date(fechaIngreso) : new Date()
      const fechaVencimientoDate = new Date(fechaVencimiento)
      const loteStatus = getLoteStatus(fechaVencimientoDate)

      // Crear el lote
      const nuevoLote = await tx.loteProducto.create({
        data: {
          productId: params.id,
          loteNumber,
          cantidad: parseFloat(cantidad),
          stockActual: parseFloat(cantidad),
          precioCompra: parseFloat(precioCompra),
          precioVenta: product.pricePerUnit, // Usar el precio final de venta del producto
          fechaIngreso: fechaIngresoDate,
          fechaVencimiento: fechaVencimientoDate,
          estado: loteStatus,
        },
      })

      // Actualizar el stock del producto
      await tx.product.update({
        where: { id: params.id },
        data: {
          stock: {
            increment: parseFloat(cantidad),
          },
        },
      })

      return nuevoLote
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error: any) {
    console.error('Error al agregar lote:', error)
    return NextResponse.json(
      { error: 'Error al agregar lote', details: error.message },
      { status: 500 }
    )
  }
}
