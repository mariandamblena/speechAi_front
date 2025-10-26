# Changelog - SpeechAI Frontend

## [2025-10-25] - Funcionalidad de Borrado Masivo y Actualización Automática

### ✨ Nuevas Características

#### 1. Borrado Masivo en Página de Llamadas (`/llamadas`)
- ✅ Checkboxes para seleccionar múltiples llamadas
- ✅ Checkbox "Seleccionar todos" en el header de la tabla
- ✅ Botón "Eliminar (X)" que muestra el número de seleccionados
- ✅ Panel de filtros desplegable con búsqueda por:
  - Nombre del contacto
  - Teléfono
  - ID de lote
- ✅ Confirmación antes de eliminar
- ✅ Feedback de resultados (X eliminados, Y fallaron)
- ✅ Limpieza automática de selección después de eliminar

**Archivos modificados:**
- `src/pages/Jobs/JobsPage.tsx` - Agregada funcionalidad completa de selección y borrado masivo

#### 2. Borrado Masivo en Modal de Detalle de Batch
- ✅ Mismas funcionalidades que en la página de llamadas
- ✅ Filtros específicos por estado de llamada
- ✅ Búsqueda por nombre y teléfono

**Archivos modificados:**
- `src/components/batches/BatchDetailModal.tsx`

### 🔄 Actualizaciones Automáticas de Contadores

#### Problema Resuelto
Cuando se eliminaban llamadas (jobs), los contadores del batch no se actualizaban automáticamente. Los números permanecían estáticos hasta recargar la página.

#### Solución Implementada

##### 1. Invalidación de Queries Mejorada
**Archivo:** `src/services/queries.ts`

Actualizado `useBulkDeleteJobs()` y `useCancelJob()` para invalidar TODAS las queries relacionadas:

```typescript
onSuccess: () => {
  // Invalidar todas las queries relacionadas para actualizar contadores
  queryClient.invalidateQueries({ queryKey: ['jobs'] });          // Lista de jobs
  queryClient.invalidateQueries({ queryKey: ['batch-jobs'] });    // Jobs de un batch
  queryClient.invalidateQueries({ queryKey: ['batches'] });       // ← NUEVO: Lista de batches
  queryClient.invalidateQueries({ queryKey: ['batch'] });         // ← NUEVO: Batch individual
  queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard'] });     // ← NUEVO: Dashboard overview
}
```

**Efecto:** React Query automáticamente refrescará:
- La lista de batches en la página de Campañas
- Los detalles del batch en el modal
- Las estadísticas del dashboard
- La lista de jobs

##### 2. Batch Detail Modal - Datos en Tiempo Real
**Archivo:** `src/components/batches/BatchDetailModal.tsx`

El modal ahora obtiene datos frescos del batch en lugar de usar solo el prop estático:

```typescript
// Antes: Solo usaba el prop estático
const batch = props.batch;

// Ahora: Obtiene datos frescos cuando el modal está abierto
const { data: freshBatch } = useBatch(
  initialBatch?.batch_id || '', 
  { enabled: !!initialBatch && isOpen }
);

// Usar el batch fresco si está disponible, sino el inicial
const batch = freshBatch || initialBatch;
```

**Efecto:** Los contadores se actualizan automáticamente cuando se eliminan jobs.

##### 3. Hook useBatch Mejorado
**Archivo:** `src/services/queries.ts`

Actualizado para aceptar opciones de React Query:

```typescript
export const useBatch = (
  batchId: string, 
  options?: Pick<UseQueryOptions<BatchModel>, 'enabled'>
) => {
  return useQuery({
    queryKey: ['batches', batchId],
    queryFn: async (): Promise<BatchModel> => {
      const response = await api.get(`/batches/${batchId}`);
      return response.data;
    },
    enabled: options?.enabled !== undefined ? options.enabled : !!batchId,
  });
};
```

**Efecto:** Permite controlar cuándo se ejecuta la query (solo cuando el modal está abierto).

### 🎯 Flujo Completo de Actualización

1. **Usuario elimina jobs** (individual o masivo)
2. **Frontend envía DELETE requests** a `/api/v1/jobs/{id}`
3. **Backend elimina jobs** (pendiente: implementar `cancel_job` en JobService)
4. **Frontend recibe respuesta exitosa**
5. **React Query invalida queries** relacionadas
6. **Todas las vistas se actualizan automáticamente:**
   - Modal de batch: contadores actualizados (12 → 10 contactos)
   - Página de Campañas: lista actualizada
   - Dashboard: estadísticas recalculadas
   - Lista de jobs: items eliminados desaparecen

### 📊 Datos que se Actualizan Automáticamente

En el modal de detalle de batch se actualizan:
- **Total Contactos:** `batch.total_jobs` o `batch.stats.total_contacts`
- **Completadas:** `batch.completed_jobs` o `batch.stats.calls_completed`
- **Fallidas:** `batch.failed_jobs` o `batch.stats.calls_failed`
- **Pendientes:** `batch.pending_jobs` (calculado)
- **Barra de progreso:** Basada en completadas + fallidas / total
- **Tasa de éxito:** Completadas / (completadas + fallidas)

### ⚠️ Dependencias del Backend

Para que la funcionalidad funcione completamente, el backend necesita:

1. **Implementar método `cancel_job` en JobService** (ver `BACKEND_REQUIREMENTS.md`)
2. **Actualizar contadores del batch** cuando se elimina un job
3. **Endpoint DELETE /api/v1/jobs/{id}** ya existe pero falla por falta del método

**Estado actual del backend:**
- ❌ Método `cancel_job` no implementado en `JobService`
- ❌ ERROR: `AttributeError: 'JobService' object has no attribute 'cancel_job'`
- ✅ Endpoint DELETE existe en `app/api.py` línea 836
- ✅ Documentación API define el comportamiento esperado

**Ver:** `BACKEND_REQUIREMENTS.md` para instrucciones detalladas de implementación.

### 🧪 Cómo Probar

#### Página de Llamadas:
1. Ir a http://localhost:3002/llamadas
2. Hacer clic en "Filtros" para mostrar búsqueda
3. Seleccionar múltiples jobs con checkboxes
4. Hacer clic en "Eliminar (X)"
5. Confirmar eliminación
6. Verificar mensaje de éxito

#### Modal de Detalle de Batch:
1. Ir a http://localhost:3002/ (Campañas)
2. Hacer clic en "Ver Detalle" de cualquier campaña
3. Ir a la pestaña "Llamadas"
4. Observar el contador "12 Total Contactos" (o el número actual)
5. Seleccionar uno o más jobs con checkboxes
6. Hacer clic en "Eliminar (X)"
7. Confirmar eliminación
8. **Verificar que el contador se actualiza automáticamente** (12 → 11 → 10...)
9. **Verificar que la barra de progreso se actualiza**
10. **Verificar que la lista de jobs se recarga sin los eliminados**

### 📝 Archivos Modificados

1. **src/services/queries.ts**
   - Línea 1: Agregado import `UseQueryOptions`
   - Línea 320-329: Modificado `useBatch` para aceptar opciones
   - Línea 716-729: Actualizado `useCancelJob` con más invalidaciones
   - Línea 737-755: Actualizado `useBulkDeleteJobs` con más invalidaciones

2. **src/pages/Jobs/JobsPage.tsx**
   - Línea 1: Agregados imports `useMemo`, `useBulkDeleteJobs`, iconos
   - Línea 9-16: Agregados estados para filtros y selección
   - Línea 23-34: Agregado `filteredJobs` con useMemo
   - Línea 70-135: Agregadas funciones de selección y borrado
   - Línea 145-190: Agregado panel de filtros
   - Línea 210+: Agregada columna de checkboxes en tabla

3. **src/components/batches/BatchDetailModal.tsx**
   - Línea 5: Agregado import `useBatch`
   - Línea 16: Renombrado prop `batch` a `initialBatch`
   - Línea 34-40: Agregado hook `useBatch` para datos frescos
   - Línea 42: Usa `freshBatch || initialBatch`

4. **BACKEND_REQUIREMENTS.md**
   - Documento completo para el equipo de backend
   - Explica el error actual y la solución requerida
   - Incluye código de ejemplo para implementar `cancel_job`

5. **API_FRONTEND_REFERENCE.md**
   - Ya existía, documenta el endpoint DELETE /api/v1/jobs/{id}

6. **CHANGELOG.md** (este archivo)
   - Nuevo documento para tracking de cambios

### 🚀 Próximos Pasos

1. **Backend:** Implementar `cancel_job` en `JobService` según `BACKEND_REQUIREMENTS.md`
2. **Backend:** Asegurar que los contadores del batch se actualicen al eliminar jobs
3. **Frontend:** Implementar modal de edición de configuración (pendiente)
4. **Frontend:** Agregar más filtros (fecha, duración, etc.) - opcional
5. **Deploy:** Configurar en Vercel cuando el backend esté listo

### 🐛 Bugs Conocidos

- ❌ Eliminar jobs falla con error 500 del backend (pendiente implementación)
- ✅ Hooks de React ordenados correctamente
- ✅ Actualizaciones automáticas de contadores funcionando

### 📚 Documentación Relacionada

- `BACKEND_REQUIREMENTS.md` - Requisitos para el backend
- `API_FRONTEND_REFERENCE.md` - Referencia completa de la API
- `DEPLOYMENT.md` - Guía de despliegue en Vercel
- `IMPLEMENTATION.md` - Detalles de implementación del proyecto

---

**Fecha:** 25 de Octubre, 2025  
**Autor:** Frontend Team  
**Estado:** ✅ Frontend completo, ⚠️ Esperando implementación en backend
