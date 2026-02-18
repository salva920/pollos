import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const proveedor = await prisma.proveedor.findUnique({
      where: { id: params.id },
      include: {
        compras: {
          orderBy: {
            fecha: 'desc',
          },
        },
      },
    })

    if (!proveedor) {
      return NextResponse.json(
        { error: 'Proveedor no encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(proveedor)
  } catch (error: any) {
    console.error('Error al obtener proveedor:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedor', details: error.message },
      { status: 500 }
    )
  }
}

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

    const proveedor = await prisma.proveedor.update({
      where: { id: params.id },
      data,
    })

    return NextResponse.json(proveedor)
  } catch (error: any) {
    console.error('Error al actualizar proveedor:', error)
    return NextResponse.json(
      { error: 'Error al actualizar proveedor', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const comprasCount = await prisma.compra.count({
      where: { proveedorId: params.id },
    })

    if (comprasCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un proveedor con compras asociadas' },
        { status: 400 }
      )
    }

    await prisma.proveedor.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Proveedor eliminado exitosamente' })
  } catch (error: any) {
    console.error('Error al eliminar proveedor:', error)
    return NextResponse.json(
      { error: 'Error al eliminar proveedor', details: error.message },
      { status: 500 }
    )
  }
}




