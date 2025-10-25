# 🚀 Deployment en Vercel - SpeechAI Frontend

## Pasos para Deployar

### 1. **Preparar el Proyecto**

Este proyecto ya está listo para Vercel. Los archivos necesarios ya están configurados:
- ✅ `vercel.json` - Configuración de Vercel
- ✅ `.env.example` - Variables de entorno

### 2. **Conectar con Vercel**

#### Opción A: Desde la Web de Vercel (Recomendado)

1. Ve a [vercel.com](https://vercel.com)
2. Click en "Add New Project"
3. Importa este repositorio de GitHub
4. Vercel detectará automáticamente que es un proyecto Vite

#### Opción B: Desde la CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy desde la terminal
vercel
```

### 3. **Configurar Variables de Entorno**

En el dashboard de Vercel, ve a:
**Project Settings → Environment Variables**

Agrega esta variable:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_API_BASE` | URL de tu backend | Production, Preview, Development |

**Ejemplos de URLs de backend:**
```
https://tu-backend.railway.app
https://tu-backend.onrender.com
https://tu-backend-api.fly.dev
```

⚠️ **IMPORTANTE**: La URL debe ser HTTPS (no HTTP) en producción.

### 4. **Deploy**

Vercel automáticamente:
- ✅ Detecta cambios en tu repositorio
- ✅ Ejecuta `npm install`
- ✅ Ejecuta `npm run build`
- ✅ Deploya el contenido de `/dist`

### 5. **Verificar el Deployment**

1. Abre la URL que Vercel te proporciona (ej: `tu-proyecto.vercel.app`)
2. Verifica que el logo cargue
3. Intenta iniciar sesión
4. Verifica la conexión con el backend

---

## 🔧 Configuración Adicional

### Dominios Personalizados

1. Ve a **Project Settings → Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones de DNS

### Variables de Entorno Adicionales (Opcionales)

```env
VITE_WS_URL=wss://tu-backend.com
VITE_CALL_POLLING_INTERVAL=5000
VITE_MAX_FILE_SIZE_MB=10
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"

**Solución:**
1. Verifica que `VITE_API_BASE` esté configurada
2. Asegúrate que tu backend permita CORS desde tu dominio de Vercel
3. Verifica que el backend esté en HTTPS

### Error: 404 al recargar la página

**Solución:**
El archivo `vercel.json` ya tiene la configuración de rewrites. Si aún así falla:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### Error de build

**Solución:**
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📦 Estructura del Build

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── logo.svg
```

---

## 🔄 Actualizar el Deployment

### Automático (Recomendado)
Simplemente haz push a tu rama principal:
```bash
git add .
git commit -m "Update frontend"
git push origin master
```

Vercel detectará el cambio y redeploya automáticamente.

### Manual
```bash
vercel --prod
```

---

## 🌐 URLs Generadas

- **Production**: `https://tu-proyecto.vercel.app`
- **Preview**: Una URL única por cada PR/branch
- **Development**: Tu ambiente local

---

## ✅ Checklist Pre-Deployment

- [ ] Backend está deployado y accesible
- [ ] Backend acepta CORS desde `*.vercel.app`
- [ ] `VITE_API_BASE` apunta a backend en HTTPS
- [ ] Proyecto compila sin errores (`npm run build`)
- [ ] Variables de entorno configuradas en Vercel
- [ ] Logo (`public/logo.svg`) existe

---

## 🎯 Resultado Esperado

Después del deployment exitoso, deberías poder:
- ✅ Acceder a la aplicación desde tu URL de Vercel
- ✅ Ver el login con el logo de SpeechAI
- ✅ Iniciar sesión
- ✅ Ver el dashboard con datos del backend
- ✅ Crear/editar cuentas y campañas

---

## 🔒 Seguridad

### CORS en el Backend

Asegúrate que tu backend FastAPI permita tu dominio de Vercel:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://tu-proyecto.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en el dashboard de Vercel
2. Verifica la consola del navegador (F12)
3. Revisa la red (Network tab) para errores de API
