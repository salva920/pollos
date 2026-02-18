import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * POST - Sincronizar lotes para productos con stock pero sin lotes
 * Útil para productos creados antes de la integración del sistema FIFO
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Buscar productos con stock pero sin lotes activos
    const products = await prisma.product.findMany({
      where: {
        stock: { gt: 0 },
      },
      include: {
        lotes: {
          where: {
            stockActual: { gt: 0 },
          },
        },
      },
    })

    let productosCorregidos = 0

    for (const product of products) {
      const stockEnLotes = product.lotes.reduce((sum, lote) => sum + lote.stockActual, 0)
      
      // Si el stock del producto no coincide con el stock en lotes
      if (stockEnLotes < product.stock) {
        const stockFaltante = product.stock - stockEnLotes
        
        // Crear lote para el stock faltante
        const fechaVencimiento = new Date()
        const diasVida = product.shelfLifeDays || 365
        fechaVencimiento.setDate(fechaVencimiento.getDate() + diasVida)

        await prisma.loteProducto.create({
          data: {
            productId: product.id,
            loteNumber: `SYNC-${Date.now()}-${product.id.slice(-4)}`,
            cantidad: stockFaltante,
            stockActual: stockFaltante,
            precioCompra: product.pricePerUnit,
            precioVenta: product.pricePerUnit,
            fechaVencimiento,
            estado: 'activo',
          },
        })

        productosCorregidos++
      }
    }

    return NextResponse.json({
      message: 'Sincronización completada',
      productosCorregidos,
    })
  } catch (error: any) {
    console.error('Error al sincronizar lotes:', error)
    return NextResponse.json(
      { error: 'Error al sincronizar lotes', details: error.message },
      { status: 500 }
    )
  }
}


