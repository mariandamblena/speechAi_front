# 🎯 Plan de Acción Inmediato - Frontend SpeechAI

> **Fecha:** 15 Octubre 2025  
> **Alcance:** Correcciones críticas de arquitectura (Problemas #1 y #3)  
> **NO incluye:** Sistema de Scripts/Prompts (se mantiene como está)

---

## 📋 Problemas a Resolver AHORA

### 🔴 Problema #1: Configuraciones de Llamadas en el Lugar Equivocado

**Qué está mal:**
- `CreateAccountModal` pide horarios de llamada, días de semana y reintentos
- Estas configuraciones están en `AccountModel.settings`
- **Deberían estar en `BatchModel.call_settings`**

**Por qué es un problema:**
- Una empresa puede necesitar diferentes horarios para diferentes campañas
- Limita la flexibilidad del sistema
- No tiene sentido del negocio

### 🔴 Problema #3: Endpoints Faltantes

El frontend llama a estos endpoints que NO existen:
```
❌ GET /accounts/{id}/balance      # Frontend lo pide
❌ GET /accounts/{id}/stats        # Frontend lo pide  
❌ GET /batches/{id}/summary       # Frontend lo pide
❌ GET /batches/{id}/status        # Frontend hace polling cada 5s
```

---

## ✅ Lo que NO vamos a tocar

### ⏸️ Problema #2: Sistema de Scripts/Prompts - NO PRIORITARIO

**Estado actual:** El usuario escribe el script manualmente en un textarea  
**Se mantiene así:** SÍ, no hay cambios en esto por ahora  
**Futuro:** Cuando sea prioritario, se implementará sistema de plantillas

---

## 🛠️ Cambios a Realizar en Frontend

### 1. Simplificar `CreateAccountModal.tsx` ⚠️ CRÍTICO

**QUITAR estas secciones (líneas 117-172 aprox):**

```tsx
// ❌ ELIMINAR - Configuraciones de Llamadas
<div className="space-y-4">
  <h3 className="text-lg font-medium text-gray-900">Configuraciones de Llamadas</h3>
  
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input label="Hora de Inicio" type="time" ... />
    <Input label="Hora de Fin" type="time" ... />
  </div>
  
  <Input label="Intentos Máximos" ... />
  <Input label="Horas entre Intentos" ... />
</div>
```

**MANTENER solo esto:**

```tsx
// ✅ MANTENER - Configuraciones de Cuenta
<div className="space-y-4">
  <h3 className="text-lg font-medium text-gray-900">Configuraciones de Cuenta</h3>
  
  <Input
    label="Zona Horaria por Defecto"
    select
    value={formData.settings.timezone}
    onChange={(e) => handleSettingChange('timezone', e.target.value)}
  >
    <option value="America/Santiago">Santiago (GMT-3)</option>
    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
  </Input>
  
  <div className="text-sm text-gray-500 bg-blue-50 p-3 rounded-md">
    ℹ️ Los horarios de llamada, días de la semana y reintentos se configuran 
    en cada campaña/batch individualmente.
  </div>
</div>
```

### 2. Actualizar `CreateAccountRequest` Type

**Archivo:** `src/types/index.ts`

**ANTES:**
```typescript
export interface CreateAccountRequest {
  // ...
  settings: {
    allowed_call_hours: {      // ❌ QUITAR
      start: string;
      end: string;
    };
    timezone: string;           // ✅ MANTENER (solo como default)
    retry_settings: {           // ❌ QUITAR
      max_attempts: number;
      retry_delay_hours: number;
    };
  };
}
```

**DESPUÉS:**
```typescript
export interface CreateAccountRequest {
  account_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  plan_type: 'minutes_based' | 'credit_based';
  initial_minutes?: number;
  initial_credits?: number;
  features: {
    max_concurrent_calls: number;
    voice_cloning: boolean;
    advanced_analytics: boolean;
    custom_integration: boolean;
    priority_support: boolean;
  };
  settings: {
    timezone: string;  // Solo timezone por defecto
  };
}
```

### 3. Actualizar State Inicial en `CreateAccountModal.tsx`

**ANTES:**
```typescript
const [formData, setFormData] = useState<CreateAccountRequest>({
  // ...
  settings: {
    allowed_call_hours: {      // ❌ QUITAR
      start: '09:00',
      end: '18:00'
    },
    timezone: 'America/Santiago',
    retry_settings: {           // ❌ QUITAR
      max_attempts: 3,
      retry_delay_hours: 24
    }
  }
});
```

**DESPUÉS:**
```typescript
const [formData, setFormData] = useState<CreateAccountRequest>({
  account_name: '',
  contact_email: '',
  contact_name: '',
  contact_phone: '',
  plan_type: 'credit_based',
  initial_credits: 1000,
  initial_minutes: 0,
  features: {
    max_concurrent_calls: 5,
    voice_cloning: false,
    advanced_analytics: false,
    custom_integration: false,
    priority_support: false
  },
  settings: {
    timezone: 'America/Santiago'  // Solo timezone
  }
});
```

### 4. Asegurar que `CreateBatchModal.tsx` tiene las Configuraciones

**Verificar que `CreateBatchModal` SÍ tenga:**

```typescript
call_settings: {
  max_call_duration: 300,
  ring_timeout: 30,
  max_attempts: 3,              // ✅ Está aquí, no en Account
  retry_delay_hours: 24,        // ✅ Está aquí, no en Account
  allowed_hours: {              // ✅ Está aquí, no en Account
    start: '09:00',
    end: '18:00'
  },
  days_of_week: [1, 2, 3, 4, 5],  // ✅ Está aquí, no en Account
  timezone: 'America/Santiago'
}
```

---

## 🔧 Cambios a Realizar en Backend

### 1. Endpoints Faltantes a Implementar

#### **GET /accounts/{id}/balance**
```python
@router.get("/accounts/{account_id}/balance")
async def get_account_balance(account_id: str):
    """
    Retorna balance detallado de la cuenta
    """
    account = await get_account(account_id)
    
    return {
        "account_id": account.account_id,
        "minutes": account.balance.minutes,
        "credits": account.balance.credits,
        "total_spent": account.balance.total_spent,
        "last_topup_date": account.last_topup_date,
        "estimated_depletion_date": calculate_depletion_date(account)
    }
```

#### **GET /accounts/{id}/stats**
```python
@router.get("/accounts/{account_id}/stats")
async def get_account_stats(account_id: str):
    """
    Retorna estadísticas de la cuenta
    """
    return {
        "account_id": account_id,
        "total_batches": count_batches(account_id),
        "active_batches": count_active_batches(account_id),
        "total_calls": count_total_calls(account_id),
        "calls_this_month": count_calls_this_month(account_id),
        "success_rate": calculate_success_rate(account_id),
        "avg_call_duration": calculate_avg_duration(account_id),
        "total_cost_this_month": calculate_cost_this_month(account_id)
    }
```

#### **GET /batches/{id}/summary**
```python
@router.get("/batches/{batch_id}/summary")
async def get_batch_summary(batch_id: str):
    """
    Retorna resumen completo del batch
    """
    batch = await get_batch(batch_id)
    jobs = await get_batch_jobs(batch_id, limit=10)
    
    return {
        "batch": batch,
        "stats": {
            "total_jobs": count_jobs(batch_id),
            "pending": count_by_status(batch_id, "pending"),
            "in_progress": count_by_status(batch_id, "in_progress"),
            "completed": count_by_status(batch_id, "completed"),
            "failed": count_by_status(batch_id, "failed")
        },
        "jobs_sample": jobs  # Primeros 10 jobs
    }
```

#### **GET /batches/{id}/status**
```python
@router.get("/batches/{batch_id}/status")
async def get_batch_status(batch_id: str):
    """
    Retorna estado en tiempo real (para polling cada 5s)
    """
    batch = await get_batch(batch_id)
    stats = await calculate_batch_stats(batch_id)
    
    return {
        "batch_id": batch_id,
        "status": batch.status,
        "is_active": batch.is_active,
        "progress": {
            "total": stats.total_jobs,
            "completed": stats.completed_jobs,
            "completed_percentage": (stats.completed_jobs / stats.total_jobs * 100) if stats.total_jobs > 0 else 0,
            "estimated_completion": calculate_eta(stats)
        },
        "metrics": {
            "success_rate": stats.success_rate,
            "average_call_duration": stats.avg_duration,
            "cost_per_call": stats.avg_cost
        }
    }
```

### 2. Actualizar Modelo de Account

**ANTES:**
```python
class AccountSettings(BaseModel):
    allowed_call_hours: AllowedHours      # ❌ QUITAR
    timezone: str
    retry_settings: RetrySettings         # ❌ QUITAR
```

**DESPUÉS:**
```python
class AccountSettings(BaseModel):
    timezone: str  # Solo timezone por defecto
```

---

## 📝 Checklist de Implementación

### Frontend

- [ ] **Actualizar `CreateAccountModal.tsx`**
  - [ ] Eliminar sección "Configuraciones de Llamadas"
  - [ ] Mantener solo "Zona Horaria por Defecto"
  - [ ] Agregar mensaje informativo sobre dónde se configuran horarios
  - [ ] Eliminar handlers de `allowed_call_hours` y `retry_settings`

- [ ] **Actualizar `src/types/index.ts`**
  - [ ] Simplificar `CreateAccountRequest.settings`
  - [ ] Quitar `allowed_call_hours`
  - [ ] Quitar `retry_settings`
  - [ ] Mantener solo `timezone`

- [ ] **Verificar `CreateBatchModal.tsx`**
  - [ ] Confirmar que tiene `call_settings` completos
  - [ ] Confirmar que tiene `allowed_hours`
  - [ ] Confirmar que tiene `days_of_week`
  - [ ] Confirmar que tiene `max_attempts`
  - [ ] Confirmar que tiene `retry_delay_hours`

- [ ] **Agregar hooks para nuevos endpoints**
  ```typescript
  // Ya existen en queries.ts, verificar que funcionen:
  - useAccountBalance(accountId)
  - useAccountStats(accountId)
  - useBatchSummary(batchId)
  - useBatchStatus(batchId)
  ```

### Backend

- [ ] **Implementar endpoints faltantes**
  - [ ] `GET /accounts/{id}/balance`
  - [ ] `GET /accounts/{id}/stats`
  - [ ] `GET /batches/{id}/summary`
  - [ ] `GET /batches/{id}/status`

- [ ] **Actualizar modelo de Account**
  - [ ] Simplificar `AccountSettings` (quitar call_settings)
  - [ ] Migración de datos si es necesario

- [ ] **Testing**
  - [ ] Probar endpoints con Postman
  - [ ] Verificar que frontend conecta correctamente
  - [ ] Validar que batches mantienen sus configuraciones

---

## 🧪 Plan de Testing

### 1. Testing de Account sin Call Settings

**Escenario:** Crear nueva cuenta
```
1. Abrir "Crear Cuenta"
2. Llenar datos básicos
3. Verificar que NO pide horarios de llamada
4. Verificar que solo pide timezone
5. Crear cuenta
6. Verificar en backend que solo se guardó timezone
```

### 2. Testing de Batch con Call Settings

**Escenario:** Crear batch con configuraciones propias
```
1. Abrir "Crear Batch"
2. Seleccionar cuenta
3. Configurar horarios (09:00-18:00)
4. Configurar días (Lun-Vie)
5. Configurar reintentos (3 intentos, 24h delay)
6. Crear batch
7. Verificar que el batch tiene sus propias configuraciones
```

### 3. Testing de Endpoints Nuevos

**Escenario:** Balance de cuenta
```
1. Llamar a GET /accounts/{id}/balance
2. Verificar respuesta con minutos y créditos
3. Verificar frontend muestra la info correctamente
```

**Escenario:** Status de batch (polling)
```
1. Crear batch con llamadas
2. Iniciar batch
3. Verificar que frontend hace polling cada 5s
4. Verificar que GET /batches/{id}/status responde
5. Verificar que el progreso se actualiza en UI
```

---

## 📊 Estimación de Tiempos

### Frontend (0.5 - 1 día)
- Actualizar `CreateAccountModal.tsx`: 2 horas
- Actualizar types: 30 minutos
- Verificar `CreateBatchModal.tsx`: 30 minutos
- Testing: 1 hora

### Backend (1 - 1.5 días)
- Implementar 4 endpoints nuevos: 4 horas
- Actualizar modelo de Account: 1 hora
- Testing: 1 hora
- Migración de datos (si necesario): 1 hora

### **Total: 2 - 2.5 días**

---

## 🚀 Orden de Implementación Recomendado

### Día 1 - Backend
1. Implementar endpoint `GET /accounts/{id}/balance`
2. Implementar endpoint `GET /accounts/{id}/stats`
3. Implementar endpoint `GET /batches/{id}/summary`
4. Implementar endpoint `GET /batches/{id}/status`
5. Probar con Postman

### Día 2 - Backend + Frontend
**Mañana:**
1. Actualizar modelo de Account (quitar call_settings)
2. Migración de datos si es necesario

**Tarde:**
3. Actualizar types en frontend
4. Simplificar `CreateAccountModal.tsx`
5. Verificar `CreateBatchModal.tsx`

### Día 2.5 - Testing
1. Testing end-to-end
2. Correcciones
3. Deploy

---

## ✅ Criterios de Aceptación

### Frontend
- ✅ `CreateAccountModal` NO pide horarios de llamada
- ✅ `CreateAccountModal` NO pide configuración de reintentos
- ✅ `CreateAccountModal` solo pide timezone
- ✅ `CreateBatchModal` SÍ tiene todas las configuraciones de llamadas
- ✅ Balance de cuenta se muestra correctamente
- ✅ Stats de cuenta se muestran correctamente
- ✅ Summary de batch se muestra correctamente
- ✅ Status de batch hace polling cada 5s

### Backend
- ✅ Endpoint `/accounts/{id}/balance` responde correctamente
- ✅ Endpoint `/accounts/{id}/stats` responde correctamente
- ✅ Endpoint `/batches/{id}/summary` responde correctamente
- ✅ Endpoint `/batches/{id}/status` responde correctamente
- ✅ Modelo de Account simplificado (sin call_settings innecesarios)
- ✅ Batches mantienen sus configuraciones propias

---

## 🎯 Resultado Esperado

### Antes (Incorrecto)
```
Account:
  ├── allowed_call_hours ❌
  ├── retry_settings ❌
  └── timezone ✅
      ├── Batch A (no puede cambiar horarios)
      ├── Batch B (no puede cambiar horarios)
      └── Batch C (no puede cambiar horarios)
```

### Después (Correcto)
```
Account:
  └── timezone (default) ✅
      ├── Batch A: 09:00-18:00, 3 reintentos ✅
      ├── Batch B: 10:00-20:00, 5 reintentos ✅
      └── Batch C: 08:00-12:00, 2 reintentos ✅
```

---

## 📞 Contacto

Si tienes dudas durante la implementación, revisa:
1. `ANALISIS_ENDPOINTS.md` - Análisis técnico completo
2. `ISSUES_ARQUITECTURA.md` - Documentación visual extendida
3. Este documento - Plan de acción inmediato

---

**Última actualización:** 15 Octubre 2025  
**Estado:** LISTO PARA IMPLEMENTAR  
**Problemas excluidos:** Sistema de Scripts/Prompts (futuro)
