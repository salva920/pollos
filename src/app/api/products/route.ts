import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener todos los productos
 */
export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock')

    const where: any = {}

    if (category) {
      where.category = category
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        lotes: {
          where: {
            stockActual: { gt: 0 },
          },
          orderBy: {
            fechaVencimiento: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Filtrar productos con bajo stock si se solicita
    let filteredProducts = products
    if (lowStock === 'true') {
      filteredProducts = products.filter(p => p.stock <= p.minStock)
    }

    return NextResponse.json(filteredProducts)
  } catch (error: any) {
    console.error('Error al obtener productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear un nuevo producto
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()

    const {
      name,
      category,
      subCategory,
      description,
      unit,
      precioInicial,
      pricePerUnit,
      stock,
      minStock,
      isPerishable,
      refrigerationRequired,
      shelfLifeDays,
      supplier,
      sku,
      barcode,
    } = data

    // Validaciones
    if (!name || !category || !unit || !pricePerUnit) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // Precio inicial es opcional, pero si se proporciona debe ser válido
    if (precioInicial !== undefined && precioInicial !== null && precioInicial !== '' && parseFloat(precioInicial) < 0) {
      return NextResponse.json(
        { error: 'El precio inicial debe ser mayor o igual a 0' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un producto con el mismo SKU o código de barras
    if (sku) {
      const existingSku = await prisma.product.findUnique({
        where: { sku },
      })
      if (existingSku) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese SKU' },
          { status: 400 }
        )
      }
    }

    if (barcode) {
      const existingBarcode = await prisma.product.findUnique({
        where: { barcode },
      })
      if (existingBarcode) {
        return NextResponse.json(
          { error: 'Ya existe un producto con ese código de barras' },
          { status: 400 }
        )
      }
    }

    // Crear el producto y el lote inicial si hay stock
    const stockInicial = stock ? parseFloat(stock) : 0
    
    const product = await prisma.product.create({
      data: {
        name,
        category,
        subCategory,
        description,
        unit,
        precioInicial: precioInicial && precioInicial !== '' ? parseFloat(precioInicial) : null,
        pricePerUnit: parseFloat(pricePerUnit),
        stock: stockInicial,
        minStock: parseFloat(minStock) || 0,
        isPerishable: isPerishable !== undefined ? isPerishable : true,
        refrigerationRequired: refrigerationRequired || false,
        shelfLifeDays: shelfLifeDays ? parseInt(shelfLifeDays) : null,
        supplier,
        sku,
        barcode,
      },
    })

    // Si hay stock inicial, crear un lote automático para FIFO
    // Nota: El precio de compra se establecerá cuando se registre la primera compra real
    // Por ahora, el precio de compra es 0 hasta que se registre una compra
    if (stockInicial > 0) {
      const fechaVencimiento = new Date()
      // Si el producto tiene días de vida útil, usar eso; si no, 365 días por defecto
      const diasVida = shelfLifeDays ? parseInt(shelfLifeDays) : 365
      fechaVencimiento.setDate(fechaVencimiento.getDate() + diasVida)

      await prisma.loteProducto.create({
        data: {
          productId: product.id,
          loteNumber: `INICIAL-${Date.now()}`,
          cantidad: stockInicial,
          stockActual: stockInicial,
          precioCompra: 0, // Se actualizará cuando se registre la primera compra
          precioVenta: parseFloat(pricePerUnit), // Precio final de venta del producto
          fechaVencimiento,
          estado: 'activo',
        },
      })
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear producto:', error)
    return NextResponse.json(
      { error: 'Error al crear producto', details: error.message },
      { status: 500 }
    )
  }
}




