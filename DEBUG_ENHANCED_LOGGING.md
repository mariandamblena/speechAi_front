# 🔍 Debug: Error 400 - Enhanced Logging

## 📋 Problema Actual

Error 400 al crear batch desde Excel. Según guía del backend, posiblemente estamos enviando `account_id = "string"` literal.

---

## ✅ Logging Agregado

### 1️⃣ CreateBatchModal.tsx - handleSubmit
```typescript
console.group('📤 Enviando batch con datos:');
console.log('Form Data completo:', formData);
console.log('account_id:', formData.account_id);
console.log('account_id tipo:', typeof formData.account_id);
console.log('name:', formData.name);
console.log('excel_file:', formData.excel_file?.name);
console.log('Call Settings:', formData.call_settings);

// Validación crítica
if (!formData.account_id || formData.account_id === 'string' || formData.account_id === '') {
  console.error('❌ ERROR: account_id inválido:', formData.account_id);
  alert('Error: Debes seleccionar una cuenta válida');
  return;
}
console.groupEnd();
```

**Qué muestra:**
- Datos completos del formulario
- Valor exacto del account_id
- Tipo de dato del account_id
- Nombre del archivo Excel
- Validación antes de enviar

---

### 2️⃣ BatchesPage.tsx - handleCreateBatch
```typescript
console.group('🔍 BatchesPage - Datos recibidos del modal:');
console.log('batchData completo:', batchData);
console.log('account_id:', batchData.account_id);
console.log('account_id tipo:', typeof batchData.account_id);
console.log('name:', batchData.name);
console.log('excel_file:', batchData.excel_file?.name);
console.groupEnd();

console.group('📤 Enviando a createBatchFromExcel con:');
console.log('file:', batchData.excel_file.name);
console.log('accountId:', batchData.account_id);
console.log('batchName:', batchData.name);
console.log('callSettings:', batchData.call_settings);
console.groupEnd();
```

**Qué muestra:**
- Datos que llegan desde el modal
- Datos que se pasan a la mutation

---

### 3️⃣ queries.ts - useCreateBatchFromExcel
```typescript
console.group('🔧 useCreateBatchFromExcel - Construyendo FormData:');
console.log('Parámetros recibidos:');
console.log('  - file:', file?.name);
console.log('  - accountId:', accountId);
console.log('  - accountId tipo:', typeof accountId);
console.log('  - batchName:', batchName);
console.log('  - callSettings:', callSettings);

// Después de construir FormData
console.log('📋 FormData final:');
for (const [key, value] of formData.entries()) {
  if (value instanceof File) {
    console.log(`  ${key}: [File] ${value.name}`);
  } else {
    console.log(`  ${key}:`, value);
  }
}
console.groupEnd();
```

**Qué muestra:**
- Parámetros que recibe la función
- Contenido exacto del FormData que se envía al backend

---

### 4️⃣ api.ts - Error Interceptor
```typescript
console.group('🔴 API Error Details:');
console.log('Status:', error.response?.status);
console.log('Response Data (completo):', error.response?.data);

// Mostrar detalle específico del backend
if (responseData?.detail) {
  console.log('❌ Backend Error Detail:', responseData.detail);
}
console.groupEnd();
```

**Qué muestra:**
- Respuesta completa del backend
- Mensaje de error específico con el problema

---

## 🧪 Cómo Usar el Logging

### Paso 1: Intenta crear un batch
1. Abre la aplicación
2. Abre DevTools (F12)
3. Ve a la pestaña Console
4. Intenta crear una campaña

### Paso 2: Verifica los logs en orden
Deberías ver **4 grupos de logs** en este orden:

```
📤 Enviando batch con datos:
  Form Data completo: {account_id: "acc-...", name: "...", ...}
  account_id: "acc-a1b2c3d4e5f6"  ← Debe ser un ID real, NO "string"
  account_id tipo: "string"
  name: "Campaña Test"
  excel_file: "contactos.xlsx"

🔍 BatchesPage - Datos recibidos del modal:
  batchData completo: {...}
  account_id: "acc-a1b2c3d4e5f6"  ← Verificar que sea el mismo

📤 Enviando a createBatchFromExcel con:
  file: "contactos.xlsx"
  accountId: "acc-a1b2c3d4e5f6"  ← Verificar que sea el mismo
  batchName: "Campaña Test"

🔧 useCreateBatchFromExcel - Construyendo FormData:
  Parámetros recibidos:
    - accountId: "acc-a1b2c3d4e5f6"  ← Verificar que sea el mismo
    - accountId tipo: "string"
  📋 FormData final:
    file: [File] contactos.xlsx
    account_id: "acc-a1b2c3d4e5f6"  ← ESTO es lo que se envía al backend
    batch_name: "Campaña Test"
    allow_duplicates: "false"
    call_settings_json: '{"max_call_duration":300,...}'
    processing_type: "basic"
```

### Paso 3: Si hay error, verifica el log de error
```
🔴 API Error Details:
  Status: 400
  Response Data (completo): {...}
  ❌ Backend Error Detail: "account_id inválido: 'string'. Debe ser..."
```

---

## 🎯 Qué Buscar

### ❌ Problema: account_id = "string"
```
📤 Enviando batch con datos:
  account_id: "string"  ← ❌ MAL - Es literal "string"
```

**Causa:** El selector de cuenta no está capturando el valor correctamente.

**Solución:** Verificar el `<select>` en CreateBatchModal línea 206.

---

### ❌ Problema: account_id = ""
```
📤 Enviando batch con datos:
  account_id: ""  ← ❌ MAL - Está vacío
```

**Causa:** Usuario no seleccionó cuenta.

**Solución:** Ya agregamos validación que bloquea el submit.

---

### ✅ Correcto: account_id con formato válido
```
📤 Enviando batch con datos:
  account_id: "acc-a1b2c3d4e5f6"  ← ✅ BIEN - ID real
```

---

## 📝 Checklist de Debugging

Cuando veas el error 400, verifica en los logs:

- [ ] ✅ `account_id` en CreateBatchModal NO es "string"
- [ ] ✅ `account_id` en BatchesPage es el mismo valor
- [ ] ✅ `accountId` en useCreateBatchFromExcel es el mismo valor
- [ ] ✅ FormData.get('account_id') es el mismo valor
- [ ] ✅ Backend Error Detail explica el problema exacto

---

## 🚀 Próximos Pasos

1. **Reinicia el frontend** si está corriendo
2. **Abre DevTools** (F12)
3. **Intenta crear campaña**
4. **Copia todos los logs** de la consola
5. **Pega los logs** en el chat para análisis

---

## 💡 Validaciones Agregadas

### En CreateBatchModal
```typescript
if (!formData.account_id || formData.account_id === 'string' || formData.account_id === '') {
  console.error('❌ ERROR: account_id inválido:', formData.account_id);
  alert('Error: Debes seleccionar una cuenta válida');
  return; // No envía el form
}
```

Esta validación **previene** que se envíe un account_id inválido.

---

## 📊 Formato Esperado de account_id

**Según backend:**
```
acc-XXXXXXXXXXXX
```

**Ejemplos válidos:**
- `acc-a1b2c3d4e5f6`
- `acc-1234567890ab`

**Ejemplos inválidos:**
- `"string"` ← Literal
- `""` ← Vacío
- `null` ← Nulo
- `undefined` ← No definido

---

**Estado:** ✅ Logging completo agregado  
**Siguiente:** Ejecutar aplicación y analizar logs
