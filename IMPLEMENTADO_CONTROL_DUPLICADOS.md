# ✅ Implementado: Control de Duplicados en Creación de Batch

## 📋 Problema Resuelto

**Error 400:** "No hay deudores válidos para procesar después de filtrar duplicados"

**Causa:** Todos los contactos del Excel ya existían en otros batches de la cuenta y el sistema los rechazaba por duplicados.

**Solución:** Agregar checkbox "Permitir contactos duplicados" para que el usuario pueda decidir.

---

## 🔧 Cambios Implementados

### 1️⃣ **types/index.ts** - Agregar campo a interface

```typescript
export interface CreateBatchRequest {
  account_id: string;
  name: string;
  description?: string;
  priority?: number;
  call_settings?: { ... };
  excel_file?: File | null;
  allow_duplicates?: boolean; // ✅ NUEVO - Default: false
}
```

**Beneficio:**
- ✅ TypeScript sabe que existe el campo
- ✅ Documentado con comentario
- ✅ Opcional (default: false)

---

### 2️⃣ **CreateBatchModal.tsx** - Agregar estado y UI

**Estado inicial:**
```typescript
const [formData, setFormData] = useState<CreateBatchRequest>({
  account_id: '',
  name: '',
  description: '',
  priority: 1,
  call_settings: { ... },
  excel_file: null,
  allow_duplicates: false // ✅ NUEVO - Default: false
});
```

**UI agregado (Step 2: Contactos):**
```tsx
{/* Checkbox: Permitir Duplicados */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <label className="flex items-start space-x-3 cursor-pointer">
    <input
      type="checkbox"
      checked={formData.allow_duplicates}
      onChange={(e) => handleInputChange('allow_duplicates', e.target.checked)}
      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
    />
    <div className="flex-1">
      <span className="text-sm font-medium text-gray-900">
        Permitir contactos duplicados
      </span>
      <p className="text-xs text-gray-600 mt-1">
        Si los contactos ya existen en otras campañas de esta cuenta, 
        permite crear un nuevo batch con ellos. Útil para crear nuevas 
        campañas con los mismos contactos o reintentar con diferentes horarios.
      </p>
    </div>
  </label>
</div>
```

**Ubicación:** Después del file upload, antes del preview del Excel.

**Beneficios:**
- ✅ Checkbox visible y claro
- ✅ Explicación detallada del propósito
- ✅ Estilo destacado (fondo azul claro)
- ✅ Default: false (más seguro)

---

### 3️⃣ **BatchesPage.tsx** - Pasar valor al backend

**Antes:**
```typescript
await createBatchFromExcelMutation.mutateAsync({
  file: batchData.excel_file,
  accountId: batchData.account_id,
  batchName: batchData.name,
  batchDescription: batchData.description,
  allowDuplicates: false, // ❌ Siempre false
  callSettings: batchData.call_settings,
  processingType: 'basic'
});
```

**Después:**
```typescript
await createBatchFromExcelMutation.mutateAsync({
  file: batchData.excel_file,
  accountId: batchData.account_id,
  batchName: batchData.name,
  batchDescription: batchData.description,
  allowDuplicates: batchData.allow_duplicates ?? false, // ✅ Usa valor del form
  callSettings: batchData.call_settings,
  processingType: 'basic'
});
```

**Beneficio:**
- ✅ Respeta la elección del usuario
- ✅ Fallback a false si no está definido (seguro)

---

### 4️⃣ **Logging mejorado**

Agregado en BatchesPage:
```typescript
console.log('allowDuplicates:', batchData.allow_duplicates);
```

Esto aparece en:
```
📤 Enviando a createBatchFromExcel con:
  file: "contactos.xlsx"
  accountId: "acc-a1b2c3d4e5f6"
  batchName: "Campaña Test"
  callSettings: {...}
  allowDuplicates: true  ← ✅ Se puede verificar
```

---

## 🎯 Flujo de Usuario

### Flujo 1: Primera Campaña (Sin duplicados)
```
1. Usuario carga Excel
2. Checkbox "Permitir duplicados" está desmarcado (default)
3. Usuario crea campaña
4. Backend verifica duplicados
5. No hay duplicados → Batch creado con 10 jobs ✅
```

### Flujo 2: Segunda Campaña (Con duplicados, checkbox OFF)
```
1. Usuario carga mismo Excel
2. Checkbox "Permitir duplicados" está desmarcado
3. Usuario intenta crear campaña
4. Backend detecta 10 duplicados
5. Backend rechaza: Error 400 ❌
6. Frontend muestra error
7. Usuario ve checkbox y lo activa
8. Usuario reintenta
9. Batch creado con 10 jobs ✅
```

### Flujo 3: Segunda Campaña (Checkbox activado desde inicio)
```
1. Usuario carga mismo Excel
2. Usuario ACTIVA checkbox "Permitir duplicados"
3. Usuario crea campaña
4. Backend NO verifica duplicados (allow_duplicates=true)
5. Batch creado con 10 jobs ✅
```

---

## 📊 Casos de Uso

### ✅ Cuándo usar "Permitir duplicados"

1. **Nueva campaña con mismos contactos**
   - Ejemplo: "Cobranza Octubre" → "Cobranza Noviembre"
   - Mismo Excel, nueva fecha/mensaje
   - ✅ Activar checkbox

2. **Reintentar con diferentes horarios**
   - Primera campaña: 9-18h
   - Segunda campaña: 18-20h (horario nocturno)
   - ✅ Activar checkbox

3. **Diferentes estrategias de cobranza**
   - Primera: 3 intentos, tono formal
   - Segunda: 5 intentos, tono amigable
   - ✅ Activar checkbox

### ❌ Cuándo NO usar "Permitir duplicados"

1. **Primera vez subiendo contactos**
   - No hay batches previos
   - ❌ Dejar desmarcado

2. **Validar que no haya duplicados accidentales**
   - Quiero asegurarme que el Excel no tenga contactos repetidos
   - ❌ Dejar desmarcado

---

## 🧪 Testing

### Test 1: Checkbox OFF (Default)
```typescript
// Estado inicial
formData.allow_duplicates = false

// FormData enviado
allow_duplicates: "false"

// Resultado con duplicados
❌ Error 400: "No hay deudores válidos para procesar"
```

### Test 2: Checkbox ON
```typescript
// Usuario activa checkbox
formData.allow_duplicates = true

// FormData enviado
allow_duplicates: "true"

// Resultado con duplicados
✅ Batch creado con 10 jobs
```

### Test 3: Contactos nuevos (sin duplicados)
```typescript
// Checkbox OFF o ON, no importa
formData.allow_duplicates = false

// FormData enviado
allow_duplicates: "false"

// Resultado sin duplicados
✅ Batch creado con 10 jobs (no había duplicados)
```

---

## 📝 Validación Visual

El checkbox aparece así:

```
┌─────────────────────────────────────────────────────────┐
│ [✓] Permitir contactos duplicados                       │
│                                                          │
│ Si los contactos ya existen en otras campañas de esta   │
│ cuenta, permite crear un nuevo batch con ellos. Útil    │
│ para crear nuevas campañas con los mismos contactos o   │
│ reintentar con diferentes horarios.                      │
└─────────────────────────────────────────────────────────┘
```

**Ubicación:** Step 2 (Contactos), después del file upload

**Estilo:**
- ✅ Fondo azul claro (`bg-blue-50`)
- ✅ Borde azul (`border-blue-200`)
- ✅ Texto explicativo claro
- ✅ Checkbox grande y visible

---

## 🎨 Mejora Futura (Opcional)

Según la guía del backend, se podría implementar un **modal de confirmación** cuando hay duplicados:

```typescript
// Si hay error 400 con duplicados
if (error.response?.status === 400 && 
    error.response?.data?.detail?.includes('duplicados')) {
  
  Modal.confirm({
    title: '⚠️ Contactos Duplicados Encontrados',
    content: `Se encontraron contactos que ya existen en otras campañas. 
              ¿Deseas crear el batch de todos modos?`,
    okText: 'Sí, crear batch',
    cancelText: 'Cancelar',
    onOk: async () => {
      // Reintentar con allow_duplicates=true
      formData.allow_duplicates = true;
      await handleSubmit();
    }
  });
}
```

**Beneficio:** UX más fluida, usuario no necesita saber del checkbox hasta que sea necesario.

---

## ✅ Archivos Modificados

1. ✅ `src/types/index.ts` - Agregar `allow_duplicates?: boolean`
2. ✅ `src/components/batches/CreateBatchModal.tsx` - Agregar checkbox y estado
3. ✅ `src/pages/Batches/BatchesPage.tsx` - Pasar valor al backend

---

## 📊 Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| Control duplicados | ❌ Siempre false | ✅ Usuario decide |
| UI para configurar | ❌ No existe | ✅ Checkbox visible |
| Explicación | ❌ No hay | ✅ Tooltip explicativo |
| Logging | ❌ No se logea | ✅ Se muestra en consola |
| Default seguro | ✅ false | ✅ Mantiene false |

---

**Estado:** ✅ **IMPLEMENTADO Y LISTO**  
**Próximo paso:** Probar creando una campaña con el mismo Excel dos veces (con y sin checkbox activado)

---

**Última actualización:** 24 Octubre 2025
