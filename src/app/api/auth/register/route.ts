import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * POST - Registro público de nuevo usuario (empleado).
 * Solo disponible cuando el sistema ya tiene al menos un usuario (inicializado).
 * Crea usuarios con rol "vendedor" por defecto. Un admin puede cambiar el rol después.
 */
export async function POST(request: Request) {
  try {
    const existingUsers = await prisma.user.count()
    if (existingUsers === 0) {
      return NextResponse.json(
        { error: 'El sistema aún no está inicializado. Un administrador debe crear la primera cuenta.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { username, password, name } = body

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Nombre, usuario y contraseña son requeridos' },
        { status: 400 }
      )
    }

    if (username.trim().length < 3) {
      return NextResponse.json(
        { error: 'El usuario debe tener al menos 3 caracteres' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { error: 'El nombre debe tener al menos 2 caracteres' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({
      where: { username: username.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con ese nombre de usuario' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        password: hashedPassword,
        name: name.trim(),
        role: 'vendedor',
        active: true,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
      },
    })

    return NextResponse.json(
      { message: 'Cuenta creada correctamente. Ya puedes iniciar sesión.', user },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al registrar usuario:', error)
    return NextResponse.json(
      { error: 'Error al registrar', details: error.message },
      { status: 500 }
    )
  }
}
