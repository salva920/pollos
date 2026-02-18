import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener la tasa de cambio actual
 */
export async function GET() {
  try {
    const tasaCambio = await prisma.tasaCambio.findFirst({
      orderBy: {
        fecha: 'desc',
      },
    })

    return NextResponse.json(tasaCambio || { tasa: 0, fecha: new Date() })
  } catch (error: any) {
    console.error('Error al obtener tasa de cambio:', error)
    return NextResponse.json(
      { error: 'Error al obtener tasa de cambio', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Actualizar la tasa de cambio
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { tasa } = await request.json()

    if (!tasa || tasa <= 0) {
      return NextResponse.json(
        { error: 'Tasa inválida' },
        { status: 400 }
      )
    }

    const tasaCambio = await prisma.tasaCambio.create({
      data: {
        tasa: parseFloat(tasa),
      },
    })

    return NextResponse.json(tasaCambio, { status: 201 })
  } catch (error: any) {
    console.error('Error al actualizar tasa de cambio:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tasa de cambio', details: error.message },
      { status: 500 }
    )
  }
}




