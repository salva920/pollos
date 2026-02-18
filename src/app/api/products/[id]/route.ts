import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener un producto por ID
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

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        lotes: {
          orderBy: {
            fechaVencimiento: 'asc',
          },
        },
      },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error al obtener producto:', error)
    return NextResponse.json(
      { error: 'Error al obtener producto', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT - Actualizar un producto
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...data,
        precioInicial: data.precioInicial !== undefined ? parseFloat(data.precioInicial) : undefined,
        pricePerUnit: data.pricePerUnit ? parseFloat(data.pricePerUnit) : undefined,
        stock: data.stock !== undefined ? parseFloat(data.stock) : undefined,
        minStock: data.minStock ? parseFloat(data.minStock) : undefined,
        shelfLifeDays: data.shelfLifeDays ? parseInt(data.shelfLifeDays) : undefined,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error al actualizar producto:', error)
    return NextResponse.json(
      { error: 'Error al actualizar producto', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Eliminar un producto
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

    // Verificar si el producto tiene ventas asociadas
    const salesCount = await prisma.saleItem.count({
      where: { productId: params.id },
    })

    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un producto con ventas asociadas' },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Producto eliminado exitosamente' })
  } catch (error: any) {
    console.error('Error al eliminar producto:', error)
    return NextResponse.json(
      { error: 'Error al eliminar producto', details: error.message },
      { status: 500 }
    )
  }
}




