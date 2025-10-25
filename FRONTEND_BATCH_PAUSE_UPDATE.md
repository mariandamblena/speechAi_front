# Actualización Frontend - Pausa de Batches

## Resumen
Se ha actualizado el frontend para usar el endpoint **PATCH** recomendado del backend para pausar/reanudar batches, siguiendo la implementación documentada en `BATCH_PAUSE_IMPLEMENTATION.md`.

## Cambios Realizados

### 1. Actualización de Hooks en `src/services/queries.ts`

#### ✅ `usePauseBatch()` - Actualizado
```typescript
// Antes (endpoint legacy)
PUT /api/v1/batches/{batch_id}/pause

// Ahora (endpoint PATCH recomendado)
PATCH /api/v1/batches/{batch_id}
Body: { "is_active": false }
```

#### ✅ `useResumeBatch()` - Actualizado
```typescript
// Antes (endpoint legacy)
PUT /api/v1/batches/{batch_id}/resume

// Ahora (endpoint PATCH recomendado)
PATCH /api/v1/batches/{batch_id}
Body: { "is_active": true }
```

#### ✅ `useToggleBatchStatus()` - Mejorado
```typescript
// Ya usaba PATCH, pero ahora con mejor invalidación de queries
onSuccess: (_, { batchId }) => {
  queryClient.invalidateQueries({ queryKey: ['batches', batchId] });
  queryClient.invalidateQueries({ queryKey: ['batches'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] }); // ✨ NUEVO
}
```

#### ✨ `useUpdateBatch()` - NUEVO Hook
Hook flexible para actualizar múltiples campos del batch en una sola llamada:
```typescript
const updateBatch = useUpdateBatch();

// Ejemplo de uso
updateBatch.mutate({
  batchId: 'batch-123',
  updates: {
    is_active: false,
    name: 'Campaña Actualizada',
    priority: 3
  }
});
```

#### ✅ `useBatchJobs()` - Corregido
```typescript
// Antes (endpoint inexistente)
GET /api/v1/batches/{batch_id}/jobs  // ❌ 404 Not Found

// Ahora (endpoint correcto)
GET /api/v1/jobs?batch_id={batch_id}  // ✅ 200 OK
```

### 2. Actualización de `BatchDetailModal.tsx`

#### Endpoint de Jobs Corregido
```typescript
// Antes: usaba batch._id (MongoDB ObjectID)
useBatchJobs(batch?._id || '')

// Ahora: usa batch.batch_id (ID del sistema)
useBatchJobs(batch?.batch_id || '')
```

#### Mejoras en el Manejo de Datos
- ✅ Validación robusta: `!jobs || !Array.isArray(jobs) || jobs.length === 0`
- ✅ Mapeo correcto de campos del backend:
  - `job.contact.name` y `job.contact.phones[0]`
  - `job.attempts` en lugar de `job.attempts_made`
  - `job.call_duration_seconds`
  - Estados: `pending`, `in_progress`, `completed`, `failed`, `done`, `cancelled`

## Compatibilidad con Backend

### Estados de Jobs Soportados
| Estado Backend | Visualización | Color |
|----------------|---------------|-------|
| `pending` | Pendiente | Amarillo |
| `scheduled` | Programado | Amarillo |
| `in_progress` | En Progreso | Azul |
| `completed` | Completado | Verde |
| `done` | Completado | Verde |
| `failed` | Fallido | Rojo |
| `cancelled` | Cancelado | Gris |
| `suspended` | Suspendido | Naranja |

### Endpoints Utilizados

| Hook | Método | Endpoint | Body/Params |
|------|--------|----------|-------------|
| `usePauseBatch` | PATCH | `/batches/{id}` | `{ is_active: false }` |
| `useResumeBatch` | PATCH | `/batches/{id}` | `{ is_active: true }` |
| `useToggleBatchStatus` | PATCH | `/batches/{id}` | `{ is_active: boolean }` |
| `useUpdateBatch` | PATCH | `/batches/{id}` | `{ ...updates }` |
| `useDeleteBatch` | DELETE | `/batches/{id}` | `?delete_jobs=boolean` |
| `useBatchJobs` | GET | `/jobs` | `?batch_id={id}` |

## Invalidación de Queries

Todos los hooks de mutación ahora invalidan correctamente:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['batches', batchId] }); // Batch específico
  queryClient.invalidateQueries({ queryKey: ['batches'] });          // Lista de batches
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });  // Dashboard stats
}
```

Esto asegura que:
- ✅ El batch se actualiza inmediatamente en el detalle
- ✅ La lista de batches refleja los cambios
- ✅ Las estadísticas del dashboard se actualizan
- ✅ No se necesita recargar la página manualmente

## Comportamiento del Sistema

### Cuando se pausa un batch:
1. ✅ El frontend envía `PATCH /batches/{id}` con `is_active: false`
2. ✅ El backend marca el batch como inactivo
3. ✅ El worker deja de tomar jobs de ese batch
4. ✅ Los jobs en progreso continúan hasta completarse
5. ✅ El UI se actualiza automáticamente sin refrescar

### Cuando se reanuda un batch:
1. ✅ El frontend envía `PATCH /batches/{id}` con `is_active: true`
2. ✅ El backend marca el batch como activo
3. ✅ El worker vuelve a tomar jobs de ese batch
4. ✅ El UI refleja el cambio inmediatamente

### Cuando se eliminan batches:
1. ✅ El frontend envía `DELETE /batches/{id}`
2. ✅ El backend elimina el batch
3. ✅ Los jobs pendientes se marcan como `CANCELLED`
4. ✅ La lista se actualiza automáticamente

## Uso en Componentes

### Pausar/Reanudar (Opción 1: Hooks individuales)
```typescript
const pauseBatch = usePauseBatch();
const resumeBatch = useResumeBatch();

// Pausar
pauseBatch.mutate(batchId);

// Reanudar
resumeBatch.mutate(batchId);
```

### Pausar/Reanudar (Opción 2: Hook toggle - Recomendado)
```typescript
const toggleStatus = useToggleBatchStatus();

// Pausar
toggleStatus.mutate({ batchId, isActive: false });

// Reanudar
toggleStatus.mutate({ batchId, isActive: true });
```

### Actualizar múltiples campos
```typescript
const updateBatch = useUpdateBatch();

updateBatch.mutate({
  batchId: 'batch-123',
  updates: {
    is_active: false,
    name: 'Nuevo nombre',
    description: 'Nueva descripción',
    priority: 3
  }
});
```

## Testing

Para probar que todo funciona:

1. **Crear un batch con el wizard**
2. **Pausar el batch** desde el detalle o la lista
3. **Verificar que el estado cambia** sin refrescar
4. **Ver las llamadas (jobs)** en la pestaña "Llamadas"
5. **Reanudar el batch** y verificar el cambio
6. **Dashboard debe actualizar** las estadísticas

## Próximos Pasos Opcionales

- [ ] Agregar confirmación visual al pausar/reanudar (toast/notification)
- [ ] Mostrar timestamp de última actualización del batch
- [ ] Agregar filtros por estado en la lista de batches
- [ ] Implementar auto-refresh cada X segundos en batch detail
- [ ] Agregar botón bulk para pausar/reanudar múltiples batches

---

**Fecha:** 25 de Octubre, 2025  
**Estado:** ✅ Implementado y Compilado  
**Compatibilidad:** Backend v1.0.0 (ver `BATCH_PAUSE_IMPLEMENTATION.md`)
