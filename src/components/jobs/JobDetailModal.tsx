import React from 'react';
import { JobModel } from '@/types';
import { Button } from '@/components/ui/Button';

interface JobDetailModalProps {
  job: JobModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, isOpen, onClose }) => {
  if (!isOpen || !job) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP' 
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Detalle de Tarea: {job.job_id}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">Cerrar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Información del Contacto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Información del Contacto</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700">Nombre:</span>
                <span className="ml-2 text-gray-900">{job.contact.name}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">RUT/DNI:</span>
                <span className="ml-2 text-gray-900">{job.contact.dni || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Teléfonos:</span>
                <span className="ml-2 text-gray-900">{job.contact.phones.join(', ')}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Próximo teléfono:</span>
                <span className="ml-2 text-gray-900">
                  {job.contact.phones[job.contact.next_phone_index] || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Información de la Deuda */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Información de la Deuda</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700">Empresa:</span>
                <span className="ml-2 text-gray-900">{job.payload?.company_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Monto:</span>
                <span className="ml-2 text-gray-900 font-semibold text-green-600">
                  {job.payload?.debt_amount ? formatCurrency(job.payload.debt_amount) : 'N/A'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Fecha límite:</span>
                <span className="ml-2 text-gray-900">{job.payload?.due_date || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Referencia:</span>
                <span className="ml-2 text-gray-900">{job.payload?.reference_number || 'N/A'}</span>
              </div>
              {job.payload?.additional_info?.cantidad_cupones && (
                <div>
                  <span className="font-medium text-gray-700">Cupones:</span>
                  <span className="ml-2 text-gray-900">{job.payload.additional_info.cantidad_cupones}</span>
                </div>
              )}
            </div>
          </div>

          {/* Estado de la Tarea */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Estado de la Tarea</h3>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-700">Estado:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                  job.status === 'completed' ? 'bg-green-100 text-green-800' :
                  job.status === 'failed' ? 'bg-red-100 text-red-800' :
                  job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {job.status}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Intentos:</span>
                <span className="ml-2 text-gray-900">{job.attempts} / {job.max_attempts}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Modo:</span>
                <span className="ml-2 text-gray-900">{job.mode}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Creado:</span>
                <span className="ml-2 text-gray-900">{formatDate(job.created_at)}</span>
              </div>
              {job.started_at && (
                <div>
                  <span className="font-medium text-gray-700">Iniciado:</span>
                  <span className="ml-2 text-gray-900">{formatDate(job.started_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resultado de la Llamada */}
          {job.call_result && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Resultado de la Llamada</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium text-gray-700">Éxito:</span>
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    job.call_result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {job.call_result.success ? 'Sí' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <span className="ml-2 text-gray-900">{job.call_result.status}</span>
                </div>
                {job.call_result.summary && (
                  <>
                    <div>
                      <span className="font-medium text-gray-700">Duración:</span>
                      <span className="ml-2 text-gray-900">
                        {job.call_result.summary.call_cost?.total_duration_seconds || 0} segundos
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Costo:</span>
                      <span className="ml-2 text-gray-900">
                        ${job.call_result.summary.call_cost?.combined_cost || 0}
                      </span>
                    </div>
                    {job.call_result.summary.call_analysis?.call_summary && (
                      <div>
                        <span className="font-medium text-gray-700">Resumen:</span>
                        <p className="ml-2 text-gray-900 text-sm mt-1">
                          {job.call_result.summary.call_analysis.call_summary}
                        </p>
                      </div>
                    )}
                    {job.call_result.summary.recording_url && (
                      <div>
                        <span className="font-medium text-gray-700">Grabación:</span>
                        <a 
                          href={job.call_result.summary.recording_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 underline"
                        >
                          Escuchar grabación
                        </a>
                      </div>
                    )}
                    {job.call_result.summary.public_log_url && (
                      <div>
                        <span className="font-medium text-gray-700">Log público:</span>
                        <a 
                          href={job.call_result.summary.public_log_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800 underline"
                        >
                          Ver log
                        </a>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Información Técnica */}
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Información Técnica</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Job ID:</span>
              <p className="text-gray-900 font-mono text-xs">{job.job_id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Batch ID:</span>
              <p className="text-gray-900 font-mono text-xs">{job.batch_id}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Account ID:</span>
              <p className="text-gray-900 font-mono text-xs">{job.account_id}</p>
            </div>
            {job.call_id && (
              <div>
                <span className="font-medium text-gray-700">Call ID:</span>
                <p className="text-gray-900 font-mono text-xs">{job.call_id}</p>
              </div>
            )}
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-6 flex justify-end space-x-3">
          {job.status === 'failed' && (
            <Button variant="primary">
              Reintentar
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};