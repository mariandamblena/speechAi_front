import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BatchModel, JobModel } from '@/types';
import { useBatch, useBatchJobs, usePauseBatch, useResumeBatch, useCancelBatch, useBulkDeleteJobs, useCreateBatch, useUpdateBatch } from '@/services/queries';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { Trash2, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface BatchDetailModalProps {
  batch: BatchModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  batch: initialBatch,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'settings'>('overview');
  const [selectedJob, setSelectedJob] = useState<JobModel | null>(null);
  const [isJobDetailOpen, setIsJobDetailOpen] = useState(false);
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Estados para edición de configuración
  const [editedCallSettings, setEditedCallSettings] = useState({
    max_call_duration: 0,
    ring_timeout: 0,
    max_attempts: 0,
    retry_delay_hours: 0,
    allowed_hours: {
      start: '09:00',
      end: '20:00'
    },
    days_of_week: [1, 2, 3, 4, 5] as number[],
    timezone: 'America/Santiago'
  });
  
  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Selección múltiple
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // TODOS los hooks deben estar antes de cualquier return condicional
  // Obtener datos frescos del batch cuando está abierto
  const { data: freshBatch } = useBatch(
    initialBatch?.batch_id || '', 
    { enabled: !!initialBatch && isOpen }
  );
  
  // Usar el batch fresco si está disponible, sino el inicial
  const batch = freshBatch || initialBatch;
  
  const { data: jobs, isLoading: jobsLoading } = useBatchJobs(
    batch?.batch_id || '', 
    { enabled: !!batch && activeTab === 'jobs' }
  );
  
  const bulkDeleteMutation = useBulkDeleteJobs();
  const pauseBatchMutation = usePauseBatch();
  const resumeBatchMutation = useResumeBatch();
  const cancelBatchMutation = useCancelBatch();
  const createBatchMutation = useCreateBatch();
  const updateBatchMutation = useUpdateBatch();

  // Filtrar jobs - useMemo también debe estar antes del return
  const filteredJobs = React.useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    
    let filtered = jobs;
    
    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job: any) => job.status === statusFilter);
    }
    
    // Filtro por búsqueda (nombre, RUT o teléfono)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job: any) => {
        const name = (job.nombre || job.contact?.name || '').toLowerCase();
        const phone = (job.to_number || job.contact?.phones?.[0] || '').toLowerCase();
        const rut = (job.rut || job.rut_fmt || job.contact?.dni || '').toLowerCase();
        return name.includes(query) || phone.includes(query) || rut.includes(query);
      });
    }
    
    return filtered;
  }, [jobs, statusFilter, searchQuery]);

  // Paginación
  const paginatedJobs = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredJobs.slice(startIndex, endIndex);
  }, [filteredJobs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);

  // Reset a página 1 cuando cambian los filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Calcular estadísticas reales desde los jobs
  const realStats = React.useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) {
      return {
        pending: 0,
        completed: 0,
        failed: 0,
        totalDuration: 0,
        avgDuration: 0
      };
    }

    const pending = jobs.filter((j: any) => j.status === 'pending').length;
    const completed = jobs.filter((j: any) => j.status === 'completed' || j.status === 'done').length;
    const failed = jobs.filter((j: any) => j.status === 'failed').length;
    
    // Calcular duración total en segundos
    let totalDurationSeconds = 0;
    jobs.forEach((j: any) => {
      const duration = j.call_duration_seconds || 
                      (j.call_result?.summary?.duration_ms ? Math.round(j.call_result.summary.duration_ms / 1000) : 0);
      totalDurationSeconds += duration;
    });
    
    const avgDuration = completed > 0 ? Math.round(totalDurationSeconds / completed) : 0;
    const totalMinutes = totalDurationSeconds / 60;

    return {
      pending,
      completed,
      failed,
      totalDuration: totalMinutes,
      avgDuration
    };
  }, [jobs]);

  // AHORA sí podemos hacer el return condicional
  if (!batch) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'RUNNING':
        return 'bg-blue-100 text-blue-800';
      case 'PAUSED':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'ERROR':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pendiente';
      case 'RUNNING':
        return 'En Ejecución';
      case 'PAUSED':
        return 'Pausado';
      case 'COMPLETED':
        return 'Completado';
      case 'CANCELLED':
        return 'Cancelado';
      case 'ERROR':
        return 'Error';
      default:
        return status;
    }
  };

  const calculateProgress = () => {
    const total = batch.total_jobs || 0;
    const completed = (batch.completed_jobs || 0) + (batch.failed_jobs || 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const calculateSuccessRate = () => {
    const total = (batch.completed_jobs || 0) + (batch.failed_jobs || 0);
    return total > 0 ? Math.round(((batch.completed_jobs || 0) / total) * 100) : 0;
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };

  const handlePause = async () => {
    if (!confirm(`¿Estás seguro de que quieres pausar la campaña "${batch.name}"?\n\nLas llamadas en progreso se completarán, pero no se iniciarán nuevas llamadas hasta que la reactives.`)) {
      return;
    }
    
    try {
      await pauseBatchMutation.mutateAsync(batch._id);
    } catch (error) {
      console.error('Error pausing batch:', error);
      alert('Error al pausar la campaña. Por favor, intenta de nuevo.');
    }
  };

  const handleResume = async () => {
    if (!confirm(`¿Estás seguro de que quieres reanudar la campaña "${batch.name}"?\n\nLas llamadas pendientes comenzarán a procesarse inmediatamente.`)) {
      return;
    }
    
    try {
      await resumeBatchMutation.mutateAsync(batch._id);
    } catch (error) {
      console.error('Error resuming batch:', error);
      alert('Error al reanudar la campaña. Por favor, intenta de nuevo.');
    }
  };

  const handleCancel = async () => {
    if (!confirm(`⚠️ ¿Estás seguro de que quieres CANCELAR permanentemente la campaña "${batch.name}"?\n\nEsta acción NO se puede deshacer. Todas las llamadas pendientes serán canceladas.`)) {
      return;
    }
    
    try {
      await cancelBatchMutation.mutateAsync(batch._id);
      onClose(); // Cerrar el modal después de cancelar
    } catch (error) {
      console.error('Error canceling batch:', error);
      alert('Error al cancelar la campaña. Por favor, intenta de nuevo.');
    }
  };

  const handleViewJobDetail = (job: JobModel) => {
    setSelectedJob(job);
    setIsJobDetailOpen(true);
  };

  const handleExportCSV = () => {
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      alert('No hay llamadas para exportar');
      return;
    }

    // Crear CSV con detalle completo
    const headers = [
      'Contacto', 'RUT', 'Teléfono', 'Estado', 'Intentos', 'Duración (s)', 'Fecha',
      'Empresa', 'Monto Deuda', 'Fecha Límite', 'Cupones',
      'Fecha Pago Prometido', 'Monto Pago Prometido', 'Tipo Pago',
      'Éxito', 'Estado Llamada', 'Costo', 'Resumen',
      'Link Grabación', 'Link Transcripción'
    ];
    
    const rows = jobs.map((job: any) => {
      // Extraer compromiso de pago
      const dynamicVars = job.call_result?.summary?.collected_dynamic_variables;
      const fechaPago = job.fecha_pago_cliente || dynamicVars?.fecha_pago_cliente || '';
      const montoPago = job.monto_pago_cliente || 
        (typeof dynamicVars?.monto_pago_cliente === 'string' 
          ? parseFloat(dynamicVars.monto_pago_cliente) 
          : dynamicVars?.monto_pago_cliente) || '';
      
      // Determinar tipo de pago
      let tipoPago = '';
      if (fechaPago && montoPago) {
        const montoTotal = job.monto_total || job.payload?.debt_amount || 0;
        tipoPago = montoPago >= montoTotal ? 'Pago total' : 'Pago parcial';
      }
      
      // Formatear fecha de pago
      let fechaPagoFormateada = '';
      if (fechaPago) {
        try {
          fechaPagoFormateada = new Date(fechaPago).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        } catch {
          fechaPagoFormateada = fechaPago;
        }
      }
      
      return [
        job.nombre || job.contact?.name || 'N/A',
        job.rut || job.rut_fmt || 'N/A',
        job.to_number || job.contact?.phones?.[0] || 'N/A',
        job.status,
        `${job.attempts || 0}/${job.max_attempts || 3}`,
        job.call_duration_seconds || job.call_result?.summary?.duration_ms ? Math.round(job.call_result.summary.duration_ms / 1000) : 0,
        new Date(job.created_at).toLocaleDateString('es-CL'),
        job.origen_empresa || job.payload?.company_name || 'N/A',
        job.monto_total || job.deuda || job.payload?.debt_amount || 0,
        job.fecha_limite || job.payload?.due_date || 'N/A',
        job.cantidad_cupones || job.payload?.additional_info?.cantidad_cupones || 'N/A',
        fechaPagoFormateada,
        montoPago ? `$${montoPago.toLocaleString('es-CL')}` : '',
        tipoPago,
        job.call_result?.success ? 'Sí' : 'No',
        job.call_result?.summary?.call_status || 'N/A',
        job.call_result?.summary?.call_cost?.combined_cost || job.estimated_cost || 0,
        (job.call_result?.summary?.call_analysis?.call_summary || '').replace(/\n/g, ' ').replace(/"/g, '""'),
        job.call_result?.summary?.recording_url || '',
        job.call_result?.summary?.public_log_url || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Descargar archivo con BOM para Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `llamadas_${batch.name}_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditConfig = () => {
    if (!batch || !batch.call_settings) return;
    
    // Inicializar formulario con valores actuales del batch
    setEditedCallSettings({
      max_call_duration: batch.call_settings.max_call_duration || 300,
      ring_timeout: batch.call_settings.ring_timeout || 30,
      max_attempts: batch.call_settings.max_attempts || 3,
      retry_delay_hours: batch.call_settings.retry_delay_hours || 24,
      allowed_hours: batch.call_settings.allowed_hours || { start: '09:00', end: '20:00' },
      days_of_week: batch.call_settings.days_of_week || [1, 2, 3, 4, 5],
      timezone: batch.call_settings.timezone || 'America/Santiago'
    });
    
    setIsEditModalOpen(true);
  };

  const handleSaveConfig = async () => {
    if (!batch) return;
    
    try {
      await updateBatchMutation.mutateAsync({
        batchId: batch.batch_id,
        updates: {
          call_settings: editedCallSettings
        }
      });
      
      setIsEditModalOpen(false);
      alert('✅ Configuración actualizada correctamente');
    } catch (error: any) {
      console.error('Error updating call_settings:', error);
      alert(`❌ Error al actualizar: ${error.message || 'Error desconocido'}`);
    }
  };

  const handleDuplicateBatch = async () => {
    if (!batch) return;
    
    if (!confirm(`¿Deseas duplicar la campaña "${batch.name}"?\n\nSe creará una nueva campaña con la misma configuración, lista para agregar nuevos contactos.`)) {
      return;
    }
    
    try {
      const newBatch = await createBatchMutation.mutateAsync({
        account_id: batch.account_id,
        name: `${batch.name} (Copia)`,
        description: batch.description || 'Copia de campaña',
        priority: batch.priority === 'low' ? 1 : batch.priority === 'normal' ? 2 : batch.priority === 'high' ? 3 : 4,
        call_settings: batch.call_settings,
        allow_duplicates: false,
      });
      
      alert(`✅ Campaña duplicada exitosamente!\n\nNombre: ${batch.name} (Copia)\n\nAhora puedes agregar nuevos contactos a esta campaña.`);
      onClose(); // Cerrar modal actual
    } catch (error) {
      console.error('Error al duplicar campaña:', error);
      alert('❌ Error al duplicar la campaña. Por favor intenta nuevamente.');
    }
  };

  // Manejar selección de todos
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedJobIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredJobs.map((job: any) => job._id));
      setSelectedJobIds(allIds);
      setSelectAll(true);
    }
  };

  // Manejar selección individual
  const handleSelectJob = (jobId: string) => {
    const newSelected = new Set(selectedJobIds);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobIds(newSelected);
    setSelectAll(newSelected.size === filteredJobs.length && filteredJobs.length > 0);
  };

  // Eliminar jobs seleccionados
  const handleBulkDelete = async () => {
    if (selectedJobIds.size === 0) {
      alert('No hay jobs seleccionados');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que quieres eliminar ${selectedJobIds.size} llamada(s)?`
    );

    if (!confirmed) return;

    try {
      const result = await bulkDeleteMutation.mutateAsync(Array.from(selectedJobIds));
      alert(`Eliminadas: ${result.successful}/${result.total}\nFallidas: ${result.failed}`);
      setSelectedJobIds(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error deleting jobs:', error);
      alert('Error al eliminar las llamadas');
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setShowFilters(false);
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'jobs', label: 'Llamadas', icon: '📞' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Campaña: ${batch.name}`} size="xl">
      <div className="space-y-6">
        {/* Header con estado y progreso */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{batch.name}</h3>
              <p className="text-sm text-gray-500">{batch.description || 'Sin descripción'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}>
                {getStatusText(batch.status)}
              </span>
              {batch.status === 'RUNNING' && (
                <Button size="sm" variant="danger" onClick={handlePause}>
                  Pausar
                </Button>
              )}
              {batch.status === 'PAUSED' && (
                <Button size="sm" variant="primary" onClick={handleResume}>
                  Reanudar
                </Button>
              )}
              {(batch.status === 'PENDING' || batch.status === 'PAUSED') && (
                <Button size="sm" variant="danger" onClick={handleCancel}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progreso</span>
              <span>{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {batch.total_jobs || 0}
              </div>
              <div className="text-sm text-gray-500">Total Contactos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {batch.completed_jobs || 0}
              </div>
              <div className="text-sm text-gray-500">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {batch.failed_jobs || 0}
              </div>
              <div className="text-sm text-gray-500">Fallidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {calculateSuccessRate()}%
              </div>
              <div className="text-sm text-gray-500">Éxito</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Información General</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Cuenta</dt>
                      <dd className="text-sm text-gray-900">{batch.account_id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Creado</dt>
                      <dd className="text-sm text-gray-900">{new Date(batch.created_at).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Última Actualización</dt>
                      <dd className="text-sm text-gray-900">{new Date(batch.updated_at).toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Prioridad</dt>
                      <dd className="text-sm text-gray-900 capitalize">{batch.priority}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Estadísticas Detalladas</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Llamadas Pendientes</dt>
                      <dd className="text-sm text-gray-900">
                        {realStats.pending}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Duración Promedio</dt>
                      <dd className="text-sm text-gray-900">
                        {realStats.avgDuration}s
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Costo Total Estimado</dt>
                      <dd className="text-sm text-gray-900">${(batch.total_cost || batch.estimated_cost || 0).toFixed(2)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tiempo Total</dt>
                      <dd className="text-sm text-gray-900">{realStats.totalDuration.toFixed(1)} min</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Script Preview */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Script de la Llamada</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {batch.script_content ? (
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {batch.script_content}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No hay script disponible para esta campaña
                    </p>
                  )}
                </div>
              </div>

              {/* Logs de Ejecución */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Logs de Ejecución</h4>
                <div className="space-y-3">
                  {/* Log: Campaña iniciada */}
                  <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Campaña iniciada</p>
                        <span className="text-xs text-gray-500">
                          {new Date(batch.created_at).toLocaleString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        Se han cargado {batch.total_jobs || 0} contactos para procesar
                      </p>
                    </div>
                  </div>

                  {/* Log: Llamadas completadas */}
                  {realStats.completed > 0 && (
                    <div className="flex items-start p-3 bg-green-50 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">Llamadas completadas</p>
                          <span className="text-xs text-gray-500">
                            {new Date(batch.updated_at).toLocaleString('es-CL', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {realStats.completed} llamadas completadas exitosamente
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Log: Llamadas fallidas */}
                  {realStats.failed > 0 && (
                    <div className="flex items-start p-3 bg-red-50 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">Llamadas fallidas</p>
                          <span className="text-xs text-gray-500">
                            {new Date(batch.updated_at).toLocaleString('es-CL', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {realStats.failed} llamadas fallaron por diversos motivos
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Log: Estado actual */}
                  {batch.status === 'PAUSED' && (
                    <div className="flex items-start p-3 bg-yellow-50 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 bg-yellow-600 rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">Campaña pausada</p>
                          <span className="text-xs text-gray-500">
                            {new Date(batch.updated_at).toLocaleString('es-CL', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          La campaña fue pausada. {realStats.pending} llamadas pendientes.
                        </p>
                      </div>
                    </div>
                  )}

                  {batch.status === 'COMPLETED' && (
                    <div className="flex items-start p-3 bg-green-50 rounded-lg">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">Campaña completada</p>
                          <span className="text-xs text-gray-500">
                            {new Date(batch.updated_at).toLocaleString('es-CL', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Todas las llamadas han sido procesadas
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'jobs' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Lista de Llamadas</h4>
                <div className="flex space-x-2">
                  {selectedJobIds.size > 0 && (
                    <Button 
                      size="sm" 
                      variant="danger"
                      onClick={handleBulkDelete}
                      disabled={bulkDeleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Eliminar ({selectedJobIds.size})
                    </Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={handleExportCSV}>
                    Exportar CSV
                  </Button>
                  <Button 
                    size="sm" 
                    variant="primary"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="w-4 h-4 mr-1" />
                    Filtros
                  </Button>
                </div>
              </div>

              {/* Buscador siempre visible */}
              <div className="mb-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Buscar por nombre, RUT o teléfono..."
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Panel de Filtros */}
              {showFilters && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium text-gray-900">Filtros Avanzados</h5>
                    <button
                      onClick={handleClearFilters}
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Limpiar filtros
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Estado
                      </label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Todos</option>
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="completed">Completado</option>
                        <option value="done">Hecho</option>
                        <option value="failed">Fallido</option>
                        <option value="cancelled">Cancelado</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Mostrando {paginatedJobs.length} de {filteredJobs.length} llamadas {filteredJobs.length !== (Array.isArray(jobs) ? jobs.length : 0) && `(${Array.isArray(jobs) ? jobs.length : 0} total)`}
                  </div>
                </div>
              )}

              {jobsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !jobs || !Array.isArray(jobs) || jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay llamadas registradas para esta campaña
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No se encontraron llamadas con los filtros aplicados
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-2 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                        <th className="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Intentos</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Duración</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Compromiso</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paginatedJobs.map((job: any) => {
                        // Extraer compromiso de pago para cada job
                        const dynamicVars = job.call_result?.summary?.collected_dynamic_variables;
                        const fechaPago = job.fecha_pago_cliente || dynamicVars?.fecha_pago_cliente;
                        const montoPago = job.monto_pago_cliente || 
                          (typeof dynamicVars?.monto_pago_cliente === 'string' 
                            ? parseFloat(dynamicVars.monto_pago_cliente) 
                            : dynamicVars?.monto_pago_cliente);
                        
                        // Calcular duración correctamente
                        const duracionSegundos = job.call_duration_seconds || 
                          (job.call_result?.summary?.duration_ms ? Math.round(job.call_result.summary.duration_ms / 1000) : 0);
                        
                        return (
                        <tr key={job._id} className="hover:bg-gray-50">
                          <td className="px-2 py-2">
                            <input
                              type="checkbox"
                              checked={selectedJobIds.has(job._id)}
                              onChange={() => handleSelectJob(job._id)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-900">
                            {job.nombre || job.contact?.name || 'N/A'}
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-900">
                            {job.to_number || job.contact?.phones?.[0] || 'N/A'}
                          </td>
                          <td className="px-2 py-2">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              job.status === 'completed' || job.status === 'done' ? 'bg-green-100 text-green-800' :
                              job.status === 'failed' ? 'bg-red-100 text-red-800' :
                              job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-900 text-center">
                            {job.attempts || 0}/{job.max_attempts || 3}
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-900 text-center">
                            {duracionSegundos}s
                          </td>
                          <td className="px-2 py-2 text-xs">
                            {fechaPago && montoPago ? (
                              <div className="text-center">
                                <div className="text-gray-900 font-medium whitespace-nowrap">
                                  💰 ${(montoPago / 1000).toFixed(0)}k
                                </div>
                                <div className="text-gray-500">
                                  {new Date(fechaPago).toLocaleDateString('es-CL', { day: 'numeric', month: 'numeric' })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-2 py-2 text-xs text-gray-500 text-center">
                            {new Date(job.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
                          </td>
                          <td className="px-2 py-2">
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => handleViewJobDetail(job)}
                            >
                              Ver
                            </Button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {/* Controles de paginación */}
                  {totalPages > 1 && (
                    <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
                      <div className="flex-1 flex justify-between sm:hidden">
                        <Button
                          variant="secondary"
                          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                          disabled={currentPage === 1}
                          size="sm"
                        >
                          Anterior
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                          disabled={currentPage === totalPages}
                          size="sm"
                        >
                          Siguiente
                        </Button>
                      </div>
                      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a{' '}
                            <span className="font-medium">
                              {Math.min(currentPage * itemsPerPage, filteredJobs.length)}
                            </span>{' '}
                            de <span className="font-medium">{filteredJobs.length}</span> resultados
                          </p>
                        </div>
                        <div>
                          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              ←
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                              // Mostrar solo algunas páginas alrededor de la actual
                              if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                              ) {
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                      currentPage === page
                                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                );
                              } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>;
                              }
                              return null;
                            })}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              →
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Configuración de Llamadas</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Duración Máxima</label>
                      <div className="text-sm text-gray-900">{batch.call_settings?.max_call_duration || 0}s</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tiempo de Timbrado</label>
                      <div className="text-sm text-gray-900">{batch.call_settings?.ring_timeout || 0}s</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Intentos Máximos</label>
                      <div className="text-sm text-gray-900">{batch.call_settings?.max_attempts || 0}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Horas entre Intentos</label>
                      <div className="text-sm text-gray-900">{batch.call_settings?.retry_delay_hours || 0}h</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Horario Permitido</label>
                      <div className="text-sm text-gray-900">
                        {batch.call_settings?.allowed_hours?.start} - {batch.call_settings?.allowed_hours?.end}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Zona Horaria</label>
                      <div className="text-sm text-gray-900">{batch.call_settings?.timezone}</div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Días Permitidos</label>
                    <div className="text-sm text-gray-900">
                      {batch.call_settings?.days_of_week?.map(day => getDayName(day)).join(', ')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="secondary" onClick={handleEditConfig}>
                  Editar Configuración
                </Button>
                <Button variant="primary" onClick={handleDuplicateBatch}>
                  Duplicar Campaña
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        isOpen={isJobDetailOpen}
        onClose={() => {
          setIsJobDetailOpen(false);
          setSelectedJob(null);
        }}
      />

      {/* Edit Config Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Configuración de Llamadas"
        size="md"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duración Máxima (segundos)
              </label>
              <Input
                type="number"
                value={editedCallSettings.max_call_duration}
                onChange={(e) => setEditedCallSettings({
                  ...editedCallSettings,
                  max_call_duration: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiempo de Timbrado (segundos)
              </label>
              <Input
                type="number"
                value={editedCallSettings.ring_timeout}
                onChange={(e) => setEditedCallSettings({
                  ...editedCallSettings,
                  ring_timeout: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Intentos Máximos
              </label>
              <Input
                type="number"
                value={editedCallSettings.max_attempts}
                onChange={(e) => setEditedCallSettings({
                  ...editedCallSettings,
                  max_attempts: parseInt(e.target.value) || 0
                })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Horas entre Intentos
              </label>
              <Input
                type="number"
                value={editedCallSettings.retry_delay_hours}
                onChange={(e) => setEditedCallSettings({
                  ...editedCallSettings,
                  retry_delay_hours: parseInt(e.target.value) || 0
                })}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSaveConfig}>
              Guardar Cambios
            </Button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};