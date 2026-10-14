# 🐋 Docker - Frontend SpeechAI

Este Dockerfile está configurado para:
- ✅ Vite + React + TypeScript
- ✅ Build optimizado multi-stage
- ✅ Nginx como servidor web
- ✅ Proxy reverso para `/api`
- ✅ Configuración SPA (Single Page App)

---

## 🚀 Uso con Docker Compose

Desde la carpeta `speechAi_backend`:
```cmd
docker-compose up -d
```

El frontend estará disponible en: http://localhost:3000

---

## 🏗️ Build Manual (Opcional)

Si quieres construir solo el frontend:

```cmd
REM Construir imagen
docker build -t speechai-frontend .

REM Ejecutar contenedor
docker run -p 3000:80 speechai-frontend
```

---

## ⚙️ Variables de Entorno

El frontend usa `VITE_API_URL` para conectarse al backend.

Se configura en `docker-compose.yml`:
```yaml
environment:
  VITE_API_URL: http://localhost:8000
```

---

## 📦 Estructura del Build

```
Frontend Container
├── Node 18 Alpine (build stage)
│   ├── npm ci (instalar deps)
│   ├── npm run build (genera /dist)
│   └── Optimizado y minificado
└── Nginx Alpine (serve stage)
    ├── /dist → /usr/share/nginx/html
    ├── Proxy /api → backend:8000
    └── SPA routing configurado
```

---

## 🔧 Configuración Nginx

El Dockerfile incluye configuración automática para:
- ✅ Routing SPA: todas las rutas → index.html
- ✅ Proxy reverso: `/api/*` → `http://backend:8000`
- ✅ WebSocket support (para futuras features)
- ✅ Health check en puerto 80

---

## 🐛 Troubleshooting

### Build falla
```cmd
REM Limpiar node_modules y reinstalar
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### API no conecta
Verifica que el backend esté corriendo:
```cmd
docker-compose ps backend
curl http://localhost:8000/health
```

---

¡Todo listo! Este Dockerfile no necesita modificaciones.
