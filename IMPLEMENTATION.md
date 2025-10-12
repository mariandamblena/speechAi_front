# SpeechAI Frontend - Sistema de Gestión Completo

## 📋 Resumen del Sistema Implementado

Se ha implementado un sistema completo de gestión de cuentas y campañas para la plataforma SpeechAI, incluyendo:

- **Gestión de Cuentas**: CRUD completo con tokens, créditos y configuraciones
- **Gestión de Campañas (Batches)**: Creación con Excel, configuración de llamadas
- **Sistema de Mock Data**: Datos realistas para desarrollo frontend
- **UI Completa**: Modales, wizards, tablas y formularios

## 🏗️ Arquitectura del Sistema

### Estructura de Archivos Principales

```
src/
├── pages/
│   ├── Accounts/
│   │   └── AccountsPage.tsx          # Página principal de cuentas
│   └── Batches/
│       └── BatchesPage.tsx           # Página principal de campañas
├── components/
│   ├── accounts/
│   │   ├── CreateAccountModal.tsx    # Modal creación de cuenta
│   │   └── AccountDetailModal.tsx    # Modal detalle de cuenta
│   ├── batches/
│   │   ├── CreateBatchModal.tsx      # Wizard creación campaña
│   │   └── BatchDetailModal.tsx      # Modal detalle campaña
│   └── dev/
│       └── MockDataNotification.tsx  # Notificación desarrollo
├── services/
│   ├── queries.ts                    # Queries con fallback a mock data
│   └── mockData.ts                   # Datos de prueba realistas
└── types/
    └── index.ts                      # Definiciones de tipos completas
```

## 🎯 Funcionalidades Implementadas

### 1. Gestión de Cuentas (AccountsPage)
- **Lista completa** con estadísticas y filtros
- **Creación de cuentas** con formulario de 4 secciones:
  - Información de empresa
  - Selección de plan
  - Configuración de características
  - Configuración de llamadas
- **Gestión de estado** (activa/suspendida)
- **Vista detallada** con tabs:
  - Información general
  - Campañas asociadas
  - Transacciones
  - Configuración

### 2. Gestión de Campañas (BatchesPage)
- **Dashboard de campañas** con métricas
- **Wizard de creación** en 4 pasos:
  - Información básica
  - Carga de contactos (Excel)
  - Configuración de llamadas
  - Programación
- **Monitoreo de ejecución** con:
  - Estado en tiempo real
  - Jobs individuales
  - Logs de actividad
- **Filtros por estado** y búsqueda

### 3. Sistema de Mock Data
- **Fallback inteligente** cuando endpoints no existen
- **Datos realistas** que simulan casos reales de uso
- **Notificación de desarrollo** visible solo en modo dev
- **Logging detallado** para debugging

## 📊 Modelos de Datos

### AccountModel
```typescript
interface AccountModel {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  tokensAvailable: number;
  creditsAvailable: number;
  features: {
    voiceCloning: boolean;
    advancedAnalytics: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
  };
  callSettings: {
    maxConcurrentCalls: number;
    allowedTimeSlots: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
    retryAttempts: number;
    retryInterval: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### BatchModel
```typescript
interface BatchModel {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';
  totalContacts: number;
  completedCalls: number;
  successfulCalls: number;
  failedCalls: number;
  callSettings: {
    voiceId: string;
    script: string;
    maxDuration: number;
    retryAttempts: number;
    retryInterval: number;
  };
  scheduling: {
    startDate: string;
    endDate: string;
    timezone: string;
    allowedTimeSlots: Array<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    }>;
  };
  createdAt: string;
  updatedAt: string;
}
```

## 🔌 Endpoints Backend Requeridos

El sistema está preparado para integración con estos endpoints:

### Cuentas
- `GET /api/v1/accounts` - Listar cuentas
- `POST /api/v1/accounts` - Crear cuenta
- `GET /api/v1/accounts/:id` - Obtener cuenta
- `PUT /api/v1/accounts/:id` - Actualizar cuenta
- `GET /api/v1/accounts/:id/batches` - Campañas de la cuenta
- `GET /api/v1/accounts/:id/transactions` - Transacciones de la cuenta

### Campañas
- `GET /api/v1/batches` - Listar campañas
- `POST /api/v1/batches` - Crear campaña
- `POST /api/v1/batches/excel` - Crear campaña desde Excel
- `GET /api/v1/batches/:id` - Obtener campaña
- `PUT /api/v1/batches/:id` - Actualizar campaña
- `GET /api/v1/batches/:id/jobs` - Jobs de la campaña

## 🚀 Cómo Usar el Sistema

### 1. Desarrollo con Mock Data
```bash
npm run dev
```
- El sistema detecta automáticamente endpoints faltantes
- Usa datos mock realistas para desarrollo
- Muestra notificación de desarrollo en la UI

### 2. Navegación
- **Cuentas**: `/accounts` - Gestión completa de cuentas
- **Campañas**: `/batches` - Gestión de campañas de llamadas

### 3. Crear Nueva Cuenta
1. Ir a `/accounts`
2. Clic en "Nueva Cuenta"
3. Completar formulario de 4 secciones
4. La cuenta se crea con configuración completa

### 4. Crear Nueva Campaña
1. Ir a `/batches`
2. Clic en "Nueva Campaña"
3. Seguir wizard de 4 pasos:
   - Información básica
   - Subir archivo Excel con contactos
   - Configurar parámetros de llamada
   - Programar ejecución

## 🔧 Configuración Técnica

### Mock Data System
El sistema incluye datos de prueba para:
- **3 cuentas** (activa, suspendida, pendiente)
- **3 campañas** (ejecutándose, completada, pausada)
- **Transacciones** realistas
- **Jobs** con estados diversos

### Error Handling
- Detección automática de endpoints 405/404
- Fallback transparente a mock data
- Logging detallado en consola
- Notificaciones de desarrollo

### Types Safety
- Definiciones completas en TypeScript
- Validación de formularios
- Props tipadas en todos los componentes

## 📈 Próximos Pasos

1. **Implementar endpoints backend** usando los modelos definidos
2. **Reemplazar gradualmente** mock data por APIs reales
3. **Agregar autenticación** en endpoints
4. **Implementar WebSockets** para updates en tiempo real
5. **Agregar tests** unitarios y de integración

## 🔍 Debugging

### Console Logs
El sistema muestra mensajes informativos:
- `🔶 Accounts endpoint not implemented, using mock data`
- `🔶 Batch jobs endpoint not implemented, using mock data`

### Mock Data Notification
Banner amarillo en desarrollo que informa sobre el uso de datos mock.

### Error Boundaries
Manejo elegante de errores con fallback a mock data automático.

---

## 📝 Notas de Implementación

- **Responsive Design**: Todas las interfaces son responsivas
- **Accessibility**: Componentes accesibles con ARIA labels
- **Performance**: Queries optimizadas con TanStack Query
- **Maintainability**: Código modular y bien documentado
- **Scalability**: Arquitectura preparada para crecimiento

El sistema está **completamente funcional** para desarrollo frontend y **listo para integración** con backend cuando los endpoints estén disponibles.