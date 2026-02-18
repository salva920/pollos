# 🚀 Instrucciones de Inicio Rápido

## Pasos para ejecutar el proyecto

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar base de datos

**Opción A: MongoDB Local**
```bash
# Instalar MongoDB en tu sistema
# Windows: https://www.mongodb.com/try/download/community
# Asegúrate de que MongoDB esté corriendo
```

**Opción B: MongoDB Atlas (Cloud - Recomendado)**
1. Ir a https://www.mongodb.com/cloud/atlas
2. Crear una cuenta gratuita
3. Crear un nuevo cluster (M0 Free)
4. Crear un usuario de base de datos
5. Obtener la cadena de conexión

### 3. Configurar variables de entorno

Copiar el archivo `.env.example` a `.env`:

```bash
# En Windows PowerShell:
copy .env.example .env

# En Windows CMD:
copy .env.example .env
```

Editar el archivo `.env` y configurar:

```env
# Si usas MongoDB Atlas:
DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/alimentos_db"

# Si usas MongoDB Local:
DATABASE_URL="mongodb://localhost:27017/alimentos_db"

# Cambiar el JWT_SECRET (cualquier texto largo y seguro)
JWT_SECRET="mi_clave_super_secreta_123456789"
```

### 4. Generar Prisma Client y sincronizar base de datos

```bash
# Generar el cliente de Prisma
npx prisma generate

# Sincronizar con la base de datos
npx prisma db push
```

### 5. Iniciar el servidor de desarrollo

```bash
npm run dev
```

### 6. Abrir en el navegador

Ir a: http://localhost:3000

## ✅ Primer uso

1. **Crear usuario administrador**
   - La primera vez que abras la aplicación, te pedirá crear el primer usuario
   - Ingresa: nombre completo, usuario y contraseña
   - ¡Guarda bien estos datos!

2. **Configurar tasa de cambio**
   - En el dashboard, verás un componente de "Tasa de Cambio"
   - Haz clic en "Actualizar" e ingresa la tasa actual de Bs por USD

3. **Crear productos**
   - Ir a "Productos" → "Nuevo Producto"
   - Llenar la información básica
   - Importante: definir stock mínimo para alertas

4. **Crear clientes**
   - Ir a "Clientes" → "Nuevo Cliente"
   - Llenar información básica
   - Definir si es cliente detal o mayorista

5. **Crear proveedores**
   - Ir a "Proveedores" → "Nuevo Proveedor"
   - Llenar información de contacto

## 📝 Flujo de trabajo básico

### Para registrar una compra (Entrada de inventario):
Nota: Falta crear la interfaz de "Nueva Compra", pero el endpoint está listo.

```javascript
// POST /api/compras
{
  "proveedorId": "id_del_proveedor",
  "items": [
    {
      "productId": "id_del_producto",
      "cantidad": 10,
      "precioUnitario": 5.50,
      "precioVenta": 7.00,
      "fechaVencimiento": "2025-11-20"
    }
  ],
  "numeroFactura": "F-001",
  "moneda": "VES"
}
```

### Para registrar una venta:
1. Ir a "Ventas" → "Nueva Venta"
2. Seleccionar cliente
3. Agregar productos (solo aparecerán los que tienen stock)
4. El precio se llena automáticamente pero se puede cambiar
5. Seleccionar método de pago
6. Guardar

### Para registrar gastos:
1. Ir a "Administración" → pestaña "Gastos"
2. Clic en "Registrar Gasto"
3. Llenar información y guardar

### Para registrar mermas:
1. Ir a "Administración" → pestaña "Mermas"
2. Clic en "Registrar Merma"
3. Seleccionar producto, cantidad y motivo
4. El sistema descontará automáticamente del inventario

## 🔍 Verificar que todo funciona

### Probar las alertas de vencimiento:
1. Crear un producto perecedero
2. Registrar una compra con fecha de vencimiento en 2 días
3. En el dashboard, hacer clic en "Actualizar"
4. Deberías ver una alerta naranja con el producto próximo a vencer

### Probar el sistema FIFO:
1. Crear un producto
2. Registrar dos compras del mismo producto:
   - Compra 1: 10 unidades, vence en 30 días
   - Compra 2: 10 unidades, vence en 60 días
3. Hacer una venta de 15 unidades
4. Verificar que se descontaron las 10 de la compra 1 y 5 de la compra 2

## 🐛 Solución de problemas comunes

### Error: "Cannot connect to database"
- Verificar que MongoDB esté corriendo (si es local)
- Verificar que la URL de conexión en `.env` sea correcta
- Si es Atlas, verificar que tu IP esté en la whitelist

### Error: "Prisma Client not found"
```bash
npx prisma generate
```

### El servidor no inicia
- Verificar que el puerto 3000 no esté en uso
- Cerrar otras aplicaciones que usen ese puerto
- O cambiar el puerto en `.env`: `PORT=3001`

### No aparecen los productos en ventas
- Verificar que los productos tengan stock > 0
- Registrar una compra primero para agregar inventario

## 📊 Ver la base de datos

Para ver y editar datos directamente:

```bash
npx prisma studio
```

Esto abrirá una interfaz web en http://localhost:5555 donde puedes ver todas las tablas y datos.

## 🔄 Comandos útiles

```bash
# Ver logs de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar en producción
npm start

# Abrir Prisma Studio
npx prisma studio

# Resetear base de datos (¡CUIDADO! Borra todos los datos)
npx prisma db push --force-reset

# Ver esquema de base de datos
npx prisma format
```

## 📚 Recursos adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de Chakra UI](https://chakra-ui.com/docs)
- [MongoDB Atlas Tutorial](https://www.mongodb.com/basics/mongodb-atlas-tutorial)

## 💡 Consejos

1. **Haz backups regulares** de tu base de datos
2. **Configura la tasa de cambio** antes de hacer ventas en dólares
3. **Revisa las alertas diariamente** para evitar pérdidas por vencimiento
4. **Define stocks mínimos realistas** para cada producto
5. **Registra las mermas** para tener control real de pérdidas

## 🎯 Próximas mejoras sugeridas

- [ ] Página de "Nueva Compra" con interfaz gráfica
- [ ] Reportes en PDF de ventas y gastos
- [ ] Gráficos de ventas por período
- [ ] Sistema de roles más granular
- [ ] Notificaciones por email o WhatsApp
- [ ] App móvil con React Native
- [ ] Código de barras con scanner
- [ ] Impresión de etiquetas para productos

---

¿Necesitas ayuda? Revisa el README.md principal para más detalles.




