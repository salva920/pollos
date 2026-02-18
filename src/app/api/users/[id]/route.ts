import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import bcrypt from 'bcryptjs'

/**
 * PUT - Actualizar usuario (solo admin). name, role, active, y opcionalmente password.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede editar usuarios' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { name, role, active, password } = body

    const validRoles = ['admin', 'vendedor', 'almacen']
    const updateData: { name?: string; role?: string; active?: boolean; password?: string } = {}

    if (name !== undefined && name.trim()) updateData.name = name.trim()
    if (role !== undefined && validRoles.includes(role)) updateData.role = role
    if (typeof active === 'boolean') updateData.active = active
    if (password !== undefined && password !== '') {
      if (password.length < 6) {
        return NextResponse.json(
          { error: 'La contraseña debe tener al menos 6 caracteres' },
          { status: 400 }
        )
      }
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    console.error('Error al actualizar usuario:', error)
    return NextResponse.json(
      { error: 'Error al actualizar usuario', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * DELETE - No permitimos eliminar usuarios por integridad; en su lugar se desactiva.
 * Si quieres permitir borrado físico, se puede añadir.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede desactivar usuarios' }, { status: 403 })
    }

    const { id } = await params

    await prisma.user.update({
      where: { id },
      data: { active: false },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }
    console.error('Error al desactivar usuario:', error)
    return NextResponse.json(
      { error: 'Error al desactivar usuario', details: error.message },
      { status: 500 }
    )
  }
}
