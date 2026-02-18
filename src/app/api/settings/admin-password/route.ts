import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const KEY = 'admin_module_password'

/**
 * GET - Verificar si la contraseña del módulo de administración está configurada
 */
export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const setting = await prisma.setting.findUnique({
      where: { key: KEY },
    })

    return NextResponse.json({
      configured: !!setting?.value,
    })
  } catch (error: any) {
    console.error('Error al verificar configuración:', error)
    return NextResponse.json(
      { error: 'Error al verificar configuración', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST - Establecer o cambiar la contraseña del módulo de administración (solo admin)
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede configurar esta contraseña' }, { status: 403 })
    }

    const { password } = await request.json()
    if (!password || typeof password !== 'string' || password.length < 4) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 4 caracteres' },
        { status: 400 }
      )
    }

    const hash = await bcrypt.hash(password, 10)

    await prisma.setting.upsert({
      where: { key: KEY },
      create: { key: KEY, value: hash },
      update: { value: hash },
    })

    return NextResponse.json({ success: true, message: 'Contraseña configurada correctamente' })
  } catch (error: any) {
    console.error('Error al configurar contraseña:', error)
    return NextResponse.json(
      { error: 'Error al configurar contraseña', details: error.message },
      { status: 500 }
    )
  }
}
