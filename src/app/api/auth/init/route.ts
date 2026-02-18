import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * Inicializa el primer usuario administrador
 * Solo se puede ejecutar si no hay usuarios en la base de datos
 */
export async function POST(request: Request) {
  try {
    // Verificar si ya existen usuarios
    const existingUsers = await prisma.user.count()
    
    if (existingUsers > 0) {
      return NextResponse.json(
        { error: 'Ya existen usuarios en el sistema' },
        { status: 400 }
      )
    }

    const { username, password, name } = await request.json()

    if (!username || !password || !name) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      )
    }

    // Validaciones adicionales
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

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crear el usuario administrador
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        name,
        role: 'admin',
        active: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Usuario administrador creado exitosamente',
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error al inicializar usuario:', error)
    
    // Detectar errores de conexión a la base de datos
    const isConnectionError = 
      error?.message?.includes('DNS resolution') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.name === 'PrismaClientInitializationError'
    
    if (isConnectionError) {
      return NextResponse.json(
        { 
          error: 'Error de conexión a la base de datos',
          details: 'No se puede conectar a MongoDB. Verifica que:\n' +
                   '1. La cadena de conexión en .env sea correcta\n' +
                   '2. El cluster de MongoDB Atlas esté activo (si usas Atlas)\n' +
                   '3. MongoDB esté corriendo (si usas MongoDB local)\n' +
                   '4. Tu IP esté en la whitelist de MongoDB Atlas',
          connectionError: true
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al crear usuario', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Verifica si ya existe un usuario administrador
 */
export async function GET() {
  try {
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      initialized: userCount > 0,
      userCount,
    })
  } catch (error: any) {
    console.error('Error al verificar inicialización:', error)
    
    // Detectar errores de conexión a la base de datos
    const isConnectionError = 
      error?.message?.includes('DNS resolution') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.name === 'PrismaClientInitializationError'
    
    if (isConnectionError) {
      return NextResponse.json(
        { 
          error: 'Error de conexión a la base de datos',
          details: 'No se puede conectar a MongoDB. Verifica que:\n' +
                   '1. La cadena de conexión en .env sea correcta\n' +
                   '2. El cluster de MongoDB Atlas esté activo (si usas Atlas)\n' +
                   '3. MongoDB esté corriendo (si usas MongoDB local)\n' +
                   '4. Tu IP esté en la whitelist de MongoDB Atlas',
          connectionError: true
        },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Error al verificar sistema', details: error.message },
      { status: 500 }
    )
  }
}


