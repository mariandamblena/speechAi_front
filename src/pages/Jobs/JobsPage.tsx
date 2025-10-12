import React, { useState } from 'react';
import { useJobs } from '@/services/queries';
import { Button } from '@/components/ui/Button';
import { JobModel, JobStatus } from '@/types';
import { JobDetailModal } from '@/components/jobs/JobDetailModal';

export const JobsPage: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<JobModel | null>(null);
  const { data: jobs, isLoading, error } = useJobs(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );

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
      </div>

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
        {!jobs || jobs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay tareas que mostrar
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                {jobs.map((job: JobModel) => (
                  <tr key={job._id} className="hover:bg-gray-50">
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