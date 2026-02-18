/**
 * Formatea un número como moneda (Bs. o USD)
 */
export function formatCurrency(amount: number, currency: 'VES' | 'USD' = 'VES'): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Formatea una fecha de forma corta (DD/MM/YYYY HH:mm)
 */
export function formatDateShort(date: string | Date): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return 'Fecha inválida'
  }
  
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Calcula los días hasta una fecha de vencimiento
 */
export function daysUntilExpiration(expirationDate: string | Date): number {
  const expDate = new Date(expirationDate)
  const today = new Date()
  
  // Normalizar las fechas a medianoche
  expDate.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  
  const diffTime = expDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Obtiene el color para un estado (para badges de Chakra UI)
 */
export function getStatusColor(status: string): string {
  const statusColors: { [key: string]: string } = {
    // Estados de productos/lotes
    'activo': 'green',
    'proximo_vencer': 'orange',
    'vencido': 'red',
    
    // Estados de ventas
    'completada': 'green',
    'cancelada': 'red',
    'pendiente': 'yellow',
    
    // Estados de pago
    'pagado': 'green',
    'pendiente_pago': 'orange',
    
    // Por defecto
    'default': 'gray',
  }
  
  return statusColors[status.toLowerCase()] || statusColors['default']
}

/**
 * Formatea un número con separadores de miles
 */
export function formatNumber(num: number, decimals: number = 2): string {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

/**
 * Formatea una fecha completa (DD de MMMM de YYYY)
 */
export function formatDateLong(date: string | Date): string {
  const d = new Date(date)
  
  if (isNaN(d.getTime())) {
    return 'Fecha inválida'
  }
  
  return new Intl.DateTimeFormat('es-VE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d)
}

/**
 * Obtiene el nombre legible de una categoría
 */
export function getCategoryName(category: string): string {
  const categoryNames: { [key: string]: string } = {
    'pollo': 'Pollo',
    'huevos': 'Huevos',
    'queso': 'Queso',
    'lacteos': 'Lácteos',
    'viveres': 'Víveres',
    'embutidos': 'Embutidos',
    'carnes': 'Carnes',
    'bebidas': 'Bebidas',
    'granos': 'Granos',
    'enlatados': 'Enlatados',
    'condimentos': 'Condimentos',
    'otros': 'Otros',
  }
  
  return categoryNames[category.toLowerCase()] || category
}

/**
 * Genera un número de factura único basado en la fecha y hora actual
 */
export function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `F-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
}

/**
 * Obtiene el estado de un lote según su fecha de vencimiento
 */
export function getLoteStatus(expirationDate: string | Date): string {
  const diasRestantes = daysUntilExpiration(expirationDate)
  
  if (diasRestantes < 0) {
    return 'vencido'
  } else if (diasRestantes <= 7) {
    return 'proximo_vencer'
  } else {
    return 'activo'
  }
}

/**
 * Genera un número de lote único basado en la fecha y hora actual
 */
export function generateLoteNumber(): string {
  const now = new Date()
  const year = now.getFullYear().toString().slice(-2)
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  const seconds = now.getSeconds().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  return `LOTE-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`
}
