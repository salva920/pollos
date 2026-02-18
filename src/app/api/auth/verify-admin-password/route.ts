import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const KEY = 'admin_module_password'

/**
 * POST - Verificar la contraseña del módulo de administración
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const setting = await prisma.setting.findUnique({
      where: { key: KEY },
    })

    if (!setting?.value) {
      return NextResponse.json(
        { valid: false, error: 'La contraseña del módulo de administración no está configurada. Un administrador debe configurarla primero.' },
        { status: 400 }
      )
    }

    const { password } = await request.json()
    if (!password || typeof password !== 'string') {
      return NextResponse.json({ valid: false, error: 'Contraseña requerida' }, { status: 400 })
    }

    const valid = await bcrypt.compare(password, setting.value)
    return NextResponse.json({ valid })
  } catch (error: any) {
    console.error('Error al verificar contraseña:', error)
    return NextResponse.json(
      { error: 'Error al verificar contraseña', details: error.message },
      { status: 500 }
    )
  }
}
