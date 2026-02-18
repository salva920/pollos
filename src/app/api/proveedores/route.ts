import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener todos los proveedores
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const proveedores = await prisma.proveedor.findMany({
      include: {
        compras: {
          take: 5,
          orderBy: {
            fecha: 'desc',
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    })

    return NextResponse.json(proveedores)
  } catch (error: any) {
    console.error('Error al obtener proveedores:', error)
    return NextResponse.json(
      { error: 'Error al obtener proveedores', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear un nuevo proveedor
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { nombre, rif, telefono, email, direccion, contacto, productosSuministrados } = data

    if (!nombre || !rif) {
      return NextResponse.json(
        { error: 'Nombre y RIF son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un proveedor con ese RIF
    const existingProveedor = await prisma.proveedor.findUnique({
      where: { rif },
    })

    if (existingProveedor) {
      return NextResponse.json(
        { error: 'Ya existe un proveedor con ese RIF' },
        { status: 400 }
      )
    }

    const proveedor = await prisma.proveedor.create({
      data: {
        nombre,
        rif,
        telefono,
        email,
        direccion,
        contacto,
        productosSuministrados: productosSuministrados || [],
      },
    })

    return NextResponse.json(proveedor, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear proveedor:', error)
    return NextResponse.json(
      { error: 'Error al crear proveedor', details: error.message },
      { status: 500 }
    )
  }
}




