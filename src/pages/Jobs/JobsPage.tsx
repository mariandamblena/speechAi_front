import React, { useState, useMemo } from 'react';
import { useJobs, useBulkDeleteJobs } from '@/services/queries';
import { Button } from '@/components/ui/Button';
import { JobModel, JobStatus } from '@/types';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';
import { Trash2, Filter, X } from 'lucide-react';

export const JobsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<JobModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const { data: jobs, isLoading, error } = useJobs(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );
  const bulkDeleteMutation = useBulkDeleteJobs();

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
                Buscar
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, teléfono o ID de lote..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
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

      {/* Jobs list */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {!filteredJobs || filteredJobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            {searchQuery ? 'No se encontraron tareas que coincidan con tu búsqueda' : 'No hay tareas que mostrar'}
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
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
                {filteredJobs.map((job: JobModel) => (
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
                          Lote: {job.batch_id}
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

      {/* Modal de detalle */}
      <JobDetailModal
        job={selectedJob}
        isOpen={selectedJob !== null}
        onClose={() => setSelectedJob(null)}
      />
    </div>
  );
};