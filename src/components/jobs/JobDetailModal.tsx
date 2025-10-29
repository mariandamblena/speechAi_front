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

  // � Extraer variables de compromiso desde collected_dynamic_variables si no están en raíz
  const dynamicVars = job.call_result?.summary?.collected_dynamic_variables;
  const fechaPagoCliente = job.fecha_pago_cliente || dynamicVars?.fecha_pago_cliente;
  const montoPagoCliente = job.monto_pago_cliente || 
    (typeof dynamicVars?.monto_pago_cliente === 'string' 
      ? parseFloat(dynamicVars.monto_pago_cliente) 
      : dynamicVars?.monto_pago_cliente);

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

        {/* 🆕 Compromiso de Pago del Cliente */}
        {(fechaPagoCliente || montoPagoCliente) ? (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-green-800">💰 Compromiso de Pago</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fechaPagoCliente && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <span className="block text-sm font-medium text-gray-600 mb-2">📅 Fecha Prometida</span>
                  <span className="block text-2xl font-bold text-green-700">
                    {new Date(fechaPagoCliente).toLocaleDateString('es-ES', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
              )}
              {montoPagoCliente && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-200">
                  <span className="block text-sm font-medium text-gray-600 mb-2">💵 Monto Prometido</span>
                  <span className="block text-2xl font-bold text-green-700">
                    {formatCurrency(montoPagoCliente)}
                  </span>
                  {job.monto_total && montoPagoCliente === job.monto_total && (
                    <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Pago total
                    </span>
                  )}
                  {job.monto_total && montoPagoCliente < job.monto_total && (
                    <span className="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⚠️ Pago parcial
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-green-100 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>✨ Nota:</strong> Estos datos fueron capturados automáticamente durante la conversación telefónica.
              </p>
            </div>
          </div>
        ) : job.call_result?.success && (
          <div className="mt-6 bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
            <div className="flex items-center mb-2">
              <svg className="w-6 h-6 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-blue-900">ℹ️ Compromiso de Pago No Disponible</h3>
            </div>
            <p className="text-sm text-blue-800">
              Los datos de compromiso de pago no están disponibles en esta llamada. Esto puede ocurrir si:
            </p>
            <ul className="mt-2 text-sm text-blue-800 list-disc list-inside space-y-1">
              <li>El cliente no confirmó una fecha o monto de pago específico</li>
              <li>La llamada terminó antes de capturar esta información</li>
              <li>El backend aún no ha procesado los datos dinámicos de esta llamada</li>
            </ul>
          </div>
        )}

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