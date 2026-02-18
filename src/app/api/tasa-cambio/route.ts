import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

/**
 * Obtener tasa de cambio desde API externa
 */
async function obtenerTasaDesdeAPI(): Promise<number | null> {
  try {
    const apiKey = process.env.DOLAR_VZLA_API_KEY
    const baseUrl = 'https://api.dolarvzla.com/public/bcv/exchange-rate'

    if (!apiKey) {
      console.warn('DOLAR_VZLA_API_KEY no configurada')
      return null
    }

    // API dolarvzla.com usa header x-dolarvzla-key
    const response = await fetch(baseUrl, {
      headers: {
        'Content-Type': 'application/json',
        'x-dolarvzla-key': apiKey,
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.warn('API tasa de cambio: 401 Unauthorized. Revisa DOLAR_VZLA_API_KEY o usa tasa manual.')
      } else {
        console.error('Error al obtener tasa desde API externa:', response.status, response.statusText)
      }
      return null
    }

    const data = await response.json()

    // Formato documentado: { current: { usd, eur, date }, previous, changePercentage }
    let tasa: number | null = null
    if (data?.current?.usd != null) {
      tasa = parseFloat(data.current.usd)
    } else if (typeof data === 'number') {
      tasa = data
    } else if (data.rate) {
      tasa = parseFloat(data.rate)
    } else if (data.tasa) {
      tasa = parseFloat(data.tasa)
    } else if (data.usd) {
      tasa = parseFloat(data.usd)
    } else if (data.data?.rate) {
      tasa = parseFloat(data.data.rate)
    } else if (data.exchangeRate) {
      tasa = parseFloat(data.exchangeRate)
    } else if (data.value) {
      tasa = parseFloat(data.value)
    } else if (data.bcv) {
      tasa = parseFloat(data.bcv)
    } else if (Array.isArray(data) && data.length > 0) {
      const first = data[0]
      tasa = typeof first === 'number' ? first : parseFloat(first.rate || first.value || first.tasa || first)
    }

    if (tasa && tasa > 0) {
      return tasa
    }

    return null
  } catch (error: any) {
    console.error('Error al obtener tasa desde API externa:', error.message)
    return null
  }
}

/**
 * GET - Obtener la tasa de cambio actual
 * Intenta obtener desde la API externa, si falla usa la última guardada en BD
 */
export async function GET() {
  try {
    // Intentar obtener desde API externa primero
    let tasaAPI: number | null = null
    try {
      tasaAPI = await obtenerTasaDesdeAPI()
    } catch (e) {
      console.warn('obtenerTasaDesdeAPI error:', e)
    }

    if (tasaAPI && tasaAPI > 0) {
      // Guardar automáticamente la tasa obtenida de la API (no obligatorio)
      try {
        await prisma.tasaCambio.create({
          data: {
            tasa: tasaAPI,
          },
        })
      } catch (error) {
        console.warn('No se pudo guardar la tasa de la API:', error)
      }

      return NextResponse.json({
        tasa: tasaAPI,
        fecha: new Date().toISOString(),
        fuente: 'api',
      })
    }

    // Si la API falla, usar la última tasa guardada en BD
    let tasaCambio: { id?: string; tasa: number; fecha: Date } | null = null
    try {
      tasaCambio = await prisma.tasaCambio.findFirst({
        orderBy: {
          fecha: 'desc',
        },
      })
    } catch (dbError: any) {
      console.error('Error BD al obtener tasa:', dbError?.message || dbError)
      return NextResponse.json(
        { tasa: 0, fecha: new Date().toISOString(), fuente: 'bd' },
        { status: 200 }
      )
    }

    if (tasaCambio) {
      return NextResponse.json({
        id: tasaCambio.id,
        tasa: Number(tasaCambio.tasa),
        fecha: tasaCambio.fecha instanceof Date ? tasaCambio.fecha.toISOString() : tasaCambio.fecha,
        fuente: 'bd',
      })
    }

    return NextResponse.json({
      tasa: 0,
      fecha: new Date().toISOString(),
      fuente: 'bd',
    })
  } catch (error: any) {
    console.error('Error al obtener tasa de cambio:', error)
    return NextResponse.json(
      { error: 'Error al obtener tasa de cambio', details: error?.message || String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST - Actualizar la tasa de cambio manualmente
 */
export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { tasa } = await request.json()

    if (!tasa || tasa <= 0) {
      return NextResponse.json(
        { error: 'Tasa inválida' },
        { status: 400 }
      )
    }

    const tasaCambio = await prisma.tasaCambio.create({
      data: {
        tasa: parseFloat(tasa),
      },
    })

    return NextResponse.json(tasaCambio, { status: 201 })
  } catch (error: any) {
    console.error('Error al actualizar tasa de cambio:', error)
    return NextResponse.json(
      { error: 'Error al actualizar tasa de cambio', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PUT - Sincronizar tasa de cambio desde API externa
 */
export async function PUT() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const tasaAPI = await obtenerTasaDesdeAPI()

    if (!tasaAPI) {
      return NextResponse.json(
        { error: 'No se pudo obtener la tasa desde la API externa' },
        { status: 500 }
      )
    }

    const tasaCambio = await prisma.tasaCambio.create({
      data: {
        tasa: tasaAPI,
      },
    })

    return NextResponse.json({
      ...tasaCambio,
      fuente: 'api',
    })
  } catch (error: any) {
    console.error('Error al sincronizar tasa de cambio:', error)
    return NextResponse.json(
      { error: 'Error al sincronizar tasa de cambio', details: error.message },
      { status: 500 }
    )
  }
}




