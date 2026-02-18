import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener todas las alertas
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const leida = searchParams.get('leida')

    const where: any = {}

    if (leida !== null) {
      where.leida = leida === 'true'
    }

    const alertas = await prisma.alerta.findMany({
      where,
      orderBy: [
        { leida: 'asc' },
        { fecha: 'desc' },
      ],
      take: 50,
    })

    return NextResponse.json(alertas)
  } catch (error: any) {
    console.error('Error al obtener alertas:', error)
    return NextResponse.json(
      { error: 'Error al obtener alertas', details: error.message },
      { status: 500 }
    )
  }
}




