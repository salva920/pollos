import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * GET - Obtener todos los clientes
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const customers = await prisma.customer.findMany({
      include: {
        sales: {
          take: 5,
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(customers)
  } catch (error: any) {
    console.error('Error al obtener clientes:', error)
    return NextResponse.json(
      { error: 'Error al obtener clientes', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Crear un nuevo cliente
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const data = await request.json()
    const { name, cedula, email, phone, address, type } = data

    if (!name || !cedula) {
      return NextResponse.json(
        { error: 'Nombre y cédula son requeridos' },
        { status: 400 }
      )
    }

    // Verificar si ya existe un cliente con esa cédula
    const existingCustomer = await prisma.customer.findUnique({
      where: { cedula },
    })

    if (existingCustomer) {
      return NextResponse.json(
        { error: 'Ya existe un cliente con esa cédula' },
        { status: 400 }
      )
    }

    const customer = await prisma.customer.create({
      data: {
        name,
        cedula,
        email,
        phone,
        address,
        type: type || 'detal',
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error: any) {
    console.error('Error al crear cliente:', error)
    return NextResponse.json(
      { error: 'Error al crear cliente', details: error.message },
      { status: 500 }
    )
  }
}




