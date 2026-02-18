# Comandos para subir el proyecto al repo

Ejecuta estos comandos en Git Bash (o terminal) desde la carpeta `alimentos-app`:

```bash
# 1. Agregar todos los archivos (respeta .gitignore: no sube .env ni node_modules)
git add .

# 2. Ver qué se va a subir (opcional)
git status

# 3. Hacer commit con todo el proyecto
git commit -m "Proyecto completo - Sistema de Alimentos"

# 4. Subir a GitHub
git push -u origin main
```

**Importante:** El archivo `.env` no se sube porque está en `.gitignore`. En Vercel (o en otro servidor) tendrás que configurar `DATABASE_URL` y `JWT_SECRET` como variables de entorno.
