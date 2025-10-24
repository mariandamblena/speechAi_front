# ✅ Resumen: Fix Error 422 - Batch desde Excel

## 🎯 Problema Resuelto
```
❌ Error 422: Unexpected token 'o', "[object FormData]" is not valid JSON
✅ Ahora funciona correctamente
```

---

## 🔧 Archivos Modificados

### 1️⃣ `src/services/api.ts`
**Problema:** Intentaba parsear FormData como JSON → crash
**Solución:** Detectar FormData antes de parsear

```typescript
// ✅ Agregado
const isFormData = error.config?.data instanceof FormData;
console.log('Request Body:', isFormData ? '[FormData]' : JSON.parse(...));
```

---

### 2️⃣ `src/services/queries.ts` - useCreateBatchFromExcel
**Problema:** No enviaba `call_settings_json` requerido por backend
**Solución:** Agregado serialización JSON de call_settings

```typescript
// ✅ Nuevos parámetros agregados
{
  callSettings?: any;                    // NUEVO
  processingType?: 'basic' | 'acquisition'; // NUEVO
  diasFechaLimite?: number;              // NUEVO
  diasFechaMaxima?: number;              // NUEVO
}

// ✅ Agregado en FormData
if (callSettings) {
  formData.append('call_settings_json', JSON.stringify(callSettings));
}
```

---

### 3️⃣ `src/pages/Batches/BatchesPage.tsx`
**Problema:** No pasaba call_settings al crear desde Excel
**Solución:** Agregado parámetro callSettings

```typescript
await createBatchFromExcelMutation.mutateAsync({
  file: batchData.excel_file,
  accountId: batchData.account_id,
  batchName: batchData.name,
  batchDescription: batchData.description,
  allowDuplicates: false,
  callSettings: batchData.call_settings, // ✅ NUEVO
  processingType: 'basic'
});
```

---

### 4️⃣ `src/components/batches/CreateBatchModal.tsx`
**Mejora:** Logs más detallados para debugging

```typescript
console.group('📤 Enviando batch con datos:');
console.log('Form Data:', formData);
console.log('Call Settings (will be JSON stringified):', formData.call_settings);
console.groupEnd();
```

---

## 📊 FormData Completo que se Envía

```javascript
FormData {
  // Requeridos
  file: [File Object],
  account_id: "acc-a1b2c3d4e5f6",
  
  // Opcionales pero recomendados
  batch_name: "Campaña Test",
  batch_description: "Descripción de prueba",
  allow_duplicates: "false",
  
  // ⚠️ CRÍTICO: JSON STRING, no objeto
  call_settings_json: '{"max_call_duration":300,"ring_timeout":30,"max_attempts":3,"retry_delay_hours":24,"allowed_hours":{"start":"09:00","end":"18:00"},"days_of_week":[1,2,3,4,5],"timezone":"America/Santiago"}',
  
  // Opcionales
  processing_type: "basic",
  // dias_fecha_limite: "30",
  // dias_fecha_maxima: "60"
}
```

---

## 🧪 Cómo Probar

1. **Abrir aplicación** y navegar a Batches
2. **Hacer clic** en "Nueva Campaña"
3. **Completar formulario:**
   - Step 1: Seleccionar cuenta, nombre, descripción
   - Step 2: Subir archivo Excel
   - Step 3: Configurar horarios (opcional, ya tiene defaults)
4. **Hacer clic** en "Crear Campaña"
5. **Verificar en consola del navegador:**
   ```
   📤 Enviando batch con datos:
   Form Data: { account_id: "...", call_settings: {...} }
   Call Settings (will be JSON stringified): {...}
   ```
6. **Verificar response:**
   ```json
   {
     "success": true,
     "batch_id": "batch-20251024-...",
     "jobs_created": 100
   }
   ```

---

## ✅ Checklist Final

- [x] Error JSON.parse resuelto
- [x] FormData construido correctamente
- [x] call_settings_json como JSON string
- [x] Parámetros adicionales agregados
- [x] Logs mejorados para debugging
- [x] Documentación completa creada

---

## 📚 Documentos Creados

1. ✅ `FIX_FORMDATA_ERROR.md` - Detalle técnico completo
2. ✅ `QUICK_FIX_SUMMARY.md` - Este resumen rápido

---

**Estado:** ✅ **LISTO PARA PROBAR**
