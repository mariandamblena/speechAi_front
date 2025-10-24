# 🔍 Análisis Frontend vs Backend API

**Fecha:** 24 Octubre 2025  
**Proyecto:** Speech AI - Análisis de compatibilidad Frontend/Backend

---

## 📊 Resumen Ejecutivo

### ✅ Estado General
- **Compatibilidad Global:** 70% ✅ | 30% ⚠️
- **Endpoints Críticos:** Funcionando correctamente
- **Problemas Principales:** Campos no utilizados en el backend

---

## 🎯 Análisis de Creación de Batches

### 1️⃣ Endpoint: `POST /api/v1/batches` (JSON)

#### ✅ **CAMPOS COMPATIBLES**

| Campo Frontend | Campo Backend | Estado | Notas |
|----------------|---------------|--------|-------|
| `account_id` | `account_id` | ✅ | REQUIRED - Match perfecto |
| `name` | `name` | ✅ | REQUIRED - Match perfecto |
| `description` | `description` | ✅ | OPTIONAL - Match perfecto |
| `call_settings` | `call_settings` | ✅ | OPTIONAL - Estructura completa coincide |
| `priority` | `priority` | ⚠️ | Frontend: string, Backend: int |

#### ❌ **CAMPOS NO UTILIZADOS POR BACKEND**

| Campo Frontend | Estado Backend | Impacto |
|----------------|----------------|---------|
| `script_content` | ❌ NO existe en BatchModel | **CRÍTICO** - Se envía pero se ignora |
| `voice_settings` | ❌ NO existe en BatchModel | **CRÍTICO** - Se envía pero se ignora |
| `schedule_type` | ❌ NO implementado | **ALTO** - Funcionalidad no disponible |
| `scheduled_start` | ❌ NO implementado | **ALTO** - Funcionalidad no disponible |
| `recurring_config` | ❌ NO implementado | **ALTO** - Funcionalidad no disponible |
| `contacts_data` | ❌ NO se usa en este endpoint | **MEDIO** - Usar `/batches/{id}/upload` |

#### 🔧 **PROBLEMAS DETECTADOS**

**Problema 1: Priority Type Mismatch**
```typescript
// ❌ FRONTEND (CreateBatchRequest)
priority: 'low' | 'normal' | 'high' | 'urgent'  // String

// ✅ BACKEND (según API_ENDPOINTS_REFERENCE.md)
priority: 1  // Integer (default: 1)
```
**Solución:** Cambiar tipo en frontend o mapear valores:
```typescript
const priorityMap = {
  'urgent': 4,
  'high': 3,
  'normal': 2,
  'low': 1
};
```

**Problema 2: Campos Fantasma**
El frontend está enviando campos que el backend NO usa:
- `script_content` → ❌ NO existe en BatchModel
- `voice_settings` → ❌ NO existe en BatchModel
- `schedule_type`, `scheduled_start`, `recurring_config` → ❌ NO implementados

**Impacto:** 
- ⚠️ Aumenta tamaño del request innecesariamente
- ⚠️ Puede confundir a desarrolladores
- ✅ NO rompe funcionalidad (backend los ignora)

**Recomendación:** Eliminar estos campos de `CreateBatchRequest` o marcarlos como `@deprecated`

---

### 2️⃣ Endpoint: `POST /api/v1/batches/excel/create` (FormData)

#### ✅ **IMPLEMENTACIÓN ACTUAL**

```typescript
// Frontend: useCreateBatchFromExcel
const formData = new FormData();
formData.append('file', file);              // ✅ Requerido
formData.append('account_id', accountId);   // ✅ Requerido
formData.append('processing_type', processingType); // ⚠️ NO documentado en API
```

#### ⚠️ **PROBLEMAS DETECTADOS**

**Según API_ENDPOINTS_REFERENCE.md, el endpoint espera:**
```typescript
// Backend esperado
file: UploadFile           // ✅ OK
account_id: string         // ✅ OK
batch_name?: string        // ❌ NO enviado por frontend
batch_description?: string // ❌ NO enviado por frontend
allow_duplicates?: bool    // ❌ NO enviado por frontend
```

**Frontend está enviando:**
```typescript
file: File                 // ✅ OK
account_id: string         // ✅ OK
processing_type: string    // ⚠️ Campo NO documentado
```

**🔴 MISMATCH CRÍTICO:** 
- Frontend envía `processing_type` (no documentado)
- Backend espera `batch_name`, `batch_description`, `allow_duplicates` (no enviados)

**Solución Recomendada:**
```typescript
export const useCreateBatchFromExcel = () => {
  return useMutation({
    mutationFn: async ({
      file,
      accountId,
      batchName,      // ✅ Agregar
      batchDescription, // ✅ Agregar
      allowDuplicates = false // ✅ Agregar
    }: {
      file: File;
      accountId: string;
      batchName?: string;
      batchDescription?: string;
      allowDuplicates?: boolean;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('account_id', accountId);
      if (batchName) formData.append('batch_name', batchName);
      if (batchDescription) formData.append('batch_description', batchDescription);
      formData.append('allow_duplicates', allowDuplicates.toString());
      
      const response = await api.post('/batches/excel/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    }
  });
};
```

---

### 3️⃣ Flujo de Creación Actual

**Frontend (BatchesPage.tsx):**
```typescript
const handleCreateBatch = async (batchData: CreateBatchRequest) => {
  if (batchData.excel_file) {
    // 🟡 Usa endpoint /batches/excel/create
    await createBatchFromExcelMutation.mutateAsync({
      file: batchData.excel_file,
      accountId: batchData.account_id,
      processingType: 'basic'  // ⚠️ Campo no documentado
    });
  } else {
    // 🟡 Usa endpoint /batches (JSON)
    await createBatchMutation.mutateAsync(batchData);
  }
};
```

**Problema:** El frontend NO está pasando:
- `name` (nombre del batch)
- `description` 
- `call_settings`
- Otros datos del formulario

al endpoint `/batches/excel/create`. Solo envía el archivo.

**Solución:** Modificar para enviar todos los campos:
```typescript
if (batchData.excel_file) {
  await createBatchFromExcelMutation.mutateAsync({
    file: batchData.excel_file,
    accountId: batchData.account_id,
    batchName: batchData.name,           // ✅ Agregar
    batchDescription: batchData.description, // ✅ Agregar
    allowDuplicates: false
  });
}
```

---

## 📊 Análisis del Dashboard

### Endpoint: `GET /api/v1/dashboard/stats`

#### ✅ **COMPATIBILIDAD**

```typescript
// Frontend espera (DashboardStats interface)
interface DashboardStats {
  total_accounts: number;
  active_batches: number;
  total_jobs_today: number;
  success_rate: number;
  total_minutes_used: number;
  revenue_today: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_jobs_today: number;
  failed_jobs_today: number;
}

// Backend retorna (según API_ENDPOINTS_REFERENCE.md)
{
  total_accounts: 25,        // ✅ Match
  active_accounts: 22,       // ⚠️ Frontend NO lo usa
  total_batches: 150,        // ⚠️ Frontend NO lo usa
  active_batches: 12,        // ✅ Match
  total_jobs: 5000,          // ⚠️ Diferente de total_jobs_today
  pending_jobs: 500,         // ✅ Match
  completed_jobs: 4200,      // ⚠️ Diferente de completed_jobs_today
  failed_jobs: 300,          // ⚠️ Diferente de failed_jobs_today
  success_rate: 93.3,        // ✅ Match
  total_revenue: 1500.0      // ⚠️ Diferente de revenue_today
}
```

#### 🔴 **PROBLEMAS DETECTADOS**

**Problema 1: Campos Faltantes**
Frontend espera pero backend NO retorna:
- `total_jobs_today` → Backend solo tiene `total_jobs` (todos los tiempos)
- `total_minutes_used` → ❌ NO existe en backend
- `revenue_today` → Backend tiene `total_revenue` (acumulado)
- `in_progress_jobs` → ❌ NO existe en backend
- `completed_jobs_today` → Backend solo tiene `completed_jobs` (acumulado)
- `failed_jobs_today` → Backend solo tiene `failed_jobs` (acumulado)

**Problema 2: Campos Extra**
Backend retorna pero frontend NO usa:
- `active_accounts`
- `total_batches`

**Impacto:** 
- 🔴 **CRÍTICO** - Dashboard mostrará `undefined` o `0` en varios campos
- 🔴 **CRÍTICO** - Datos no representan "hoy" sino totales acumulados

**Solución 1 (Rápida):** Mapear campos existentes
```typescript
const displayStats = stats ? {
  ...stats,
  total_jobs_today: stats.total_jobs || 0,
  completed_jobs_today: stats.completed_jobs || 0,
  failed_jobs_today: stats.failed_jobs || 0,
  revenue_today: stats.total_revenue || 0,
  total_minutes_used: 0, // ❌ No disponible
  in_progress_jobs: 0    // ❌ No disponible
} : mockStats;
```

**Solución 2 (Correcta):** Pedir al backend agregar endpoints:
- `GET /api/v1/dashboard/stats/today` → Estadísticas del día
- Agregar campos: `total_minutes_used`, `in_progress_jobs`

---

## 🎯 Recomendaciones Prioritarias

### 🔴 CRÍTICAS (Hacer AHORA)

1. **Arreglar tipo de `priority`**
```typescript
// types/index.ts
export interface CreateBatchRequest {
  // ...
  priority: number; // ✅ Cambiar de string a number (1-4)
}
```

2. **Actualizar `useCreateBatchFromExcel`**
```typescript
// Agregar parámetros batch_name, batch_description, allow_duplicates
// Ver solución completa arriba
```

3. **Pasar datos completos al crear batch desde Excel**
```typescript
// BatchesPage.tsx - handleCreateBatch
if (batchData.excel_file) {
  await createBatchFromExcelMutation.mutateAsync({
    file: batchData.excel_file,
    accountId: batchData.account_id,
    batchName: batchData.name,
    batchDescription: batchData.description,
    allowDuplicates: false
  });
}
```

4. **Mapear estadísticas del Dashboard**
```typescript
// DashboardPage.tsx
const displayStats = stats ? {
  total_accounts: stats.total_accounts,
  active_batches: stats.active_batches,
  total_jobs_today: stats.total_jobs, // ⚠️ Temporal
  success_rate: stats.success_rate,
  total_minutes_used: 0, // ⚠️ No disponible
  revenue_today: stats.total_revenue, // ⚠️ Acumulado, no "hoy"
  pending_jobs: stats.pending_jobs,
  in_progress_jobs: 0, // ⚠️ No disponible
  completed_jobs_today: stats.completed_jobs, // ⚠️ Acumulado
  failed_jobs_today: stats.failed_jobs // ⚠️ Acumulado
} : mockStats;
```

### 🟡 IMPORTANTES (Hacer PRONTO)

5. **Eliminar campos no utilizados de `CreateBatchRequest`**
```typescript
export interface CreateBatchRequest {
  account_id: string;
  name: string;
  description?: string;
  priority: number; // ✅ Cambiado a number
  call_settings?: CallSettings; // ✅ Opcional
  excel_file?: File | null;
  // ❌ ELIMINAR: script_content, voice_settings, 
  //               schedule_type, scheduled_start, recurring_config
}
```

6. **Actualizar `CreateBatchModal` para no generar campos fantasma**
```typescript
const [formData, setFormData] = useState<CreateBatchRequest>({
  account_id: '',
  name: '',
  description: '',
  priority: 2, // ✅ Number (normal priority)
  call_settings: { /* ... */ },
  excel_file: null
  // ❌ NO incluir: script_content, voice_settings, schedule_type, etc.
});
```

7. **Solicitar al backend estadísticas diarias**
   - Endpoint nuevo: `GET /api/v1/dashboard/stats/today`
   - O parámetros: `GET /api/v1/dashboard/stats?period=today`

### 🟢 OPCIONALES (Mejoras futuras)

8. **Agregar validación de datos antes de enviar**
9. **Implementar retry logic para llamadas fallidas**
10. **Agregar logging más detallado**

---

## 📋 Checklist de Correcciones

### Batch Creation
- [ ] Cambiar `priority` de string a number
- [ ] Actualizar `useCreateBatchFromExcel` con campos correctos
- [ ] Pasar `name` y `description` al crear desde Excel
- [ ] Eliminar campos no usados (`script_content`, `voice_settings`, etc.)
- [ ] Actualizar `CreateBatchModal` state inicial

### Dashboard
- [ ] Mapear campos de estadísticas correctamente
- [ ] Agregar manejo de campos faltantes
- [ ] Documentar limitaciones (datos acumulados vs diarios)
- [ ] Solicitar endpoints de estadísticas diarias al backend

### Testing
- [ ] Probar creación de batch con JSON (sin archivo)
- [ ] Probar creación de batch con Excel
- [ ] Verificar que Dashboard muestra datos correctos
- [ ] Validar tipos de datos en runtime

---

## 🔗 Referencias

- `API_ENDPOINTS_REFERENCE.md` - Documentación oficial del backend
- `src/types/index.ts` - TypeScript interfaces del frontend
- `src/services/queries.ts` - React Query hooks
- `src/components/batches/CreateBatchModal.tsx` - Modal de creación
- `src/pages/Dashboard/DashboardPage.tsx` - Dashboard principal

---

**Última actualización:** 24 Octubre 2025  
**Próxima revisión:** Después de implementar correcciones críticas
