# SpeechAI Campaign Manager

Frontend completo en React + Vite + TypeScript para gestionar campañas/lotes de llamadas automatizadas con IA.

## 🚀 Características

- **Wizard de creación**: Upload Excel → mapping columnas → validación → crear campaña
- **Gestión de campañas**: Ver, pausar, reanudar, eliminar batches
- **Monitoreo en tiempo real**: WebSocket/SSE para llamadas en progreso
- **Gestión de contactos**: Importar, exportar, buscar, filtros
- **Jobs y reintentos**: Ver transcripciones, análisis NLP, reintentar manualmente
- **Reportes**: Generar y descargar Excel/JSON
- **Panel admin**: Estado de workers, configuración
- **Autenticación**: Login con JWT, roles (admin/operator)

## 🛠️ Stack Tecnológico

- **React 18** + **Vite** + **TypeScript**
- **React Router v6** para navegación
- **TanStack Query** para server state management
- **Axios** con interceptores para API calls
- **React Hook Form + Yup** para formularios y validaciones
- **Zustand** para estado local/UI
- **react-dropzone** para uploads
- **Recharts** para gráficos y estadísticas
- **TanStack Table** para tablas virtualizadas
- **MSW** para mocking de API durante desarrollo
- **Jest + RTL** para testing
- **Storybook** para componentes

## 🏃‍♂️ Inicio Rápido

### Prerrequisitos

```bash
Node.js >= 18
npm >= 8
```

### Instalación

```bash
# Clonar el proyecto
git clone <repo-url>
cd speechai-frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env

# Iniciar desarrollo con HMR
npm run dev
```

### Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Build para producción
npm run preview      # Preview del build

# Testing
npm test             # Ejecutar tests
npm run test:watch   # Tests en modo watch

# Calidad de código
npm run lint         # ESLint
npm run lint:fix     # ESLint con auto-fix

# Documentación
npm run storybook    # Storybook (puerto 6006)
```

## 🔧 Configuración

### Variables de Entorno

```bash
# .env
VITE_API_BASE=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
VITE_CALL_POLLING_INTERVAL=5000
VITE_MAX_FILE_SIZE_MB=10
```

### Configuración de MSW (Mock Service Worker)

El proyecto incluye mocks completos para desarrollo:

- `/api/auth/*` - Autenticación
- `/api/upload/excel` - Upload de archivos
- `/api/batches/*` - Gestión de campañas
- `/api/jobs/*` - Gestión de llamadas
- `/api/reports/*` - Reportes
- `/api/workers/*` - Panel admin

Los mocks se activan automáticamente en desarrollo. Para usar API real, modifica `src/mocks/browser.ts`.

## 📁 Estructura del Proyecto

```
src/
├── assets/          # Imágenes, iconos
├── components/      # Componentes reutilizables
│   ├── ui/         # Componentes básicos (Button, Input, Modal)
│   ├── wizard/     # FileUploader, ColumnMapper
│   ├── tables/     # Tablas especializadas
│   └── charts/     # Componentes de gráficos
├── pages/          # Páginas/rutas principales
│   ├── Auth/       # Login
│   ├── Dashboard/  # Dashboard principal
│   ├── Batches/    # Gestión de campañas
│   ├── Jobs/       # Monitoreo de llamadas
│   ├── Reports/    # Reportes
│   ├── Workers/    # Panel admin
│   └── Settings/   # Configuración
├── hooks/          # Custom hooks
│   ├── useAuth.tsx
│   ├── useWebSocket.ts
│   └── useUploader.ts
├── services/       # API y servicios
│   ├── api.ts      # Axios instance + interceptores
│   ├── queries.ts  # React Query hooks
│   └── ws.ts       # WebSocket manager
├── mocks/          # MSW handlers
├── store/          # Zustand stores
├── types/          # TypeScript types
├── utils/          # Utilidades
├── App.tsx
└── main.tsx
```

## 🧩 Componentes Principales

### FileUploader
```tsx
<FileUploader
  onUpload={(file) => console.log(file)}
  accept={['.xlsx', '.csv']}
  maxSize={10 * 1024 * 1024}
  isLoading={uploading}
/>
```

### ColumnMapper
```tsx
<ColumnMapper
  sampleRows={data.sampleRows}
  detectedFormat="debt_collection"
  onMappingChange={(mappings) => setMappings(mappings)}
  onValidationChange={(errors) => setErrors(errors)}
/>
```

### BatchControls
```tsx
<BatchControls
  batchId="batch-123"
  currentState="active"
  onPause={() => pauseBatch.mutate()}
  onResume={() => resumeBatch.mutate()}
/>
```

## 🔌 Hooks Principales

### useAuth
```tsx
const { user, login, logout, isAuthenticated } = useAuth();
```

### useWebSocket
```tsx
const { isConnected, lastMessage } = useWebSocket({
  url: 'ws://localhost:8000/events',
  onMessage: (event) => {
    // Handle real-time updates
  }
});
```

### React Query Hooks
```tsx
// Batches
const { data: batches } = useBatches({ page: 1, limit: 20 });
const createBatch = useCreateBatch();
const pauseBatch = usePauseBatch();

// Jobs
const { data: jobs } = useJobs({ status: 'in_progress' });
const retryJob = useRetryJob();
const advancePhone = useAdvancePhone();
```

## 🎨 Flujos de Usuario

### 1. Crear Campaña (Wizard)
1. **Upload**: Drag & drop archivo Excel/CSV
2. **Mapping**: Mapear columnas a variables del sistema
3. **Preview**: Validar datos y ver errores
4. **Configure**: Configurar horario, prioridad, remitente
5. **Confirm**: Crear batch y redirigir a detalle

### 2. Monitoreo en Tiempo Real
- Lista de jobs con actualizaciones WebSocket
- Estados: pending → in_progress → completed/failed
- Transcripciones y análisis NLP en tiempo real
- Acciones: retry, advance phone, view details

### 3. Gestión de Contactos
- Importar contactos adicionales
- Ver teléfonos múltiples por contacto
- Buscar y filtrar contactos
- Exportar listas para análisis

## 🧪 Testing

### Unit Tests
```bash
# Componentes individuales
npm test -- FileUploader.test.tsx
npm test -- ColumnMapper.test.tsx
npm test -- useAuth.test.tsx
```

### Integration Tests
```bash
# Flujos completos con MSW
npm test -- WizardFlow.test.tsx
npm test -- BatchManagement.test.tsx
```

### E2E Tests (Cypress)
```bash
npx cypress open
```

## 📊 Métricas y Monitoreo

### KPIs Dashboard
- Campañas activas vs total
- Llamadas en progreso
- Tasa de éxito
- Costo total acumulado

### Gráficos Disponibles
- Histogram de attempts por job
- Heatmap de llamadas por hora
- Pie chart de distribución de teléfonos
- Success rate por campaña

## 🔐 Seguridad

### Autenticación
- JWT tokens con refresh automático
- Roles: admin (full access) / operator (limited)
- ProtectedRoute para rutas sensibles

### Validaciones
- Formatos de teléfono E.164
- Validación de emails
- Sanitización de transcripciones
- Rate limiting con backoff automático

## 🚢 Deployment

### Build para Producción
```bash
npm run build
```

### Docker (Opcional)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### Variables de Entorno Producción
```bash
VITE_API_BASE=https://api.speechai.com
VITE_WS_URL=wss://api.speechai.com
VITE_CALL_POLLING_INTERVAL=10000
```

## 🐛 Troubleshooting

### Problemas Comunes

**MSW no carga mocks:**
- Verificar que `worker.start()` se ejecute en development
- Revisar console para errores de handlers

**WebSocket desconectado:**
- Verificar VITE_WS_URL en .env
- El componente muestra estado de conexión
- Fallback automático a polling

**Upload falla:**
- Verificar formatos soportados (.xlsx, .csv)
- Tamaño máximo: 10MB (configurable)
- Headers correctos: `multipart/form-data`

**Tokens expirados:**
- Refresh automático en interceptor
- Redirección a /login si refresh falla

## 📚 Recursos

- [React Query docs](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)
- [MSW docs](https://mswjs.io/)
- [Recharts examples](https://recharts.org/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -am 'Add nueva funcionalidad'`
4. Push branch: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

### Checklist PR
- [ ] Tests unitarios pasan
- [ ] ESLint sin errores
- [ ] Storybook actualizado
- [ ] README actualizado si necesario
- [ ] Types de TypeScript correctos

## 📄 Licencia

MIT License - ver `LICENSE` file para detalles.

---

## 📞 Soporte

Para issues técnicos, crear un issue en GitHub con:
- Descripción del problema
- Pasos para reproducir
- Logs de console/network
- Versión de Node.js y npm
- Sistema operativo

**🎯 ¡Proyecto listo para desarrollo! Inicia con `npm run dev` y comienza a crear campañas con IA.** 🚀