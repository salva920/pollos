import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { getLoteStatus } from '@/lib/utils'

/**
 * POST - Verificar vencimientos y actualizar estados de lotes
 */
export async function POST() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const hoy = new Date()
    const enTresDias = new Date(hoy)
    enTresDias.setDate(enTresDias.getDate() + 3)

    // Obtener todos los lotes activos
    const lotes = await prisma.loteProducto.findMany({
      where: {
        stockActual: { gt: 0 },
      },
      include: {
        product: true,
      },
    })

    const updates = {
      actualizados: 0,
      proximosVencer: 0,
      vencidos: 0,
      alertas: [] as any[],
    }

    // Actualizar estado de cada lote
    for (const lote of lotes) {
      const nuevoEstado = getLoteStatus(lote.fechaVencimiento)

      if (nuevoEstado !== lote.estado) {
        await prisma.loteProducto.update({
          where: { id: lote.id },
          data: { estado: nuevoEstado },
        })

        updates.actualizados++

        if (nuevoEstado === 'proximo_vencer') {
          updates.proximosVencer++

          // Crear alerta
          await prisma.alerta.create({
            data: {
              tipo: 'vencimiento',
              prioridad: 'alta',
              mensaje: `El lote ${lote.loteNumber} del producto ${lote.product.name} está próximo a vencer`,
              productId: lote.productId,
              loteId: lote.id,
            },
          })

          updates.alertas.push({
            loteNumber: lote.loteNumber,
            productName: lote.product.name,
            fechaVencimiento: lote.fechaVencimiento,
            estado: nuevoEstado,
          })
        } else if (nuevoEstado === 'vencido') {
          updates.vencidos++

          // Crear alerta crítica
          await prisma.alerta.create({
            data: {
              tipo: 'vencimiento',
              prioridad: 'alta',
              mensaje: `El lote ${lote.loteNumber} del producto ${lote.product.name} ha vencido`,
              productId: lote.productId,
              loteId: lote.id,
            },
          })

          updates.alertas.push({
            loteNumber: lote.loteNumber,
            productName: lote.product.name,
            fechaVencimiento: lote.fechaVencimiento,
            estado: nuevoEstado,
          })
        }
      }
    }

    return NextResponse.json({
      message: 'Verificación completada',
      ...updates,
    })
  } catch (error: any) {
    console.error('Error al verificar vencimientos:', error)
    return NextResponse.json(
      { error: 'Error al verificar vencimientos', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET - Obtener lotes próximos a vencer
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const hoy = new Date()
    const enSieteDias = new Date(hoy)
    enSieteDias.setDate(enSieteDias.getDate() + 7)

    const lotes = await prisma.loteProducto.findMany({
      where: {
        stockActual: { gt: 0 },
        fechaVencimiento: {
          gte: hoy,
          lte: enSieteDias,
        },
      },
      include: {
        product: true,
      },
      orderBy: {
        fechaVencimiento: 'asc',
      },
    })

    return NextResponse.json(lotes)
  } catch (error: any) {
    console.error('Error al obtener lotes próximos a vencer:', error)
    return NextResponse.json(
      { error: 'Error al obtener lotes', details: error.message },
      { status: 500 }
    )
  }
}




