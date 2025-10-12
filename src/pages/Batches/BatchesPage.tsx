import React, { useState } from 'react';
import { useBatches, useCreateBatch, useAccounts } from '@/services/queries';
import { BatchModel, CreateBatchRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { CreateBatchModal } from '@/components/batches/CreateBatchModal';
import { BatchDetailModal } from '@/components/batches/BatchDetailModal';

export const BatchesPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchModel | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: batches, isLoading, error } = useBatches(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );
  const { data: accounts } = useAccounts();
  const createBatchMutation = useCreateBatch();

  const handleCreateBatch = async (batchData: CreateBatchRequest) => {
    try {
      await createBatchMutation.mutateAsync(batchData);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating batch:', error);
    }
  };

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

  const calculateProgress = (batch: BatchModel) => {
    if (!batch.stats) return 0;
    const total = batch.stats.total_contacts;
    const completed = batch.stats.calls_completed + batch.stats.calls_failed;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
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
      <div className="text-center text-red-600 py-8">
        Error cargando batches: {error.toString()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Campañas de Llamadas</h1>
          <p className="text-gray-500 mt-1">
            Gestiona tus campañas de llamadas automatizadas y su configuración
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="mr-2">+</span>
          Nueva Campaña
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Estado:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            <option value="all">Todos</option>
            <option value="PENDING">Pendientes</option>
            <option value="RUNNING">En Ejecución</option>
            <option value="PAUSED">Pausados</option>
            <option value="COMPLETED">Completados</option>
            <option value="CANCELLED">Cancelados</option>
            <option value="ERROR">Con Error</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">📋</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {batches?.length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">▶️</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  En Ejecución
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {batches?.filter(b => b.status === 'RUNNING').length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600">⏸️</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Pausados
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {batches?.filter(b => b.status === 'PAUSED').length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600">✅</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Completados
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {batches?.filter(b => b.status === 'COMPLETED').length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">❌</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Con Error
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {batches?.filter(b => b.status === 'ERROR').length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Batches List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Campañas</h3>
        </div>
        
        {!batches || batches.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay campañas registradas. Crea la primera campaña para comenzar.
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaña
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cuenta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contactos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progreso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
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
                {batches.map((batch) => {
                  const progress = calculateProgress(batch);
                  const account = accounts?.find(acc => acc.account_id === batch.account_id);
                  
                  return (
                    <tr key={batch._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {batch.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {batch.description || 'Sin descripción'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {account?.account_name || batch.account_id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {batch.stats?.total_contacts || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {batch.stats?.calls_completed || 0} completadas
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}>
                          {getStatusText(batch.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => setSelectedBatch(batch)}
                          >
                            Ver Detalle
                          </Button>
                          {batch.status === 'RUNNING' && (
                            <Button size="sm" variant="warning">
                              Pausar
                            </Button>
                          )}
                          {batch.status === 'PAUSED' && (
                            <Button size="sm" variant="primary">
                              Reanudar
                            </Button>
                          )}
                          {(batch.status === 'PENDING' || batch.status === 'PAUSED') && (
                            <Button size="sm" variant="danger">
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateBatchModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBatch}
        isLoading={createBatchMutation.isPending}
        accounts={accounts || []}
      />

      <BatchDetailModal
        batch={selectedBatch}
        isOpen={selectedBatch !== null}
        onClose={() => setSelectedBatch(null)}
      />
    </div>
  );
};