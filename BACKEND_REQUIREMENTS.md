# Requisitos de Backend - Frontend SpeechAI

## 📋 Resumen
Este documento detalla los endpoints y funcionalidades que el backend debe implementar para soportar las nuevas características del frontend.

---

## 🚨 Error Actual

### Problema Principal: Método `cancel_job` no existe en JobService
```
AttributeError: 'JobService' object has no attribute 'cancel_job'
```

**Endpoint afectado:**
- `DELETE /api/v1/jobs/{job_id}`
- Línea 836 en `app/api.py`: `success = await service.cancel_job(job_id)`

**Causa:**
El endpoint `DELETE /api/v1/jobs/{job_id}` **YA ESTÁ IMPLEMENTADO** en la API (ver `API_FRONTEND_REFERENCE.md` línea 382-396), pero falta implementar el método `cancel_job` en la clase `JobService` que el endpoint intenta llamar.

**Según la documentación API:**
```http
DELETE /api/v1/jobs/{job_id}

Response esperada:
{
  "success": true,
  "message": "Job cancelled"
}
```

**Nota:** La documentación dice que "Este endpoint ELIMINA el job". Necesitamos que el método `cancel_job` en el servicio haga precisamente eso.

---

## 🔧 Implementaciones Requeridas

### 1. Método `cancel_job` en JobService ⚠️ URGENTE

**Ubicación:** `app/services/job_service.py` (o donde esté definido `JobService`)

**Implementación requerida:**

```python
class JobService:
    # ... métodos existentes ...
    
    async def cancel_job(self, job_id: str) -> bool:
        """
        Cancela/elimina un job por su ID.
        
        Según API_FRONTEND_REFERENCE.md: "Este endpoint ELIMINA el job"
        
        Args:
            job_id: ID del job a cancelar (puede ser ObjectId o job_id personalizado)
            
        Returns:
            bool: True si se eliminó exitosamente, False si no existe
            
        Raises:
            Exception: Si hay un error en la base de datos
        """
        try:
            # Buscar el job (soportar ambos formatos de ID)
            job = await self.db.jobs.find_one({
                "$or": [
                    {"_id": ObjectId(job_id) if ObjectId.is_valid(job_id) else None},
                    {"job_id": job_id}
                ]
            })
            
            if not job:
                return False
            
            # OPCIÓN 1: Eliminar físicamente (según documentación)
            result = await self.db.jobs.delete_one({"_id": job["_id"]})
            
            # Actualizar contadores del batch padre
            if result.deleted_count > 0 and job.get("batch_id"):
                await self._update_batch_counters(job["batch_id"])
            
            return result.deleted_count > 0
            
            # OPCIÓN 2 (ALTERNATIVA): Marcar como cancelado sin eliminar
            # Usar solo si el negocio requiere mantener historial
            # result = await self.db.jobs.update_one(
            #     {"_id": job["_id"]},
            #     {"$set": {
            #         "status": "cancelled",
            #         "updated_at": datetime.utcnow()
            #     }}
            # )
            # return result.modified_count > 0
            
        except Exception as e:
            logger.error(f"Error al cancelar job {job_id}: {str(e)}")
            raise
    
    async def _update_batch_counters(self, batch_id: str):
        """Actualiza los contadores del batch después de eliminar un job"""
        # Recalcular contadores basados en los jobs restantes
        pipeline = [
            {"$match": {"batch_id": batch_id}},
            {"$group": {
                "_id": "$status",
                "count": {"$sum": 1}
            }}
        ]
        status_counts = await self.db.jobs.aggregate(pipeline).to_list(None)
        
        # Actualizar batch con nuevos contadores
        # ... (implementar según tu lógica de negocio)
```

**Notas importantes:**
- ✅ La documentación dice que el endpoint "ELIMINA el job", así que la Opción 1 es la correcta
- ✅ Soportar ambos formatos de ID (ObjectId y job_id personalizado) para flexibilidad
- ⚠️ Importante: Actualizar contadores del batch padre (total_jobs, pending_jobs, etc.)
- ⚠️ Si un job está `in_progress`, decidir si detener la llamada activa primero
- ⚠️ Considerar transacciones si necesitas atomicidad

---

### 2. Endpoint DELETE /api/v1/jobs/{job_id} ✅ YA IMPLEMENTADO

**Ubicación:** `app/api.py` línea ~836

**Estado actual:** ✅ El endpoint YA EXISTE en la API (documentado en `API_FRONTEND_REFERENCE.md`)

**Problema:** El endpoint está implementado pero la línea 836 intenta llamar a `service.cancel_job(job_id)` que no existe en `JobService`.

**Código actual (aproximado):**
```python
@router.delete("/jobs/{job_id}", status_code=200)
async def cancel_job(
    job_id: str,
    service: JobService = Depends(get_job_service)
):
    """Cancela/Elimina un job individual."""
    success = await service.cancel_job(job_id)  # ← ESTA LÍNEA FALLA
    
    if not success:
        raise HTTPException(status_code=404, detail=f"Job {job_id} no encontrado")
    
    return {
        "success": True,
        "message": "Job cancelled"  # Según documentación API
    }
```

**Solución:** Solo necesitas implementar el método `cancel_job` en `JobService` (ver sección anterior).

**Request ejemplo:**
```http
DELETE /api/v1/jobs/68fd0cdc42cc4632daeb164f
```

**Response esperada (según API_FRONTEND_REFERENCE.md):**
```json
{
  "success": true,
  "message": "Job cancelled"
}
```

---

## 📊 Funcionalidades del Frontend que Dependen de Estos Cambios

### 1. Página de Llamadas (JobsPage)
**Ruta:** `/llamadas`

**Características:**
- ✅ **Filtros por estado:** Todas, Pendientes, En Progreso, Completadas, Terminadas, Fallidas
- ✅ **Búsqueda por texto:** Busca en nombre, teléfono, ID de lote
- ✅ **Selección múltiple:** Checkboxes en cada fila + "Seleccionar todos"
- ⚠️ **Borrado masivo:** Botón "Eliminar (X)" - **BLOQUEADO por falta de cancel_job**

**Flujo de borrado masivo:**
```typescript
// Frontend: src/pages/Jobs/JobsPage.tsx
const handleBulkDelete = async () => {
  // 1. Usuario selecciona N jobs con checkboxes
  // 2. Usuario hace clic en "Eliminar (X)"
  // 3. Se muestra confirmación
  // 4. Si confirma, se envían DELETE requests en paralelo:
  
  const deletePromises = Array.from(selectedJobIds).map(jobId =>
    axios.delete(`/api/v1/jobs/${jobId}`)  // ← FALLA AQUÍ
  );
  
  const results = await Promise.allSettled(deletePromises);
  
  // 5. Se muestran resultados: X eliminados, Y fallaron
  // 6. Se limpian selecciones y se recargan datos
};
```

### 2. Modal de Detalle de Batch (BatchDetailModal)
**Ubicación:** `src/components/batches/BatchDetailModal.tsx`

**Características similares:**
- Pestaña "Llamadas" dentro del modal de detalle de campaña
- Filtros + búsqueda + selección múltiple
- Borrado masivo de jobs del batch
- **Mismo endpoint:** `DELETE /api/v1/jobs/{job_id}`

---

## 🔄 Endpoints Adicionales Utilizados por el Frontend

### ✅ GET /api/v1/jobs
**Estado:** Funcionando correctamente

**Parámetros query:**
- `status`: filtrar por estado (opcional)
- `batch_id`: filtrar por batch (opcional)
- `limit`, `skip`: paginación (opcional)

**Uso en frontend:**
```typescript
// Obtener todos los jobs
GET /api/v1/jobs

// Filtrar por estado
GET /api/v1/jobs?status=completed

// Filtrar por batch
GET /api/v1/jobs?batch_id=batch-2025-10-25-144604-615037
```

### ✅ PATCH /api/v1/batches/{batch_id}
**Estado:** Funcionando correctamente

**Body ejemplo:**
```json
{
  "is_active": false  // pausar
}
```

**Uso:** Pausar/reanudar campañas

---

## 📝 Modelo de Datos Esperado

### Job Model
```python
class Job:
    _id: ObjectId
    batch_id: str
    contact: {
        name: str,
        phones: List[str]
    }
    status: Literal["pending", "in_progress", "completed", "done", "failed", "cancelled"]
    attempts: int
    max_attempts: int
    created_at: datetime
    updated_at: datetime
    # ... otros campos ...
```

**Nota importante:** Si implementan soft-delete (marcar como `cancelled`), asegurarse de:
1. Agregar `"cancelled"` a los estados válidos en el enum
2. Excluir jobs cancelados de las queries normales (a menos que se pida explícitamente)
3. Documentar este comportamiento

---

## 🎯 Plan de Implementación Sugerido

### Paso 1: Implementar `cancel_job` en JobService ⚠️ ALTA PRIORIDAD
- [ ] Implementar el método `cancel_job` en `JobService` (código completo arriba)
- [ ] Usar eliminación física (según dice la documentación API)
- [ ] Agregar logs apropiados
- [ ] Implementar `_update_batch_counters` para mantener consistencia
- [ ] Agregar validaciones (job existe, etc.)
- [ ] Soportar ambos formatos de ID (ObjectId y job_id personalizado)

### Paso 2: Verificar endpoint DELETE existente
- [ ] Confirmar que el endpoint en `app/api.py` línea 836 funciona correctamente
- [ ] El endpoint ya está implementado, solo necesita que `service.cancel_job()` exista
- [ ] Verificar que retorna el formato correcto: `{"success": true, "message": "Job cancelled"}`
- [ ] Documentar en OpenAPI/Swagger (probablemente ya está)

### Paso 3: Testing
- [ ] Prueba unitaria de `cancel_job`
- [ ] Prueba de endpoint DELETE individual: `DELETE /api/v1/jobs/{job_id}`
- [ ] Prueba de múltiples DELETEs concurrentes (bulk delete desde frontend)
- [ ] Verificar que los contadores del batch se actualizan correctamente
- [ ] Verificar que no queden llamadas huérfanas

### Paso 4: Consideraciones de Negocio
- [x] ¿Se puede eliminar un job que está `in_progress`? → **Según documentación: SÍ (elimina físicamente)**
- [ ] ¿Qué pasa con las métricas/reportes si se eliminan jobs? → **Decidir si afecta estadísticas**
- [ ] ¿Se debe notificar a algún servicio externo? → **Verificar si hay webhooks/notificaciones**
- [x] ¿Hay que actualizar contadores del batch padre? → **SÍ, implementar `_update_batch_counters`**
- [ ] Si un job está en llamada activa, ¿hay que colgar primero? → **Decidir comportamiento**

---

## 🧪 Testing desde el Frontend

Una vez implementado, puedes probar así:

### 1. Prueba Individual
```bash
# Usando curl
curl -X DELETE http://localhost:8000/api/v1/jobs/68fd0cdc42cc4632daeb164f
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Job cancelado exitosamente"
}
```

### 2. Prueba desde el Frontend
1. Ir a http://localhost:3002/llamadas
2. Hacer clic en un checkbox de cualquier job
3. Hacer clic en el botón "Eliminar (1)"
4. Confirmar en el diálogo
5. Verificar mensaje de éxito

### 3. Prueba Bulk Delete
1. Hacer clic en "Filtros"
2. Seleccionar varios jobs con checkboxes
3. Hacer clic en "Eliminar (X)" donde X es el número seleccionado
4. Confirmar
5. Debe mostrar: "Se eliminaron X tarea(s) exitosamente"

---

## 📞 Contacto

Si tienen dudas sobre:
- Comportamiento esperado del frontend
- Formato de respuestas
- Casos edge que no están cubiertos
- Testing adicional

Por favor contactar al equipo de frontend.

---

## 📎 Archivos Relevantes del Frontend

- `src/pages/Jobs/JobsPage.tsx` - Página principal de llamadas
- `src/components/batches/BatchDetailModal.tsx` - Modal de detalle de batch
- `src/services/queries.ts` - Definición de `useBulkDeleteJobs` hook
- `src/services/api.ts` - Cliente Axios configurado

---

## 🔗 Referencias

**Frontend repository:** mariandamblena/speechAi_front  
**Backend repository:** [Tu repo de backend]  
**API Base URL (dev):** http://localhost:8000/api/v1  
**API Documentation:** Ver archivo `API_FRONTEND_REFERENCE.md` en el repositorio del frontend
- Líneas 382-396: Documentación del endpoint DELETE /api/v1/jobs/{job_id}
- Líneas 346-357: Estados de Job (incluye "cancelled")

**Swagger/OpenAPI:** http://localhost:8000/docs

---

**Fecha:** 25 de Octubre, 2025  
**Versión:** 1.1 (actualizada con referencia a API_FRONTEND_REFERENCE.md)  
**Estado:** ⚠️ Implementación pendiente: método `cancel_job` en JobService
