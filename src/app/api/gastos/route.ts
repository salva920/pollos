import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener todos los gastos
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
    const categoria = searchParams.get('categoria')

    const where: any = {}

    if (from && to) {
      where.fecha = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    if (categoria) {
      where.categoria = categoria
    }

    const gastos = await prisma.gasto.findMany({
      where,
      orderBy: {
        fecha: 'desc',
      },
    })

    return NextResponse.json(gastos)
  } catch (error: any) {
    console.error('Error al obtener gastos:', error)
    return NextResponse.json(
      { error: 'Error al obtener gastos', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Registrar un nuevo gasto
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { concepto, categoria, monto, moneda, descripcion, fecha } = data

    if (!concepto || !categoria || !monto) {
      return NextResponse.json(
        { error: 'Concepto, categoría y monto son requeridos' },
        { status: 400 }
      )
    }

    // Crear el gasto en una transacción
    const gasto = await prisma.$transaction(async (tx) => {
      const newGasto = await tx.gasto.create({
        data: {
          fecha: fecha ? new Date(fecha) : new Date(),
          concepto,
          categoria,
          monto: parseFloat(monto),
          moneda: moneda || 'VES',
          descripcion,
        },
      })

      // Registrar transacción en caja
      const saldoActual = await tx.transaccion.findFirst({
        orderBy: { fecha: 'desc' },
      })

      await tx.transaccion.create({
        data: {
          tipo: 'gasto',
          concepto: `Gasto: ${concepto}`,
          moneda: moneda || 'VES',
          entrada: 0,
          salida: parseFloat(monto),
          saldo: (saldoActual?.saldo || 0) - parseFloat(monto),
          tasaCambio: 0,
          referenciaId: newGasto.id,
        },
      })

      return newGasto
    })

    return NextResponse.json(gasto, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear gasto:', error)
    return NextResponse.json(
      { error: 'Error al crear gasto', details: error.message },
      { status: 500 }
    )
  }
}




