import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * PUT - Marcar una alerta como leída
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

    const alerta = await prisma.alerta.update({
      where: { id: params.id },
      data: { leida: true },
    })

    return NextResponse.json(alerta)
  } catch (error: any) {
    console.error('Error al actualizar alerta:', error)
    return NextResponse.json(
      { error: 'Error al actualizar alerta', details: error.message },
      { status: 500 }
    )
  }
}




