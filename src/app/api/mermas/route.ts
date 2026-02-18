import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener todas las mermas
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

    const where: any = {}

    if (from && to) {
      where.fecha = {
        gte: new Date(from),
        lte: new Date(to),
      }
    }

    const mermas = await prisma.merma.findMany({
      where,
      orderBy: {
        fecha: 'desc',
      },
    })

    return NextResponse.json(mermas)
  } catch (error: any) {
    console.error('Error al obtener mermas:', error)
    return NextResponse.json(
      { error: 'Error al obtener mermas', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Registrar una nueva merma
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const {
      productId,
      loteId,
      cantidad,
      motivo,
      descripcion,
    } = data

    if (!productId || !cantidad || !motivo) {
      return NextResponse.json(
        { error: 'Producto, cantidad y motivo son requeridos' },
        { status: 400 }
      )
    }

    // Obtener información del producto y lote
    const product = await prisma.product.findUnique({
      where: { id: productId },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Producto no encontrado' },
        { status: 404 }
      )
    }

    let lote = null
    if (loteId) {
      lote = await prisma.loteProducto.findUnique({
        where: { id: loteId },
      })
    }

    // Crear la merma en una transacción
    const merma = await prisma.$transaction(async (tx) => {
      const costoUnitario = lote?.precioCompra || product.pricePerUnit
      const costoTotal = costoUnitario * cantidad

      const newMerma = await tx.merma.create({
        data: {
          productId,
          productName: product.name,
          loteId: loteId || null,
          loteNumber: lote?.loteNumber || null,
          cantidad: parseFloat(cantidad),
          motivo,
          descripcion,
          costoUnitario,
          costoTotal,
          reportadoPor: session.username,
        },
      })

      // Descontar del lote si se especificó
      if (lote) {
        await tx.loteProducto.update({
          where: { id: loteId },
          data: {
            stockActual: lote.stockActual - cantidad,
          },
        })
      }

      // Descontar del stock del producto
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: cantidad,
          },
        },
      })

      return newMerma
    })

    return NextResponse.json(merma, { status: 201 })
  } catch (error: any) {
    console.error('Error al registrar merma:', error)
    return NextResponse.json(
      { error: 'Error al registrar merma', details: error.message },
      { status: 500 }
    )
  }
}




