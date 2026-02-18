# Despliegue en Vercel – Sistema de Alimentos

## Requisitos previos

- Cuenta en [Vercel](https://vercel.com)
- Repositorio en GitHub, GitLab o Bitbucket (recomendado)
- **MongoDB Atlas** (recomendado para producción): base de datos en la nube
- Variables de entorno listas (ver más abajo)

---

## 1. Subir el proyecto a Git

Si aún no está en un repositorio:

```bash
git init
git add .
git commit -m "Initial commit - Sistema Alimentos"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/alimentos-app.git
git push -u origin main
```

---

## 2. Crear proyecto en Vercel

1. Entra en [vercel.com](https://vercel.com) e inicia sesión.
2. **Add New** → **Project**.
3. Importa el repositorio (conecta GitHub/GitLab/Bitbucket si hace falta).
4. Vercel detecta **Next.js** automáticamente.
5. No cambies **Framework Preset** (Next.js).
6. **Build Command:** `npm run build` (por defecto).
7. **Output Directory:** `.next` (por defecto).
8. **Install Command:** `npm install` (por defecto).

---

## 3. Variables de entorno en Vercel

En el proyecto de Vercel: **Settings** → **Environment Variables**.

Añade estas variables para **Production**, **Preview** y **Development** (o solo Production si no usas preview/development):

| Variable        | Descripción                    | Ejemplo |
|----------------|---------------------------------|--------|
| `DATABASE_URL` | Cadena de conexión de MongoDB   | `mongodb+srv://user:pass@cluster.mongodb.net/alimentos_db?retryWrites=true&w=majority` |
| `JWT_SECRET`   | Clave secreta para JWT (mín. 32 caracteres) | Una cadena larga y aleatoria |

### Cómo obtener `DATABASE_URL` (MongoDB Atlas)

1. Entra en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Crea un cluster (o usa uno existente).
3. **Database Access** → crear usuario con contraseña.
4. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) para que Vercel pueda conectar.
5. **Database** → **Connect** → **Connect your application** → copia la URI y sustituye `<password>` por la contraseña del usuario.

### Generar `JWT_SECRET`

En tu máquina (PowerShell o terminal):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y pégalo en `JWT_SECRET` en Vercel.

---

## 4. Desplegar

1. Haz clic en **Deploy**.
2. Espera a que termine el build (incluye `prisma generate` y `next build`).
3. Si algo falla, revisa los logs en la pestaña **Deployments** → el despliegue fallido → **Building**.

---

## 5. Base de datos (schema Prisma)

El código **no** ejecuta `prisma db push` en Vercel. El esquema de la base de datos debes aplicarlo tú:

**Opción A – Desde tu máquina (recomendado):**

1. En tu PC, crea un `.env` con la misma `DATABASE_URL` que usa producción (MongoDB Atlas).
2. Ejecuta una sola vez (o cuando cambies el schema):

```bash
npx prisma db push
```

**Opción B – Desde Vercel (Build):**

Si quisieras aplicar el schema en cada build (no recomendado en producción), podrías cambiar el script de build a algo como `prisma generate && prisma db push && next build`. Normalmente es mejor aplicar migraciones/push desde tu entorno local o desde un CI/CD controlado.

---

## 6. Dominio y HTTPS

- Vercel asigna un dominio tipo `tu-proyecto.vercel.app`.
- En **Settings** → **Domains** puedes añadir tu propio dominio.
- HTTPS viene activado por defecto.

---

## 7. Resumen de archivos de configuración

- **`vercel.json`**: define `buildCommand` con `prisma generate && next build` y el framework Next.js.
- **`package.json`**: script `postinstall`: `prisma generate` para que el cliente de Prisma esté disponible tras `npm install`.

Con esto el proyecto queda configurado para desplegar en Vercel usando Next.js, Prisma y MongoDB Atlas.
