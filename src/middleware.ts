import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decrypt } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value
  const isApiRoute = request.nextUrl.pathname.startsWith('/api')
  const isLoginPage = request.nextUrl.pathname === '/login'
  const isAuthApi = request.nextUrl.pathname.startsWith('/api/auth')
  const isHealthCheck = request.nextUrl.pathname === '/api/health'
  const isStaticFile = request.nextUrl.pathname.startsWith('/_next') || 
                      request.nextUrl.pathname === '/favicon.ico'

  // Permitir acceso a archivos estáticos, health check y auth API
  if (isStaticFile || isHealthCheck || isAuthApi) {
    return NextResponse.next()
  }

  // Si no hay token y no es página de login, redirigir
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay token, verificarlo
  if (token) {
    const session = await decrypt(token)
    
    // Token inválido o expirado
    if (!session) {
      // Si es API, retornar 401
      if (isApiRoute) {
        return NextResponse.json(
          { error: 'No autorizado' },
          { status: 401 }
        )
      }
      // Si es página, redirigir a login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('auth_token')
      return response
    }

    // Token válido, permitir acceso
    if (isLoginPage) {
      // Si ya está autenticado y trata de ir a login, redirigir al dashboard
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Agregar información del usuario a los headers para las API routes
    const response = NextResponse.next()
    response.headers.set('x-user-id', session.userId)
    response.headers.set('x-user-role', session.role)
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}


