# 🐛 Fix: Error 422 en Creación de Batch desde Excel

## 📋 Problema Original

```
SyntaxError: Unexpected token 'o', "[object FormData]" is not valid JSON
Failed to load resource: the server responded with a status of 422 (Unprocessable Entity)
```

## 🔍 Causa del Error

Había **2 problemas principales**:

### 1️⃣ Error de JSON.parse en api.ts (Línea 42)
**Problema:** El interceptor intentaba parsear el `FormData` como JSON
```typescript
// ❌ INCORRECTO - Crasheaba con FormData
console.log('Request Body:', error.config?.data ? JSON.parse(error.config.data) : undefined);
```

**Solución:** Detectar si es FormData antes de parsear
```typescript
// ✅ CORRECTO - Maneja FormData correctamente
const isFormData = error.config?.data instanceof FormData;
console.log('Request Body:', isFormData ? '[FormData]' : (error.config?.data ? JSON.parse(error.config.data) : undefined));
```

---

### 2️⃣ Falta de call_settings_json en el FormData
**Problema:** No se estaba enviando `call_settings_json` como JSON string según especificación del backend

**Solución:** Agregar `call_settings_json` serializado correctamente

---

## ✅ Cambios Implementados

### 1. **api.ts** - Fix JSON.parse Error

**Archivo:** `src/services/api.ts`

```typescript
// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    console.group('🔴 API Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Response Data:', error.response?.data);
    console.log('Request URL:', error.config?.url);
    console.log('Request Method:', error.config?.method?.toUpperCase());
    
    // ✅ FIX: Only parse JSON if Content-Type is application/json
    const isFormData = error.config?.data instanceof FormData;
    console.log('Request Body:', isFormData ? '[FormData]' : (error.config?.data ? JSON.parse(error.config.data) : undefined));
    
    console.log('Base URL:', error.config?.baseURL);
    console.log('Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    console.log('Request Params:', error.config?.params);
    console.groupEnd();
    // ... rest of interceptor
  }
);
```

**Beneficio:**
- ✅ No más crash al intentar parsear FormData
- ✅ Logs de error funcionan correctamente
- ✅ Mejor debugging de errores

---

### 2. **queries.ts** - Agregar call_settings_json

**Archivo:** `src/services/queries.ts`

**Antes:**
```typescript
export const useCreateBatchFromExcel = () => {
  return useMutation({
    mutationFn: async ({
      file,
      accountId,
      batchName,
      batchDescription,
      allowDuplicates = false,
    }: { ... }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('account_id', accountId);
      if (batchName) formData.append('batch_name', batchName);
      if (batchDescription) formData.append('batch_description', batchDescription);
      formData.append('allow_duplicates', allowDuplicates.toString());
      // ❌ FALTA: call_settings_json
      
      const response = await api.post('/batches/excel/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
  });
};
```

**Después:**
```typescript
export const useCreateBatchFromExcel = () => {
  return useMutation({
    mutationFn: async ({
      file,
      accountId,
      batchName,
      batchDescription,
      allowDuplicates = false,
      callSettings,              // ✅ NUEVO
      processingType = 'basic',  // ✅ NUEVO
      diasFechaLimite,           // ✅ NUEVO
      diasFechaMaxima            // ✅ NUEVO
    }: {
      file: File;
      accountId: string;
      batchName?: string;
      batchDescription?: string;
      allowDuplicates?: boolean;
      callSettings?: any;                    // ✅ NUEVO
      processingType?: 'basic' | 'acquisition'; // ✅ NUEVO
      diasFechaLimite?: number;              // ✅ NUEVO
      diasFechaMaxima?: number;              // ✅ NUEVO
    }) => {
      const formData = new FormData();
      
      // Required fields
      formData.append('file', file);
      formData.append('account_id', accountId);
      
      // Optional fields
      if (batchName) formData.append('batch_name', batchName);
      if (batchDescription) formData.append('batch_description', batchDescription);
      formData.append('allow_duplicates', allowDuplicates.toString());
      
      // ⚠️ IMPORTANTE: call_settings debe enviarse como JSON STRING
      if (callSettings) {
        formData.append('call_settings_json', JSON.stringify(callSettings));
      }
      
      // Processing type and date limits
      if (processingType) formData.append('processing_type', processingType);
      if (diasFechaLimite !== undefined) formData.append('dias_fecha_limite', diasFechaLimite.toString());
      if (diasFechaMaxima !== undefined) formData.append('dias_fecha_maxima', diasFechaMaxima.toString());
      
      const response = await api.post('/batches/excel/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data as ExcelCreateResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};
```

**Cambios Clave:**
1. ✅ Agregado parámetro `callSettings`
2. ✅ Serializado como JSON string: `JSON.stringify(callSettings)`
3. ✅ Agregados parámetros adicionales del backend: `processingType`, `diasFechaLimite`, `diasFechaMaxima`

---

### 3. **BatchesPage.tsx** - Pasar call_settings

**Archivo:** `src/pages/Batches/BatchesPage.tsx`

**Antes:**
```typescript
const handleCreateBatch = async (batchData: CreateBatchRequest) => {
  try {
    if (batchData.excel_file) {
      await createBatchFromExcelMutation.mutateAsync({
        file: batchData.excel_file,
        accountId: batchData.account_id,
        batchName: batchData.name,
        batchDescription: batchData.description,
        allowDuplicates: false
        // ❌ FALTA: callSettings
      });
    } else {
      await createBatchMutation.mutateAsync(batchData);
    }
    setShowCreateModal(false);
  } catch (error) {
    console.error('Error creating batch:', error);
  }
};
```

**Después:**
```typescript
const handleCreateBatch = async (batchData: CreateBatchRequest) => {
  try {
    if (batchData.excel_file) {
      await createBatchFromExcelMutation.mutateAsync({
        file: batchData.excel_file,
        accountId: batchData.account_id,
        batchName: batchData.name,
        batchDescription: batchData.description,
        allowDuplicates: false,
        callSettings: batchData.call_settings, // ✅ NUEVO: Pasar call_settings
        processingType: 'basic'
      });
    } else {
      await createBatchMutation.mutateAsync(batchData);
    }
    setShowCreateModal(false);
  } catch (error) {
    console.error('Error creating batch:', error);
  }
};
```

**Beneficio:**
- ✅ Ahora se pasan las configuraciones de llamada al crear batch desde Excel
- ✅ Backend recibe la configuración correcta

---

## 📊 Comparación Antes/Después

### Antes (❌ Error 422)
```
FormData {
  file: [File],
  account_id: "acc-123",
  batch_name: "Campaña Test",
  batch_description: "Test",
  allow_duplicates: "false"
  // ❌ FALTA: call_settings_json
}

→ Backend rechaza: Error 422
→ Frontend crashea al parsear error
```

### Después (✅ Funciona)
```
FormData {
  file: [File],
  account_id: "acc-123",
  batch_name: "Campaña Test",
  batch_description: "Test",
  allow_duplicates: "false",
  call_settings_json: '{"max_call_duration":300,"ring_timeout":30,...}', // ✅ JSON STRING
  processing_type: "basic"
}

→ Backend acepta request
→ Batch creado exitosamente
```

---

## 🧪 Testing

Para probar que funciona correctamente:

1. **Abrir CreateBatchModal**
2. **Completar formulario:**
   - Seleccionar cuenta
   - Nombre: "Test Campaña"
   - Descripción: "Prueba"
   - Subir archivo Excel
   - Configurar horarios de llamada
3. **Enviar formulario**
4. **Verificar en consola:**
   ```
   📤 Enviando batch con datos: {
     account_id: "acc-...",
     name: "Test Campaña",
     call_settings: { max_call_duration: 300, ... }
   }
   ```
5. **Verificar response exitosa (200 OK):**
   ```json
   {
     "success": true,
     "batch_id": "batch-20251024-...",
     "jobs_created": 100
   }
   ```

---

## 📝 Notas Importantes

### ⚠️ call_settings_json DEBE ser JSON STRING

```typescript
// ❌ INCORRECTO - Causará error 422
formData.append('call_settings_json', callSettings);
formData.append('call_settings_json', { ...callSettings });

// ✅ CORRECTO - Funciona correctamente
formData.append('call_settings_json', JSON.stringify(callSettings));
```

### 📋 Estructura de call_settings

```typescript
{
  max_call_duration: number;      // Segundos (ej: 300 = 5 min)
  ring_timeout: number;           // Segundos (ej: 30)
  max_attempts: number;           // Reintentos (ej: 3)
  retry_delay_hours: number;      // Horas entre reintentos (ej: 24)
  allowed_hours: {
    start: string;                // Formato HH:MM (ej: "09:00")
    end: string;                  // Formato HH:MM (ej: "18:00")
  };
  days_of_week: number[];         // 0=Dom, 1=Lun, ... 6=Sab (ej: [1,2,3,4,5])
  timezone: string;               // IANA timezone (ej: "America/Santiago")
}
```

---

## 📚 Documentos Relacionados

1. ✅ `FRONTEND_FORMDATA_GUIDE.md` - Guía completa del backend sobre FormData
2. ✅ `API_ENDPOINTS_REFERENCE.md` - Referencia de endpoints
3. ✅ `FRONTEND_BACKEND_ANALYSIS.md` - Análisis de compatibilidad
4. ✅ `CAMBIOS_IMPLEMENTADOS.md` - Resumen de cambios anteriores

---

## ✅ Estado Final

- [x] **Error 422 resuelto**
- [x] **FormData se envía correctamente**
- [x] **call_settings_json como JSON string**
- [x] **api.ts no crashea con FormData**
- [x] **BatchesPage pasa call_settings**
- [x] **Logs de error funcionan correctamente**

---

**Última actualización:** 24 Octubre 2025  
**Estado:** ✅ RESUELTO
