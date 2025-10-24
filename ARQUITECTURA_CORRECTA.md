# ✅ Arquitectura Correcta: Account vs Batch

**Fecha:** 23 Octubre 2025  
**Estado:** CORREGIDO en Frontend

---

## 🎯 Separación de Responsabilidades

### 🏢 ACCOUNT (Cuenta de Empresa)
**¿Qué es?** Un cliente/empresa que usa la plataforma

**¿Qué contiene?**
```typescript
Account {
  // 👤 Información de la Empresa
  account_name: "Empresa ABC"
  contact_name: "Juan Pérez"
  contact_email: "contacto@empresa.com"
  contact_phone: "+56912345678"
  
  // 💳 Plan y Facturación
  plan_type: "credit_based" | "minutes_based"
  balance: {
    credits: 5000,
    minutes: 0,
    total_spent: 1250.50
  }
  
  // 🔧 Límites Técnicos de la Cuenta
  features: {
    max_concurrent_calls: 10  // ✅ Límite técnico del plan
    voice_cloning: true        // ✅ Features contratadas
    advanced_analytics: true
    custom_integration: false
    priority_support: true
  }
  
  // 🌍 Configuración Regional
  settings: {
    timezone: "America/Santiago"  // ✅ Zona horaria por defecto
  }
  
  status: "ACTIVE" | "SUSPENDED" | "INACTIVE"
}
```

**✅ Lo que SÍ va en Account:**
- Información de la empresa/cliente
- Plan contratado (créditos o minutos)
- Balance disponible
- Límite de llamadas concurrentes (es un límite del plan)
- Features/características contratadas
- Zona horaria predeterminada
- Estado de la cuenta (activa/suspendida)

**❌ Lo que NO va en Account:**
- ~~Horarios de llamada~~ → Va en Batch
- ~~Configuración de reintentos~~ → Va en Batch
- ~~Script de llamada~~ → Va en Batch
- ~~Configuración de voz~~ → Va en Batch
- ~~Lista de contactos~~ → Va en Batch/Jobs

---

### 📢 BATCH (Campaña de Llamadas)
**¿Qué es?** Una campaña específica de llamadas con configuración propia

**¿Qué contiene?**
```typescript
Batch {
  // 📋 Información Básica
  account_id: "acc-chile-001"  // ✅ Pertenece a una cuenta
  name: "Campaña Cobranza Octubre"
  description: "Recordatorio de pagos pendientes"
  
  // 📝 Contenido de la Llamada
  script_content: "Hola {nombre}, le llamo de {empresa}..."
  
  // 🎤 Configuración de Voz (específica de esta campaña)
  voice_settings: {
    voice_id: "default",
    speed: 1.0,
    pitch: 0,
    volume: 1.0,
    language: "es-CL"
  }
  
  // ⏰ Configuración de Llamadas (específica de esta campaña)
  call_settings: {
    max_call_duration: 300,        // ✅ Duración máxima por llamada
    ring_timeout: 30,               // ✅ Tiempo de espera de ring
    max_attempts: 3,                // ✅ Reintentos permitidos
    retry_delay_hours: 24,          // ✅ Delay entre reintentos
    allowed_hours: {                // ✅ Horario de llamadas
      start: "09:00",
      end: "18:00"
    },
    days_of_week: [1,2,3,4,5],     // ✅ Días permitidos (Lun-Vie)
    timezone: "America/Santiago"    // ✅ Zona horaria de la campaña
  }
  
  // 📊 Estado de la Campaña
  status: "PENDING" | "RUNNING" | "PAUSED" | "COMPLETED" | "CANCELLED"
  total_jobs: 1000
  pending_jobs: 550
  completed_jobs: 400
  failed_jobs: 50
  
  // 💰 Costos
  total_cost: 450.75
  total_minutes: 180.5
  
  // 📅 Fechas
  created_at: "2025-10-16T10:00:00Z"
  started_at: "2025-10-16T10:05:00Z"
}
```

**✅ Lo que SÍ va en Batch:**
- Nombre y descripción de la campaña
- Script/contenido de la llamada
- Configuración de voz (idioma, velocidad, tono)
- **Configuración de llamadas (horarios, reintentos, timeouts)**
- Lista de contactos a llamar (jobs)
- Estado de la campaña
- Progreso y estadísticas
- Costos de la campaña

**❌ Lo que NO va en Batch:**
- ~~Balance de la cuenta~~ → Va en Account
- ~~Información de facturación~~ → Va en Account
- ~~Límites del plan contratado~~ → Va en Account

---

## 🔄 Flujo de Trabajo Correcto

### 1. Crear Account (Una vez por cliente)
```
POST /api/v1/accounts
{
  "account_name": "Empresa ABC",
  "contact_email": "contacto@abc.com",
  "plan_type": "credit_based",
  "initial_credits": 5000,
  "features": {
    "max_concurrent_calls": 10  // ← Límite del plan
  },
  "settings": {
    "timezone": "America/Santiago"  // ← Timezone predeterminado
  }
}
```

### 2. Crear Batch (Múltiples campañas por cuenta)
```
POST /api/v1/batches
{
  "account_id": "acc-chile-001",  // ← Asociado a la cuenta
  "name": "Campaña Octubre",
  "script_content": "Hola {nombre}...",
  
  "voice_settings": {  // ← Configuración de VOZ específica de campaña
    "language": "es-CL",
    "speed": 1.0
  },
  
  "call_settings": {  // ← Configuración de LLAMADAS específica de campaña
    "allowed_hours": {
      "start": "09:00",
      "end": "18:00"
    },
    "days_of_week": [1,2,3,4,5],
    "max_attempts": 3,
    "retry_delay_hours": 24,
    "timezone": "America/Santiago"
  }
}
```

---

## 📸 Screenshots del Frontend Corregido

### ✅ ANTES (Incorrecto) - Account con configuraciones de campaña
```
CreateAccountModal:
├── Información de la Empresa ✅
├── Plan y Facturación ✅
├── Características Incluidas ✅
├── Configuraciones de Llamadas ❌ ← ESTABA MAL
│   ├── Hora de Inicio / Fin ❌
│   ├── Zona Horaria ✅ (solo esta sí)
│   ├── Intentos Máximos ❌
│   └── Horas entre Intentos ❌
```

### ✅ DESPUÉS (Correcto) - Account solo con info de cuenta
```
CreateAccountModal:
├── Información de la Empresa ✅
├── Plan y Facturación ✅
├── Límites Técnicos ✅
│   └── Llamadas Concurrentes Máximas ✅
└── Configuración Regional ✅
    └── Zona Horaria por Defecto ✅
```

### ✅ CreateBatchModal - Configuraciones de campaña
```
CreateBatchModal:
├── Información Básica ✅
│   ├── Seleccionar Cuenta
│   ├── Nombre de la Campaña
│   ├── Descripción
│   └── Script de la Llamada
├── Subir Contactos ✅
├── Configuración de Llamadas ✅ ← AQUÍ VAN AHORA
│   ├── Duración máxima de llamada
│   ├── Timeout de ring
│   ├── Horarios permitidos (Inicio - Fin)
│   ├── Días de la semana
│   ├── Reintentos máximos
│   ├── Delay entre reintentos
│   └── Zona horaria
├── Configuración de Voz ✅
│   ├── Idioma
│   ├── Velocidad
│   ├── Tono
│   └── Volumen
└── Programación ✅
```

---

## 💡 ¿Por qué esta separación?

### Ejemplo Real:

**EMPRESA ABC** (Account)
- Tiene 10,000 créditos
- Plan permite 10 llamadas concurrentes
- Timezone por defecto: Santiago

Esta empresa puede crear **múltiples campañas diferentes**:

**CAMPAÑA 1: Cobranza Urgente**
- Horario: 09:00 - 21:00
- Días: Lunes a Sábado
- Reintentos: 5 veces
- Voz: Formal, velocidad 1.0
- Script: "Urgente: Pago vencido..."

**CAMPAÑA 2: Recordatorio Amigable**
- Horario: 10:00 - 18:00
- Días: Lunes a Viernes
- Reintentos: 2 veces
- Voz: Amigable, velocidad 1.2
- Script: "Hola, le recordamos..."

**CAMPAÑA 3: Encuesta Satisfacción**
- Horario: 14:00 - 20:00
- Días: Lunes a Viernes
- Reintentos: 1 vez
- Voz: Neutral, velocidad 0.9
- Script: "¿Cómo califica nuestro servicio?..."

### ✅ Ventajas de esta arquitectura:

1. **Flexibilidad**: Cada campaña tiene su configuración independiente
2. **Reutilización**: Misma cuenta, múltiples estrategias de contacto
3. **Control**: Diferentes horarios/reintentos según urgencia
4. **Claridad**: Separación clara entre "quien contrata" (Account) y "qué campaña ejecuta" (Batch)

---

## 🛠️ Cambios Realizados en Frontend

### ✅ Archivos Modificados:

1. **`src/components/accounts/CreateAccountModal.tsx`**
   - ✅ Eliminado: `allowed_call_hours`
   - ✅ Eliminado: `retry_settings`
   - ✅ Mantenido: `timezone` (como predeterminado)
   - ✅ Simplificado: Solo checkboxes de features contratadas

2. **`src/types/index.ts`**
   - ✅ Actualizado: `AccountModel.settings` solo con `timezone`
   - ✅ Actualizado: `CreateAccountRequest.settings` solo con `timezone`
   - ✅ Mantenido: `CreateBatchRequest.call_settings` completo

3. **`FRONTEND_COMPLETE_GUIDE.md`**
   - ✅ Documentado: Nueva estructura del modal
   - ✅ Actualizado: Pendientes de prioridad ALTA

---

## 🎯 Resumen Ejecutivo

| Concepto | Account (Cuenta) | Batch (Campaña) |
|----------|------------------|-----------------|
| **¿Qué es?** | Cliente/Empresa | Campaña específica |
| **Cantidad** | Uno por cliente | Muchos por cuenta |
| **Horarios de llamada** | ❌ NO | ✅ SÍ (call_settings) |
| **Reintentos** | ❌ NO | ✅ SÍ (call_settings) |
| **Script** | ❌ NO | ✅ SÍ |
| **Voz** | ❌ NO | ✅ SÍ (voice_settings) |
| **Timezone** | ✅ Predeterminado | ✅ Específico de campaña |
| **Balance/Créditos** | ✅ SÍ | ❌ NO (usa el del Account) |
| **Max concurrent calls** | ✅ SÍ (límite del plan) | ❌ NO (respeta el del Account) |
| **Contactos** | ❌ NO | ✅ SÍ (jobs del batch) |

---

**Estado Final:** ✅ Frontend corregido y alineado con arquitectura del backend  
**Próximo paso:** Continuar con los demás pendientes de prioridad ALTA
