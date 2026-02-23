/**
 * Script para eliminar todos los datos de negocio y dejar la base lista para pruebas.
 * Mantiene: User (usuarios) y Setting (configuración como contraseña de administración).
 *
 * Uso (desde la raíz del proyecto):
 *   npm run reset-data
 * o
 *   node scripts/reset-data.js
 *
 * Requiere .env con DATABASE_URL.
 */

const path = require('path')

// Cargar variables de entorno desde .env en la raíz del proyecto
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function resetData() {
  console.log('Iniciando reseteo de datos...\n')

  try {
    // Orden: eliminar primero entidades que dependen de otras
    const steps = [
      { name: 'SaleItem', fn: () => prisma.saleItem.deleteMany() },
      { name: 'Sale', fn: () => prisma.sale.deleteMany() },
      { name: 'Transaccion', fn: () => prisma.transaccion.deleteMany() },
      { name: 'Gasto', fn: () => prisma.gasto.deleteMany() },
      { name: 'Merma', fn: () => prisma.merma.deleteMany() },
      { name: 'CompraItem', fn: () => prisma.compraItem.deleteMany() },
      { name: 'Compra', fn: () => prisma.compra.deleteMany() },
      { name: 'LoteProducto', fn: () => prisma.loteProducto.deleteMany() },
      { name: 'Product', fn: () => prisma.product.deleteMany() },
      { name: 'Customer', fn: () => prisma.customer.deleteMany() },
      { name: 'Proveedor', fn: () => prisma.proveedor.deleteMany() },
      { name: 'TasaCambio', fn: () => prisma.tasaCambio.deleteMany() },
      { name: 'Alerta', fn: () => prisma.alerta.deleteMany() },
    ]

    for (const { name, fn } of steps) {
      const result = await fn()
      const count = result?.count ?? 0
      console.log(`  ${name}: ${count} registro(s) eliminado(s)`)
    }

    console.log('\nReseteo completado. Se mantienen: User, Setting.')
    console.log('Puedes iniciar sesión y probar todos los módulos desde cero.\n')
  } catch (error) {
    console.error('Error durante el reseteo:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

resetData()
