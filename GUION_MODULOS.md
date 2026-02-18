# Guion breve – Demostración de módulos (Sistema de Alimentos)

## 1. Dashboard
- **Qué mostrar:** Vista principal con resumen del negocio.
- **Guion:** "En el Dashboard vemos ventas del día, productos en stock, total de ventas y productos más vendidos. También aparecen alertas de productos próximos a vencer y de stock bajo. Desde aquí podemos ir a Nueva Venta o refrescar la información."

---

## 2. Productos
- **Qué mostrar:** Listado de productos, agregar/editar producto, entrada de lotes.
- **Guion:** "En Productos gestionamos el catálogo: nombre, categoría, precio inicial, precio de venta y ganancia. Podemos asignar proveedor desde la lista del módulo de proveedores. El botón Entrada permite registrar un nuevo lote con cantidad, precio de compra y fechas. El listado muestra precios en USD con referencia en bolívares."

---

## 3. Ventas
- **Qué mostrar:** Historial de ventas y luego "Nueva Venta" (procesador de ventas).
- **Guion:** "Ventas tiene dos partes: el historial con factura, cliente, total, ganancia y estado; y Nueva Venta, que abre una vista completa. Ahí elegimos cliente (búsqueda por nombre o cédula o creamos uno nuevo), agregamos productos desde la lista, vemos lotes y totales en USD con referencia en Bs, y al finalizar confirmamos el pago con método y tipo (efectivo, transferencia, punto; Bs o USD)."

---

## 4. Clientes
- **Qué mostrar:** Lista de clientes, crear y editar cliente.
- **Guion:** "En Clientes registramos nombre, cédula, teléfono, email, dirección y tipo (detal o mayorista). Podemos buscar, crear y editar. Estos clientes aparecen al procesar una venta."

---

## 5. Proveedores
- **Qué mostrar:** Lista de proveedores, crear y editar.
- **Guion:** "En Proveedores guardamos nombre, RIF, teléfono, email, dirección y contacto. Esta lista se usa en el formulario de productos para asignar el proveedor de cada producto."

---

## 6. Administración
- **Qué mostrar:** Acceso con contraseña, tasa de cambio, caja, gastos, mermas.
- **Guion:** "Administración está protegido con contraseña. Aquí configuramos la tasa de cambio Bs/USD, vemos el estado de caja, registramos gastos por categoría y mermas o desperdicios. Es el centro de control financiero."

---

## 7. Usuarios
- **Qué mostrar:** Lista de usuarios/empleados y roles (si aplica).
- **Guion:** "En Usuarios gestionamos empleados y sus roles: admin, vendedor, almacén. Solo usuarios autorizados pueden acceder a cada módulo."

---

## 8. Alertas
- **Qué mostrar:** Centro de alertas (vencimientos, stock bajo).
- **Guion:** "En Alertas vemos un resumen de productos próximos a vencer, vencidos y stock bajo. Así actuamos a tiempo sobre inventario y ventas."

---

## Orden sugerido para la demo (5–8 min)
1. **Dashboard** – Resumen y flujo principal (Nueva Venta).
2. **Ventas → Nueva Venta** – Cliente, productos, lotes, total, pago.
3. **Productos** – Alta de producto, proveedor, entrada de lote.
4. **Clientes** – Alta de cliente (y mencionar que se usa en ventas).
5. **Proveedores** – Alta de proveedor (y mencionar que se usa en productos).
6. **Administración** – Tasa de cambio y caja (breve).
7. **Alertas** – Revisión rápida de notificaciones.
8. **Usuarios** – Solo si el público necesita ver gestión de acceso.
