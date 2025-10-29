# SpeechAI Campaign Manager

Frontend en React + Vite + TypeScript para gestionar campañas de llamadas automatizadas con IA de cobranza.

## 🚀 Características Principales

- **Dashboard en tiempo real**: Estadísticas del día, batches activos y resumen de llamadas
- **Gestión de Campañas (Batches)**: Crear, pausar, reanudar y configurar lotes de llamadas
- **Wizard de creación**: Upload Excel → mapeo de columnas → creación de campaña
- **Gestión de Llamadas (Jobs)**: Monitoreo por batch con estados en tiempo real
- **Vista detallada**: Transcripciones, compromisos de pago, análisis de llamadas
- **Gestión de Cuentas**: Administración de clientes con balance y configuración
- **Reportes**: Visualización de métricas y estadísticas de campañas
- **Autenticación**: Login con JWT y control de acceso

## 🛠️ Stack Tecnológico

- **React 18.2.0** con **TypeScript 5**
- **Vite** para desarrollo rápido con HMR
- **React Router v6** para navegación SPA
- **TanStack Query (React Query)** para manejo de estado del servidor
- **Axios** para peticiones HTTP con interceptores
- **Tailwind CSS** para estilos
- **Lucide React** para iconos
- **date-fns** para manejo de fechas

## 🏃‍♂️ Inicio Rápido

### Prerrequisitos

```bash
Node.js >= 18
npm >= 8
```

### Instalación

```bash
# Clonar el proyecto
git clone https://github.com/mariandamblena/speechAi_front.git
cd speechAi_front

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# Iniciar desarrollo
npm run dev
```

### Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (puerto 3000)
npm run build        # Build para producción
npm run preview      # Preview del build de producción
npm run lint         # Verificar código con ESLint
```

## 🔧 Configuración

### Variables de Entorno

```bash
# .env
VITE_API_BASE_URL=http://localhost:8000
```

## 📁 Estructura del Proyecto

```
src/
├── components/         # Componentes reutilizables
│   ├── ui/            # Componentes básicos (Button, Input, Modal)
│   ├── layout/        # Layout principal con navegación
│   ├── auth/          # Componentes de autenticación
│   ├── accounts/      # Componentes de gestión de cuentas
│   ├── batches/       # Componentes de gestión de lotes
│   ├── jobs/          # Componentes de gestión de llamadas
│   └── wizard/        # Wizard de creación de campañas
├── pages/             # Páginas principales
│   ├── Auth/          # Página de login
│   ├── Dashboard/     # Dashboard con estadísticas
│   ├── Accounts/      # Gestión de cuentas
│   ├── Batches/       # Listado y detalle de campañas
│   ├── Jobs/          # Listado de llamadas agrupadas
│   ├── Reports/       # Reportes y métricas
│   └── Test/          # Página de prueba de API
├── hooks/             # Custom hooks
│   ├── useAuth.tsx    # Hook de autenticación
│   └── useWebSocket.ts # Hook de WebSocket
├── routes/            # Configuración de rutas
├── services/          # Servicios de API
│   ├── api.ts         # Cliente Axios configurado
│   └── queries.ts     # Hooks de React Query
├── types/             # Tipos TypeScript
│   └── index.ts       # Modelos de datos
└── utils/             # Utilidades
```

## 🧩 Funcionalidades Detalladas

### Dashboard
- Resumen del día con llamadas completadas, fallidas y en progreso
- Tasa de éxito global
- Batches activos y estadísticas
- Listado de lotes recientes con estados

### Gestión de Campañas (Batches)
- Crear nuevos lotes desde archivo Excel
- Ver detalles completos de cada lote
- Estados: Activa / Pausada
- Control de pause/resume
- Configuración de llamadas (call_settings):
  - Duración máxima de llamada
  - Timeout de timbre
  - Máximo de intentos
  - Delay entre reintentos
  - Horarios permitidos
  - Días de la semana
  - Zona horaria

### Gestión de Llamadas (Jobs)
- Listado agrupado por batch (colapsable)
- Búsqueda por nombre, teléfono o ID de lote
- Filtros por estado: Todas, Pendientes, En Progreso, Completadas, Fallidas
- Vista de compromisos de pago con fecha y monto
- Detalles completos de cada llamada:
  - Transcripción
  - Análisis de la llamada
  - Grabación de audio
  - Variables dinámicas capturadas
  - Información de contacto

### Gestión de Cuentas
- Listado de cuentas con balance y estado
- Suspender/Activar cuentas
- Ver detalles de consumo (minutos/créditos)
- Información de contacto y plan

### Wizard de Creación
1. **Upload de archivo**: Drag & drop de Excel con validación
2. **Mapeo de columnas**: Asociar columnas a variables del sistema
3. **Creación**: Configurar y crear el nuevo batch

## 🔐 Autenticación y Seguridad

- JWT tokens almacenados en localStorage
- Interceptor de Axios para agregar token automáticamente
- Rutas protegidas con ProtectedRoute
- Redirección automática a login si no autenticado
- Logout manual y limpieza de sesión

## 🎨 Características de UX

- **Búsqueda en tiempo real** con expansión automática de resultados
- **Batches colapsables** para mejor organización
- **Estados visuales** con colores y badges
- **Confirmaciones** para acciones destructivas
- **Feedback visual** con alerts de éxito/error
- **Responsive design** adaptado a diferentes pantallas

## 🔌 API Hooks Principales

### Autenticación
```tsx
const { user, login, logout, isAuthenticated } = useAuth();
```

### Batches
```tsx
const { data: batches } = useBatches({ account_id, is_active });
const { data: batch } = useBatch(batchId);
const updateBatch = useUpdateBatch();
const toggleStatus = useToggleBatchStatus();
```

### Jobs
```tsx
const { data: jobs } = useJobs({ status, batch_id });
const { data: job } = useJob(jobId);
const cancelJob = useCancelJob();
```

### Cuentas
```tsx
const { data: accounts } = useAccounts({ status });
const { data: account } = useAccount(accountId);
const suspendAccount = useSuspendAccount();
const activateAccount = useActivateAccount();
```

## 🚢 Deployment

### Build para Producción
```bash
npm run build
# Los archivos optimizados estarán en dist/
```

### Vercel (Configurado)
El proyecto incluye `vercel.json` con la configuración necesaria:
- Reescritura de rutas para SPA
- Headers de CORS si necesario

```bash
# Deploy a Vercel
vercel --prod
```

### Variables de Entorno en Producción
```bash
VITE_API_BASE_URL=https://api.tu-dominio.com
```

## 🐛 Solución de Problemas

### Token Expirado
- El sistema limpia automáticamente el localStorage
- Redirige a login cuando detecta 401

### Problemas de CORS
- Verificar que el backend tenga configurado CORS para el dominio del frontend
- En desarrollo, el proxy de Vite puede ayudar

### Excel no se sube
- Verificar formato .xlsx o .csv
- Revisar que las columnas necesarias estén presentes
- Ver mensajes de error en la consola

## 📊 Estructura de Datos

### Batch
```typescript
{
  batch_id: string;
  name: string;
  is_active: boolean;
  total_jobs: number;
  completed_jobs: number;
  failed_jobs: number;
  pending_jobs: number;
  created_at: string;
  call_settings: {
    max_call_duration: number;
    ring_timeout: number;
    max_attempts: number;
    retry_delay_hours: number;
    allowed_hours: { start: string; end: string };
    days_of_week: number[];
    timezone: string;
  }
}
```

### Job
```typescript
{
  job_id: string;
  batch_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  contact: {
    name: string;
    phones: string[];
  };
  attempts: number;
  max_attempts: number;
  fecha_pago_cliente?: string;  // Compromiso de pago
  monto_pago_cliente?: number;
  call_result?: {
    summary: {
      transcript: string;
      call_analysis: object;
      recording_url: string;
    }
  };
}
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear branch: `git checkout -b feature/nueva-funcionalidad`
3. Commit cambios: `git commit -m 'Add: nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Crear Pull Request

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

**🎯 Proyecto listo para uso. Inicia con `npm run dev` y comienza a gestionar campañas de IA.** 🚀