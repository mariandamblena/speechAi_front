import React, { useState, useMemo } from 'react';
import { useJobs, useBulkDeleteJobs, useBatches } from '@/services/queries';
import { Button } from '@/components/ui/Button';
import { JobModel, JobStatus } from '@/types';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { Trash2, Filter, X, Search, ChevronDown, ChevronRight } from 'lucide-react';

export const JobsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<JobModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [collapsedBatches, setCollapsedBatches] = useState<Set<string>>(new Set());

  const { data: jobs, isLoading, error } = useJobs(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );
  const { data: batches } = useBatches();
  const bulkDeleteMutation = useBulkDeleteJobs();

  // Función para toggle collapse de batch
  const toggleBatchCollapse = (batchId: string) => {
    const newCollapsed = new Set(collapsedBatches);
    if (newCollapsed.has(batchId)) {
      newCollapsed.delete(batchId);
    } else {
      newCollapsed.add(batchId);
    }
    setCollapsedBatches(newCollapsed);
  };

  // Filtrar jobs por búsqueda
  const filteredJobs = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) return [];
    
    if (!searchQuery.trim()) return jobs;
    
    const query = searchQuery.toLowerCase();
    return jobs.filter((job: JobModel) => {
      const name = (job.contact?.name || '').toLowerCase();
      const phone = (job.contact?.phones?.[0] || '').toLowerCase();
      const batchId = (job.batch_id || '').toLowerCase();
      return name.includes(query) || phone.includes(query) || batchId.includes(query);
    });
  }, [jobs, searchQuery]);

  // Agrupar jobs por batch
  const groupedJobs = useMemo(() => {
    if (!filteredJobs || filteredJobs.length === 0) return new Map();
    
    const groups = new Map<string, JobModel[]>();
    
    filteredJobs.forEach((job: JobModel) => {
      const batchId = job.batch_id || 'sin-batch';
      if (!groups.has(batchId)) {
        groups.set(batchId, []);
      }
      groups.get(batchId)!.push(job);
    });
    
    return groups;
  }, [filteredJobs]);

  // Colapsar todos los batches al cargar los jobs, pero expandir si hay búsqueda activa
  React.useEffect(() => {
    if (groupedJobs.size > 0) {
      const allBatchIds = Array.from(groupedJobs.keys());
      
      // Si hay búsqueda activa, expandir todos los batches
      if (searchQuery.trim()) {
        setCollapsedBatches(new Set());
      } else {
        // Si no hay búsqueda, colapsar todos
        setCollapsedBatches(new Set(allBatchIds));
      }
    }
  }, [groupedJobs, searchQuery]);

  // Obtener nombre del batch
  const getBatchName = (batchId: string) => {
    if (batchId === 'sin-batch') return 'Sin Lote Asignado';
    const batch = batches?.find(b => b.batch_id === batchId);
    return batch?.name || `Lote ${batchId}`;
  };

  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: JobStatus) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'in_progress':
        return 'En Progreso';
      case 'completed':
      case 'done':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  // Manejar selección de todos
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedJobIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(filteredJobs.map((job: JobModel) => job._id));
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
      alert('No hay tareas seleccionadas');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar ${selectedJobIds.size} tarea(s)?`)) {
      return;
    }

    try {
      const result = await bulkDeleteMutation.mutateAsync(Array.from(selectedJobIds));
      
      if (result.failed > 0) {
        alert(`Se eliminaron ${result.successful} tarea(s). ${result.failed} fallaron.`);
      } else {
        alert(`Se eliminaron ${result.successful} tarea(s) exitosamente`);
      }
      
      // Limpiar selección
      setSelectedJobIds(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error('Error al eliminar tareas:', error);
      alert('Error al eliminar las tareas');
    }
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setStatusFilter('all');
    setSearchQuery('');
    setShowFilters(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error al cargar las tareas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Tareas de Procesamiento</h1>
        
        <div className="flex items-center space-x-2">
          {selectedJobIds.size > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isLoading}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar ({selectedJobIds.size})
            </Button>
          )}
          
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Buscador fuera del panel de filtros */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nombre, teléfono o ID de lote..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Filtros de búsqueda</h3>
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
            >
              <X className="w-4 h-4 mr-1" />
              Limpiar filtros
            </button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <p className="text-xs text-gray-500">Usa los tabs de abajo para filtrar por estado</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'pending', label: 'Pendientes' },
          { key: 'in_progress', label: 'En Progreso' },
          { key: 'completed', label: 'Completadas' },
          { key: 'done', label: 'Terminadas' },
          { key: 'failed', label: 'Fallidas' },
        ].map((filter) => (
          <button
            key={filter.key}
            onClick={() => setStatusFilter(filter.key as JobStatus | 'all')}
            className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              statusFilter === filter.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Jobs list agrupados por batch */}
      <div className="space-y-4">
        {!filteredJobs || filteredJobs.length === 0 ? (
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 text-center text-gray-500">
            {searchQuery ? 'No se encontraron tareas que coincidan con tu búsqueda' : 'No hay tareas que mostrar'}
          </div>
        ) : (
          Array.from(groupedJobs.entries()).map(([batchId, batchJobs]) => {
            const isCollapsed = collapsedBatches.has(batchId);
            
            return (
              <div key={batchId} className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                {/* Header del batch - Más compacto */}
                <div 
                  className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between cursor-pointer hover:from-gray-100 hover:to-gray-150 transition-all"
                  onClick={() => toggleBatchCollapse(batchId)}
                >
                  <div className="flex items-center space-x-2">
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-semibold text-gray-900">
                        {getBatchName(batchId)}
                      </h3>
                      <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        {batchJobs.length} {batchJobs.length === 1 ? 'llamada' : 'llamadas'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span className="text-gray-600">{batchJobs.filter((j: JobModel) => j.status === 'completed' || j.status === 'done').length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      <span className="text-gray-600">{batchJobs.filter((j: JobModel) => j.status === 'pending').length}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                      <span className="text-gray-600">{batchJobs.filter((j: JobModel) => j.status === 'failed').length}</span>
                    </div>
                  </div>
                </div>

                {/* Tabla de jobs del batch */}
                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left">
                            <input
                              type="checkbox"
                              checked={batchJobs.every((job: JobModel) => selectedJobIds.has(job._id))}
                              onChange={() => {
                                const allSelected = batchJobs.every((job: JobModel) => selectedJobIds.has(job._id));
                                const newSelected = new Set(selectedJobIds);
                                
                                if (allSelected) {
                                  batchJobs.forEach((job: JobModel) => newSelected.delete(job._id));
                                } else {
                                  batchJobs.forEach((job: JobModel) => newSelected.add(job._id));
                                }
                                
                                setSelectedJobIds(newSelected);
                                setSelectAll(newSelected.size === filteredJobs.length);
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Contacto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Compromiso
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Intentos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Creado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {batchJobs.map((job: JobModel) => (
                          <tr key={job._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={selectedJobIds.has(job._id)}
                                onChange={() => handleSelectJob(job._id)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {job.contact.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {job.contact.phones?.[0] || 'Sin teléfono'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                                  job.status
                                )}`}
                              >
                                {getStatusText(job.status)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                // 🔧 Extraer variables de compromiso desde collected_dynamic_variables
                                const dynamicVars = job.call_result?.summary?.collected_dynamic_variables;
                                const fechaPago = job.fecha_pago_cliente || dynamicVars?.fecha_pago_cliente;
                                const montoPago = job.monto_pago_cliente || 
                                  (typeof dynamicVars?.monto_pago_cliente === 'string' 
                                    ? parseFloat(dynamicVars.monto_pago_cliente) 
                                    : dynamicVars?.monto_pago_cliente);

                                return fechaPago ? (
                                  <div className="flex flex-col space-y-1">
                                    <div className="flex items-center">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        💰 Sí
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      📅 {new Date(fechaPago).toLocaleDateString('es-ES', { 
                                        month: 'short', 
                                        day: 'numeric' 
                                      })}
                                    </div>
                                    {montoPago && (
                                      <div className="text-xs font-semibold text-green-700">
                                        ${montoPago.toLocaleString('es-CL')}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    —
                                  </span>
                                );
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${(job.attempts / job.max_attempts) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="ml-2 text-sm text-gray-500">
                                  {job.attempts}/{job.max_attempts}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(job.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                {job.status === 'in_progress' && (
                                  <Button size="sm" variant="secondary">
                                    Pausar
                                  </Button>
                                )}
                                {job.status === 'failed' && (
                                  <Button size="sm" variant="primary">
                                    Reintentar
                                  </Button>
                                )}
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => setSelectedJob(job)}
                                >
                                  Ver Detalle
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal de detalle */}
      <JobDetailModal
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
};