import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener transacciones de caja
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
    const limit = searchParams.get('limit')

    const where: any = {}

    if (from && to) {
      where.fecha = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    const transacciones = await prisma.transaccion.findMany({
      where,
      orderBy: {
        fecha: 'desc',
      },
      take: limit ? parseInt(limit) : undefined,
    })

    return NextResponse.json(transacciones)
  } catch (error: any) {
    console.error('Error al obtener transacciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener transacciones', details: error.message },
      { status: 500 }
    )
  }
}




