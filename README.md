# 🥚 Sistema de Gestión de Alimentos

Sistema web completo para la gestión de inventario, ventas y finanzas de productos alimenticios perecederos (pollo, huevos, queso, lácteos y víveres).

## 🌟 Características Principales

### 📦 Gestión de Inventario
- Control de productos con categorías específicas de alimentos
- Sistema de lotes con fechas de vencimiento
- **Sistema FIFO** (First In, First Out) automático para ventas
- Alertas automáticas de productos próximos a vencer
- Control de stock mínimo con notificaciones
- Soporte para productos perecederos y no perecederos
- Gestión de productos que requieren refrigeración

### 💰 Gestión de Ventas
- Registro rápido de ventas con múltiples productos
- Descuento automático de stock usando FIFO
- Cálculo automático de ganancias por venta
- Soporte para múltiples métodos de pago (efectivo, transferencia, punto)
- Soporte para pagos en bolívares y dólares
- Historial completo de ventas con filtros
- Generación automática de número de factura

### 👥 Gestión de Clientes
- Registro completo de clientes (detal y mayorista)
- Historial de compras por cliente
- Búsqueda rápida por nombre o cédula

### 🚚 Gestión de Proveedores
- Registro de proveedores con información completa
- Registro de compras a proveedores
- Creación automática de lotes al registrar compras
- Historial de compras por proveedor

### 📊 Módulo Financiero
- Control de caja en tiempo real
- Registro de gastos por categorías
- Registro de mermas y desperdicios
- Historial de transacciones
- Tasa de cambio configurable (Bs/USD)
- Reportes de entrada y salida de dinero

### 🔔 Sistema de Alertas
- Alertas de productos próximos a vencer (3-7 días)
- Alertas de productos vencidos
- Alertas de stock bajo
- Centro de notificaciones con prioridades

### 🔐 Seguridad
- Sistema de autenticación con JWT
- Middleware de protección de rutas
- Roles de usuario (admin, vendedor, almacén)
- Sesiones seguras con cookies HTTP-only

## 🛠️ Stack Tecnológico

- **Frontend:** Next.js 14 (App Router)
- **UI:** Chakra UI
- **Base de Datos:** MongoDB
- **ORM:** Prisma
- **Autenticación:** JWT (Jose)
- **Estado:** TanStack Query (React Query)
- **Lenguaje:** TypeScript

## 📋 Requisitos Previos

- Node.js 18.x o superior
- MongoDB (local o Atlas)
- npm o yarn

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd alimentos-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
# Base de datos MongoDB
DATABASE_URL="mongodb://localhost:27017/alimentos_db"
# O usar MongoDB Atlas:
# DATABASE_URL="mongodb+srv://usuario:password@cluster.mongodb.net/alimentos_db"

# JWT Secret para autenticación
JWT_SECRET="tu_clave_secreta_muy_segura_cambiar_en_produccion"

# URL de la aplicación
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Generar el cliente de Prisma

```bash
npx prisma generate
```

### 5. Sincronizar con la base de datos

```bash
npx prisma db push
```

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📖 Uso

### Primer Inicio

1. Al abrir la aplicación por primera vez, serás redirigido a la página de inicialización
2. Crea el primer usuario administrador
3. Inicia sesión con las credenciales creadas

### Configuración Inicial

1. **Configurar Tasa de Cambio**: En el dashboard principal, actualiza la tasa de cambio Bs/USD
2. **Registrar Proveedores**: Ve a "Proveedores" y registra tus proveedores
3. **Crear Productos**: Ve a "Productos" y crea tu catálogo de productos
4. **Registrar Clientes**: Ve a "Clientes" y registra tus clientes

### Flujo de Trabajo Recomendado

#### 1. Registrar una Compra a Proveedor
- Crear un endpoint `/compras/nueva` (similar a ventas)
- Seleccionar proveedor
- Agregar productos con cantidades y fechas de vencimiento
- El sistema creará automáticamente los lotes con sistema FIFO

#### 2. Registrar una Venta
- Ir a "Ventas" → "Nueva Venta"
- Seleccionar cliente
- Agregar productos (el sistema mostrará solo productos con stock)
- El sistema descontará automáticamente usando FIFO (lotes más antiguos primero)
- Seleccionar método y tipo de pago
- Guardar venta

#### 3. Monitorear Alertas
- Revisar diariamente el "Centro de Alertas"
- El sistema verificará automáticamente vencimientos
- Actuar sobre productos próximos a vencer

#### 4. Registrar Mermas
- Ir a "Administración" → pestaña "Mermas"
- Registrar productos vencidos o deteriorados
- El sistema descontará automáticamente del inventario

## 📁 Estructura del Proyecto

```
alimentos-app/
├── prisma/
│   └── schema.prisma          # Esquema de base de datos
├── src/
│   ├── app/
│   │   ├── (main)/            # Páginas principales (con navbar)
│   │   │   ├── page.tsx       # Dashboard
│   │   │   ├── productos/     # Gestión de productos
│   │   │   ├── ventas/        # Gestión de ventas
│   │   │   ├── clientes/      # Gestión de clientes
│   │   │   ├── proveedores/   # Gestión de proveedores
│   │   │   ├── alertas/       # Centro de alertas
│   │   │   └── administracion/ # Módulo financiero
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Autenticación
│   │   │   ├── products/      # CRUD productos
│   │   │   ├── sales/         # CRUD ventas
│   │   │   ├── customers/     # CRUD clientes
│   │   │   ├── proveedores/   # CRUD proveedores
│   │   │   ├── compras/       # CRUD compras
│   │   │   ├── lotes/         # Gestión de lotes
│   │   │   ├── alertas/       # Gestión de alertas
│   │   │   ├── gastos/        # CRUD gastos
│   │   │   ├── mermas/        # CRUD mermas
│   │   │   └── tasa-cambio/   # Tasa de cambio
│   │   ├── components/        # Componentes reutilizables
│   │   ├── login/             # Página de login
│   │   └── providers.tsx      # Providers de contexto
│   ├── lib/
│   │   ├── prisma.ts          # Cliente de Prisma
│   │   ├── auth.ts            # Utilidades de autenticación
│   │   └── utils.ts           # Utilidades generales
│   └── middleware.ts          # Middleware de autenticación
├── .env                       # Variables de entorno
├── package.json
└── README.md
```

## 🗄️ Modelos de Datos

### Product (Producto)
- Información básica del producto
- Categoría y subcategoría
- Precio por unidad
- Stock actual y mínimo
- Características de perecedero
- Vida útil en días

### LoteProducto (Lote)
- Número de lote
- Stock actual del lote
- Precio de compra y venta
- Fecha de ingreso y vencimiento
- Estado (activo, próximo_vencer, vencido)

### Customer (Cliente)
- Información de contacto
- Tipo (detal o mayorista)

### Sale (Venta)
- Cliente asociado
- Items de venta
- Total y ganancia
- Método y tipo de pago
- Número de factura único

### Proveedor
- Información de contacto
- Productos que suministra

### Compra
- Proveedor asociado
- Items de compra
- Total y moneda

### Gasto
- Concepto y categoría
- Monto y moneda

### Merma
- Producto y cantidad
- Motivo y costo

### Transaccion (Caja)
- Entrada y salida de dinero
- Saldo acumulado
- Tipo de transacción

## 🔑 Características Clave

### Sistema FIFO Automático

El sistema implementa FIFO (First In, First Out) automáticamente en cada venta:

1. Al registrar una compra, se crea un lote con fecha de vencimiento
2. Al hacer una venta, el sistema busca los lotes del producto ordenados por fecha de vencimiento (más antiguos primero)
3. Descuenta primero de los lotes más antiguos
4. Si un lote no es suficiente, continúa con el siguiente

Esto asegura que siempre se vendan primero los productos más antiguos, minimizando pérdidas por vencimiento.

### Verificación Automática de Vencimientos

El sistema verifica automáticamente:

- **Lotes próximos a vencer** (3-7 días): Genera alertas de prioridad alta
- **Lotes vencidos**: Genera alertas críticas y marca el lote como vencido
- Se ejecuta automáticamente al cargar el dashboard
- Puede ejecutarse manualmente desde el botón "Actualizar"

### Control de Stock en Tiempo Real

- El stock se actualiza automáticamente con cada venta
- Se descuenta del stock total del producto y del lote específico
- Alertas automáticas cuando el stock llega al mínimo

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start

# Prisma
npm run prisma:generate  # Generar cliente
npm run prisma:push      # Sincronizar con BD
npm run prisma:studio    # Abrir Prisma Studio

# Linting
npm run lint
```

## 🚀 Despliegue en Vercel

1. Crear una cuenta en [Vercel](https://vercel.com)
2. Conectar el repositorio de GitHub
3. Configurar las variables de entorno:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `NEXT_PUBLIC_APP_URL`
4. Desplegar

## 📝 Notas Importantes

### Categorías de Productos

El sistema viene configurado con 5 categorías principales:
- **Pollo**: Incluye pollo entero, pechuga, muslo, etc.
- **Huevos**: Blancos, rojos, de codorniz
- **Queso**: Blanco, amarillo, ricota, etc.
- **Lácteos**: Leche, yogurt, mantequilla, crema
- **Víveres**: Arroz, pasta, harina, granos, etc.

### Unidades de Medida

- **kg**: Kilogramo (para productos pesados)
- **unidad**: Piezas individuales
- **docena**: Conjunto de 12 unidades
- **litro**: Para líquidos
- **paquete**: Para productos empaquetados
- **gramos**: Para cantidades pequeñas

### Consideraciones de Seguridad

- Cambiar el `JWT_SECRET` en producción
- Usar HTTPS en producción
- Configurar CORS adecuadamente
- Implementar rate limiting en APIs
- Hacer backups regulares de la base de datos

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para soporte o consultas, por favor abre un issue en el repositorio.

---

**Desarrollado con ❤️ para la gestión eficiente de negocios de alimentos**




# pollos
