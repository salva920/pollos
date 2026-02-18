import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener todos los lotes
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const estado = searchParams.get('estado')

    const where: any = {}

    if (productId) {
      where.productId = productId
    }

    if (estado) {
      where.estado = estado
    }

    const lotes = await prisma.loteProducto.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    })

    return NextResponse.json(lotes)
  } catch (error: any) {
    console.error('Error al obtener lotes:', error)
    return NextResponse.json(
      { error: 'Error al obtener lotes', details: error.message },
      { status: 500 }
    )
  }
}




