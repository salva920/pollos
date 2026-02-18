/**
 * Script para probar la API de tasa de cambio dolarvzla.com
 * Ejecutar: node scripts/test-tasa-api.js
 */

const API_URL = 'https://api.dolarvzla.com/public/bcv/exchange-rate'
const API_KEY = process.env.DOLAR_VZLA_API_KEY || '1b4b0b550b36d2f76119a733420390902bc073aa48b7e8273ac4ea33f90ee8d7'

async function testTasaAPI() {
  console.log('Probando API de tasa de cambio...')
  console.log('URL:', API_URL)
  console.log('Header: x-dolarvzla-key')
  console.log('')

  try {
    const res = await fetch(API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'x-dolarvzla-key': API_KEY,
      },
    })

    console.log('Status:', res.status, res.statusText)

    const data = await res.json()
    console.log('Respuesta:', JSON.stringify(data, null, 2))

    if (res.ok && data?.current?.usd != null) {
      console.log('')
      console.log('✓ Tasa USD (Bs por 1 USD):', data.current.usd)
      console.log('  Fecha:', data.current.date)
      if (data.current.eur != null) {
        console.log('  Tasa EUR:', data.current.eur)
      }
    } else if (!res.ok) {
      console.log('')
      console.log('✗ Error:', res.status, '- Revisa la API key y el header x-dolarvzla-key')
    }
  } catch (err) {
    console.error('Error:', err.message)
  }
}

testTasaAPI()
