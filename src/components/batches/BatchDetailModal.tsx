import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BatchModel } from '@/types';
import { useBatchJobs, usePauseBatch, useResumeBatch, useCancelBatch } from '@/services/queries';

interface BatchDetailModalProps {
  batch: BatchModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const BatchDetailModal: React.FC<BatchDetailModalProps> = ({
  batch,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'settings' | 'logs'>('overview');

  const { data: jobs, isLoading: jobsLoading } = useBatchJobs(
    batch?.batch_id || '', 
    { enabled: !!batch && activeTab === 'jobs' }
  );

  const pauseBatchMutation = usePauseBatch();
  const resumeBatchMutation = useResumeBatch();
  const cancelBatchMutation = useCancelBatch();

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
    if (!batch.stats) return 0;
    const total = batch.stats.total_contacts;
    const completed = batch.stats.calls_completed + batch.stats.calls_failed;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const calculateSuccessRate = () => {
    if (!batch.stats) return 0;
    const total = batch.stats.calls_completed + batch.stats.calls_failed;
    return total > 0 ? Math.round((batch.stats.calls_completed / total) * 100) : 0;
  };

  const getDayName = (day: number) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[day];
  };

  const handlePause = async () => {
    try {
      await pauseBatchMutation.mutateAsync(batch._id);
    } catch (error) {
      console.error('Error pausing batch:', error);
    }
  };

  const handleResume = async () => {
    try {
      await resumeBatchMutation.mutateAsync(batch._id);
    } catch (error) {
      console.error('Error resuming batch:', error);
    }
  };

  const handleCancel = async () => {
    if (window.confirm('¿Estás seguro de que quieres cancelar esta campaña?')) {
      try {
        await cancelBatchMutation.mutateAsync(batch._id);
      } catch (error) {
        console.error('Error canceling batch:', error);
      }
    }
  };

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: '📊' },
    { id: 'jobs', label: 'Llamadas', icon: '📞' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' },
    { id: 'logs', label: 'Logs', icon: '📋' }
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
                <Button size="sm" variant="warning" onClick={handlePause}>
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
                {batch.stats?.total_contacts || 0}
              </div>
              <div className="text-sm text-gray-500">Total Contactos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {batch.stats?.calls_completed || 0}
              </div>
              <div className="text-sm text-gray-500">Completadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {batch.stats?.calls_failed || 0}
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
                        {(batch.stats?.total_contacts || 0) - (batch.stats?.calls_completed || 0) - (batch.stats?.calls_failed || 0)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Duración Promedio</dt>
                      <dd className="text-sm text-gray-900">{batch.stats?.avg_call_duration || 0}s</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Costo Total Estimado</dt>
                      <dd className="text-sm text-gray-900">${batch.stats?.total_cost || 0}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tiempo Total</dt>
                      <dd className="text-sm text-gray-900">{batch.stats?.total_duration || 0} min</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Script Preview */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Script de la Llamada</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                    {batch.script_content}
                  </pre>
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Actividad Reciente</h4>
                <div className="space-y-3">
                  <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Campaña iniciada</p>
                      <p className="text-xs text-gray-500">{new Date(batch.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  {batch.status === 'PAUSED' && (
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Campaña pausada</p>
                        <p className="text-xs text-gray-500">{new Date(batch.updated_at).toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                  {batch.status === 'COMPLETED' && (
                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Campaña completada</p>
                        <p className="text-xs text-gray-500">{new Date(batch.updated_at).toLocaleString()}</p>
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
                  <Button size="sm" variant="secondary">
                    Exportar CSV
                  </Button>
                  <Button size="sm" variant="primary">
                    Filtrar
                  </Button>
                </div>
              </div>

              {jobsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !jobs || !Array.isArray(jobs) || jobs.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay llamadas registradas para esta campaña
                </div>
              ) : (
                <div className="overflow-hidden border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Intentos</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {jobs.slice(0, 10).map((job: any) => (
                        <tr key={job._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {job.contact?.name || job.contact_info?.nombre || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {job.contact?.phones?.[0] || job.contact_info?.telefono || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              job.status === 'completed' || job.status === 'done' ? 'bg-green-100 text-green-800' :
                              job.status === 'failed' ? 'bg-red-100 text-red-800' :
                              job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {job.attempts || job.attempts_made || 0} / {job.max_attempts || 3}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {job.call_duration_seconds || job.call_result?.duration || 0}s
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {new Date(job.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            <Button size="sm" variant="secondary">
                              Ver Detalle
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {jobs.length > 10 && (
                    <div className="bg-gray-50 px-4 py-3 text-center">
                      <p className="text-sm text-gray-500">
                        Mostrando 10 de {jobs.length} llamadas. 
                        <button className="text-blue-600 hover:underline ml-1">Ver todas</button>
                      </p>
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

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Configuración de Voz</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Velocidad</label>
                      <div className="text-sm text-gray-900">{batch.voice_settings?.speed}x</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Idioma</label>
                      <div className="text-sm text-gray-900">{batch.voice_settings?.language}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tono</label>
                      <div className="text-sm text-gray-900">{batch.voice_settings?.pitch}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Volumen</label>
                      <div className="text-sm text-gray-900">{batch.voice_settings?.volume}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button variant="secondary">
                  Editar Configuración
                </Button>
                <Button variant="primary">
                  Duplicar Campaña
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Logs de Ejecución</h4>
              
              <div className="space-y-3">
                <div className="flex items-start p-3 bg-blue-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Campaña iniciada</p>
                      <span className="text-xs text-gray-500">{new Date(batch.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      Se han cargado {batch.stats?.total_contacts || 0} contactos para procesar
                    </p>
                  </div>
                </div>

                <div className="flex items-start p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-600 rounded-full mt-2 mr-3"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Llamadas completadas</p>
                      <span className="text-xs text-gray-500">Hace 2 horas</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {batch.stats?.calls_completed || 0} llamadas completadas exitosamente
                    </p>
                  </div>
                </div>

                {batch.stats?.calls_failed && batch.stats.calls_failed > 0 && (
                  <div className="flex items-start p-3 bg-red-50 rounded-lg">
                    <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">Llamadas fallidas</p>
                        <span className="text-xs text-gray-500">Hace 1 hora</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">
                        {batch.stats.calls_failed} llamadas fallaron por diversos motivos
                      </p>
                    </div>
                  </div>
                )}

                <div className="text-center py-4">
                  <Button size="sm" variant="secondary">
                    Ver Logs Completos
                  </Button>
                </div>
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
    </Modal>
  );
};