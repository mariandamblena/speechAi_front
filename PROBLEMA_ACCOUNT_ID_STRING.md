# 🔴 PROBLEMA: account_id = "string"

## 📊 Error en Logs

```
account_id: string
account_id tipo: string
❌ ERROR: account_id inválido: string
```

---

## 🔍 Causa del Problema

El usuario **NO está seleccionando una cuenta** del dropdown en el **Step 1: Información Básica**.

Cuando no se selecciona nada, el `account_id` queda:
- Vacío (`""`)
- O con valor literal `"string"` (por algún default incorrecto)

---

## ✅ Solución: DEBES SELECCIONAR UNA CUENTA

### Paso a Paso:

1. **Abrir modal** "Crear Nueva Campaña"
2. **Step 1: Información Básica**
3. **Campo "Cuenta de Cliente"** → Click en el dropdown
4. **Seleccionar** una cuenta de la lista (Ej: "Empresa XYZ (100 créditos)")
5. **Completar** nombre de campaña
6. **Continuar** a Step 2

---

## 🎯 Cuenta Válida

Una cuenta válida tiene este formato:

```
ID: acc-a1b2c3d4e5f6
Nombre: Empresa XYZ
Créditos: 100
```

### ❌ INCORRECTO:
- No seleccionar nada → `account_id: ""`
- Valor por defecto → `account_id: "string"`

### ✅ CORRECTO:
- Seleccionar del dropdown → `account_id: "acc-a1b2c3d4e5f6"`

---

## 🔧 Mejoras Implementadas

### 1️⃣ Logging de Cuentas Disponibles

Cuando abres el modal, verás en la consola:

```
🏢 Cuentas disponibles:
  Total de cuentas: 2
  1. Empresa XYZ (ID: acc-a1b2c3d4e5f6, Créditos: 100)
  2. Otra Cuenta (ID: acc-123456789abc, Créditos: 50)
```

### 2️⃣ Logging al Seleccionar

Cuando seleccionas una cuenta:

```
🔄 Cuenta seleccionada: acc-a1b2c3d4e5f6
```

### 3️⃣ Confirmación Visual

Debajo del selector ahora aparece:

```
✅ Cuenta seleccionada: Empresa XYZ
```

### 4️⃣ Mensaje de Error Mejorado

Si intentas crear sin seleccionar:

```
❌ Error: Debes seleccionar una cuenta válida del dropdown en el Step 1.

El campo "Cuenta de Cliente" no puede estar vacío.

Cuentas disponibles: 2
```

### 5️⃣ Validación Mejorada

```typescript
if (!formData.account_id || formData.account_id === 'string' || formData.account_id === '') {
  alert('❌ Error: Debes seleccionar una cuenta válida...');
  return;
}
```

---

## 📝 Instrucciones para el Usuario

### Si ves "No hay cuentas disponibles":

1. **Verificar que tienes cuentas creadas** en el sistema
2. **Ir a página de Cuentas** y crear una cuenta si no existe
3. **Recargar** la página de Batches
4. **Intentar crear campaña** de nuevo

### Si hay cuentas disponibles:

1. **Abrir consola del navegador** (F12)
2. **Buscar el log** "🏢 Cuentas disponibles"
3. **Ver las cuentas** listadas
4. **Seleccionar una** del dropdown
5. **Verificar confirmación** "✅ Cuenta seleccionada"
6. **Continuar** con la creación

---

## 🧪 Testing

### Test 1: Ver cuentas disponibles
```
1. Abrir modal "Crear Nueva Campaña"
2. Abrir DevTools (F12) → Console
3. Buscar: "🏢 Cuentas disponibles"
4. Verificar que lista al menos 1 cuenta
```

### Test 2: Seleccionar cuenta
```
1. Click en dropdown "Cuenta de Cliente"
2. Seleccionar una opción
3. Verificar log: "🔄 Cuenta seleccionada: acc-..."
4. Verificar texto: "✅ Cuenta seleccionada: [Nombre]"
```

### Test 3: Intentar sin seleccionar
```
1. NO seleccionar cuenta
2. Llenar nombre
3. Subir Excel
4. Click "Crear Campaña"
5. Debe mostrar alert: "❌ Error: Debes seleccionar..."
```

### Test 4: Flujo completo exitoso
```
1. Seleccionar cuenta ✅
2. Llenar nombre ✅
3. Subir Excel ✅
4. Configurar horarios ✅
5. Click "Crear Campaña" ✅
6. Log debe mostrar: "account_id: acc-a1b2c3d4e5f6" (NO "string")
```

---

## 🎨 UI Actualizado

### Step 1: Selector de Cuenta

```
┌─────────────────────────────────────────────────┐
│ Cuenta de Cliente *                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ ⚠️ Seleccionar cuenta...              ▼    │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Opciones:                                       │
│ - Empresa XYZ (100 créditos)                    │
│ - Otra Cuenta (50 créditos)                     │
└─────────────────────────────────────────────────┘
```

### Cuando seleccionas:

```
┌─────────────────────────────────────────────────┐
│ Cuenta de Cliente *                             │
│ ┌─────────────────────────────────────────────┐ │
│ │ Empresa XYZ (100 créditos)            ▼    │ │
│ └─────────────────────────────────────────────┘ │
│ ✅ Cuenta seleccionada: Empresa XYZ             │
└─────────────────────────────────────────────────┘
```

---

## 📊 Debugging

Si el problema persiste:

```javascript
// En consola del navegador (F12):

// 1. Ver cuentas disponibles
console.log('Cuentas:', accounts);

// 2. Ver valor actual de account_id
console.log('account_id actual:', formData.account_id);

// 3. Ver tipo de dato
console.log('Tipo:', typeof formData.account_id);

// Si account_id === "string", el problema es que:
// - No se está seleccionando del dropdown
// - O hay un default incorrecto en el código
```

---

## ✅ Checklist Pre-Creación

Antes de hacer click en "Crear Campaña", verificar:

- [ ] ✅ Abrí la consola (F12) y veo "🏢 Cuentas disponibles"
- [ ] ✅ Hay al menos 1 cuenta listada
- [ ] ✅ Seleccioné una cuenta del dropdown
- [ ] ✅ Veo "✅ Cuenta seleccionada: [Nombre]"
- [ ] ✅ Veo log "🔄 Cuenta seleccionada: acc-..."
- [ ] ✅ El nombre de campaña está lleno
- [ ] ✅ Subí archivo Excel

---

## 🎯 Resumen

**Problema:** `account_id: "string"`  
**Causa:** No se seleccionó cuenta del dropdown  
**Solución:** DEBES seleccionar una cuenta en Step 1  
**Verificación:** Ver "✅ Cuenta seleccionada" debajo del dropdown

---

**Última actualización:** 24 Octubre 2025
