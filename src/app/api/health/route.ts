import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Endpoint de diagnóstico de salud de la base de datos
 */
export async function GET() {
  try {
    // Intentar una consulta simple
    await prisma.$connect()
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      userCount,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    const isConnectionError = 
      error?.message?.includes('DNS resolution') ||
      error?.message?.includes('connection') ||
      error?.message?.includes('ECONNREFUSED') ||
      error?.name === 'PrismaClientInitializationError'
    
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: isConnectionError ? 'connection_error' : 'unknown_error',
        message: error.message,
        details: isConnectionError 
          ? 'No se puede conectar a MongoDB. Verifica la configuración en .env'
          : error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
