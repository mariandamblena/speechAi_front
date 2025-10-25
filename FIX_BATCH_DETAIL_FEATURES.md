# Fix: Funcionalidades del Detalle de Batch

## Problemas Solucionados

### 1. ✅ **Ver Detalle de Llamadas**
**Problema:** El botón "Ver Detalle" no hacía nada.

**Solución:**
- Agregado estado `selectedJob` y `isJobDetailOpen`
- Creada función `handleViewJobDetail(job)` que:
  - Guarda el job seleccionado
  - Abre el modal `JobDetailModal`
- Agregado el componente `JobDetailModal` al final del modal principal
- Conectado el botón onClick a la función

```typescript
const handleViewJobDetail = (job: JobModel) => {
  setSelectedJob(job);
  setIsJobDetailOpen(true);
};

// En la tabla
<Button 
  size="sm" 
  variant="secondary"
  onClick={() => handleViewJobDetail(job)}
>
  Ver Detalle
</Button>
```

### 2. ✅ **Exportar CSV**
**Problema:** El botón "Exportar CSV" no hacía nada.

**Solución:**
- Creada función `handleExportCSV()` que:
  - Valida que existan llamadas
  - Genera CSV con headers: Contacto, Teléfono, Estado, Intentos, Duración, Fecha, Costo
  - Mapea todos los jobs a filas CSV
  - Crea un Blob y lo descarga automáticamente
  - Nombre del archivo: `llamadas_{nombre_batch}_{fecha}.csv`

```typescript
const handleExportCSV = () => {
  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    alert('No hay llamadas para exportar');
    return;
  }

  const headers = ['Contacto', 'Teléfono', 'Estado', 'Intentos', 'Duración (s)', 'Fecha', 'Costo'];
  const rows = jobs.map((job: any) => [
    job.contact?.name || 'N/A',
    job.contact?.phones?.[0] || 'N/A',
    job.status,
    `${job.attempts || 0}/${job.max_attempts || 3}`,
    job.call_duration_seconds || 0,
    new Date(job.created_at).toLocaleDateString(),
    job.estimated_cost || 0
  ]);

  // Genera y descarga el CSV
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  // ... código de descarga
};
```

### 3. ✅ **Editar Configuración**
**Problema:** El botón "Editar Configuración" no hacía nada.

**Solución Temporal:**
- Agregado estado `isEditingConfig`
- Creada función `handleEditConfig()` que muestra un alert informativo
- Por ahora sugiere duplicar la campaña para crear una nueva con configuración modificada
- **TODO:** Implementar modal de edición completo o navegar a página de edición

```typescript
const handleEditConfig = () => {
  setIsEditingConfig(true);
  alert('Funcionalidad de edición en desarrollo. Por ahora, puedes duplicar la campaña y crear una nueva con la configuración modificada.');
};
```

**Nota:** La edición completa requeriría:
- Un modal con formularios editables
- Hook `useUpdateBatch()` (ya disponible en queries.ts)
- Validación de campos
- Confirmación de cambios

### 4. ✅ **Fix Adicional: Botón Pausar**
**Problema:** Botón usaba variant="warning" que no existe.

**Solución:** Cambiado a `variant="danger"` (color rojo/naranja apropiado para pausar).

## Archivos Modificados

### `src/components/batches/BatchDetailModal.tsx`

**Cambios:**
1. ✅ Importado `JobModel` de types
2. ✅ Importado `JobDetailModal` component
3. ✅ Agregados estados:
   - `selectedJob: JobModel | null`
   - `isJobDetailOpen: boolean`
   - `isEditingConfig: boolean`
4. ✅ Agregadas funciones:
   - `handleViewJobDetail(job)`
   - `handleExportCSV()`
   - `handleEditConfig()`
5. ✅ Conectados botones a funciones
6. ✅ Agregado `<JobDetailModal>` al final del componente

## Cómo Usar

### Ver Detalle de una Llamada
1. Abre el detalle de un batch
2. Ve a la pestaña "Llamadas"
3. Click en "Ver Detalle" de cualquier llamada
4. Se abre un modal con toda la información del job

### Exportar CSV de Llamadas
1. Abre el detalle de un batch
2. Ve a la pestaña "Llamadas"
3. Click en "Exportar CSV"
4. El archivo CSV se descarga automáticamente con formato:
   ```
   Contacto,Teléfono,Estado,Intentos,Duración (s),Fecha,Costo
   "Juan Pérez","+56912345678","completed","3/3","45","25/10/2025","150"
   ```

### Editar Configuración (Temporal)
1. Abre el detalle de un batch
2. Ve a la pestaña "Configuración"
3. Click en "Editar Configuración"
4. Por ahora muestra un mensaje informativo
5. **Próximamente:** Modal de edición completo

## Estructura del CSV Exportado

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| Contacto | Nombre del contacto | "María González" |
| Teléfono | Número de teléfono | "+56912345678" |
| Estado | Estado del job | "completed" |
| Intentos | Intentos realizados/máximos | "2/3" |
| Duración (s) | Duración en segundos | "45" |
| Fecha | Fecha de creación | "25/10/2025" |
| Costo | Costo estimado | "150" |

## Próximas Mejoras Sugeridas

### Para "Editar Configuración":
- [ ] Crear `BatchConfigEditModal.tsx` component
- [ ] Formularios para:
  - Duración máxima de llamada
  - Tiempo de timbrado
  - Intentos máximos
  - Delay entre reintentos
  - Horario permitido
  - Días de la semana
  - Zona horaria
- [ ] Usar `useUpdateBatch()` hook para guardar cambios
- [ ] Validación de campos
- [ ] Confirmación antes de guardar

### Para "Exportar CSV":
- [ ] Agregar opciones de filtrado antes de exportar
- [ ] Opción de exportar a Excel (.xlsx)
- [ ] Incluir más campos (call_id, recording_url, etc.)
- [ ] Progreso de exportación para batches grandes

### Para "Ver Detalle":
- [ ] Botón para reproducir grabación (si existe)
- [ ] Ver transcripción de la llamada
- [ ] Ver análisis de sentimiento
- [ ] Botón de reintento manual

## Testing

Para probar las funcionalidades:

1. **Ver Detalle:**
   - Crear un batch con llamadas
   - Abrir detalle del batch → Llamadas
   - Click "Ver Detalle" en cualquier fila
   - ✅ Debe abrir modal con información completa

2. **Exportar CSV:**
   - Batch con al menos 1 llamada
   - Click "Exportar CSV"
   - ✅ Debe descargar archivo `llamadas_nombre_fecha.csv`
   - ✅ Abrir en Excel/Google Sheets y verificar formato

3. **Editar Config:**
   - Abrir detalle → Configuración
   - Click "Editar Configuración"
   - ✅ Debe mostrar alert informativo

---

**Fecha:** 25 de Octubre, 2025  
**Estado:** ✅ Implementado y Compilado  
**Build:** Exitoso (456.48 KB)
