import { NextResponse } from 'next/server'
import { clearSession } from '@/lib/auth'

export async function POST() {
  try {
    await clearSession()

    return NextResponse.json({
      message: 'Sesión cerrada exitosamente',
    })
  } catch (error: any) {
    console.error('Error al cerrar sesión:', error)
    return NextResponse.json(
      { error: 'Error al cerrar sesión', details: error.message },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}




