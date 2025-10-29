import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useBatches, useCreateBatch, useCreateBatchFromExcel, useAccounts, useDeleteBatch, useToggleBatchStatus, useJobs } from '@/services/queries';
import { BatchModel, CreateBatchRequest } from '@/types';
import { Button } from '@/components/ui/Button';
import { CreateBatchModal } from '@/components/batches/CreateBatchModal';
import { BatchDetailModal } from '@/components/batches/BatchDetailModal';
import { Plus, Search, Filter, Megaphone, CheckCircle2, XCircle, Clock, Pause, Trash2, Play } from 'lucide-react';

export const BatchesPage: React.FC = () => {
  const location = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<BatchModel | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreating, setIsCreating] = useState(false);

  const { data: batches, isLoading, error } = useBatches(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );
  const { data: accounts } = useAccounts();
  const { data: jobs } = useJobs({}); // Obtener todos los jobs para calcular totales financieros
  const createBatchMutation = useCreateBatch();
  const createBatchFromExcelMutation = useCreateBatchFromExcel();
  const deleteBatchMutation = useDeleteBatch();
  const toggleBatchStatusMutation = useToggleBatchStatus();

  // Calcular totales financieros por batch
  const batchFinancials = useMemo(() => {
    if (!jobs || !batches) return {};

    const financials: { [batchId: string]: { 
      totalDeuda: number;
      totalAcordado: number;
      totalFaltante: number;
    } } = {};

    jobs.forEach((job: any) => {
      const batchId = job.batch_id;
      if (!batchId) return;

      if (!financials[batchId]) {
        financials[batchId] = {
          totalDeuda: 0,
          totalAcordado: 0,
          totalFaltante: 0
        };
      }

      // Buscar deuda en diferentes lugares
      const deuda = job.deuda 
        || job.monto_total 
        || job.payload?.debt_amount 
        || job.payload?.deuda
        || job.payload?.monto_total
        || 0;
      
      // Buscar monto acordado en diferentes lugares
      const acordado = job.monto_pago_cliente 
        || job.fecha_pago_cliente // A veces el monto viene como string en fecha_pago
        || job.call_result?.summary?.collected_dynamic_variables?.monto_pago_cliente
        || 0;
      
      // Convertir a número si es string
      const deudaNum = typeof deuda === 'string' ? parseFloat(deuda) || 0 : deuda;
      const acordadoNum = typeof acordado === 'string' ? parseFloat(acordado) || 0 : acordado;
      
      financials[batchId].totalDeuda += deudaNum;
      financials[batchId].totalAcordado += acordadoNum;
      financials[batchId].totalFaltante += (deudaNum - acordadoNum);
    });

    // Log para debugging
    console.log('📊 Financials calculados:', financials);
    if (jobs.length > 0) {
      console.log('📋 Ejemplo de job:', jobs[0]);
    }

    return financials;
  }, [jobs, batches]);

  // Abrir modal si viene desde otra página con selectedBatchId
  useEffect(() => {
    if (location.state?.selectedBatchId && batches) {
      const batch = batches.find((b: BatchModel) => b.batch_id === location.state.selectedBatchId);
      if (batch) {
        setSelectedBatch(batch);
        // Limpiar el estado de navegación
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, batches]);

  const handleCreateBatch = async (batchData: CreateBatchRequest) => {
    setIsCreating(true);
    try {
      console.group('🔍 BatchesPage - Datos recibidos del modal:');
      console.log('batchData completo:', batchData);
      console.log('account_id:', batchData.account_id);
      console.log('account_id tipo:', typeof batchData.account_id);
      console.log('name:', batchData.name);
      console.log('excel_file:', batchData.excel_file?.name);
      console.groupEnd();
      
      // Si hay un archivo Excel, usar el endpoint específico
      if (batchData.excel_file) {
        console.group('📤 Enviando a createBatchFromExcel con:');
        console.log('file:', batchData.excel_file.name);
        console.log('accountId:', batchData.account_id);
        console.log('batchName:', batchData.name);
        console.log('🔧 callSettings:', batchData.call_settings);
        console.log('🔧 callSettings es null?', batchData.call_settings === null);
        console.log('🔧 callSettings es undefined?', batchData.call_settings === undefined);
        if (batchData.call_settings) {
          console.log('✅ call_settings tiene datos:');
          console.log('  - max_call_duration:', batchData.call_settings.max_call_duration);
          console.log('  - ring_timeout:', batchData.call_settings.ring_timeout);
          console.log('  - max_attempts:', batchData.call_settings.max_attempts);
          console.log('  - retry_delay_hours:', batchData.call_settings.retry_delay_hours);
          console.log('  - timezone:', batchData.call_settings.timezone);
          console.log('  - days_of_week:', batchData.call_settings.days_of_week);
          console.log('  - allowed_hours:', batchData.call_settings.allowed_hours);
        } else {
          console.error('❌ call_settings está vacío!');
        }
        console.log('allowDuplicates:', batchData.allow_duplicates);
        console.groupEnd();
        
        const response = await createBatchFromExcelMutation.mutateAsync({
          file: batchData.excel_file,
          accountId: batchData.account_id,
          batchName: batchData.name,
          batchDescription: batchData.description,
          allowDuplicates: batchData.allow_duplicates ?? false,
          callSettings: batchData.call_settings,
          processingType: 'basic'
        });
        
        // Mostrar mensaje de éxito
        console.log('✅ Response exitosa:', response);
        
        const successMessage = [
          '✅ ¡Campaña creada exitosamente!',
          '',
          `📋 Nombre: ${batchData.name}`,
          `🆔 Batch ID: ${response?.batch_id || 'N/A'}`,
          `📞 Jobs creados: ${response?.jobs_created || 0}`,
          `👥 Contactos procesados: ${response?.contacts_processed || response?.jobs_created || 0}`,
        ];
        
        if (response?.duplicates_skipped && response.duplicates_skipped > 0) {
          successMessage.push(`⚠️ Duplicados omitidos: ${response.duplicates_skipped}`);
        }
        
        alert(successMessage.join('\n'));
      } else {
        // Sin archivo, crear batch normal con JSON
        const response = await createBatchMutation.mutateAsync(batchData);
        console.log('✅ Batch creado (sin Excel):', response);
        alert(`✅ ¡Campaña creada exitosamente!\n\n📋 Nombre: ${batchData.name}`);
      }
      
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('❌ Error creating batch:', error);
      
      // Mostrar error específico
      const errorDetail = error?.response?.data?.detail || 
                         error?.response?.data?.error ||
                         error?.message || 
                         'Error desconocido al crear la campaña';
      
      const errorMessage = [
        '❌ Error al crear campaña',
        '',
        errorDetail,
        '',
        '💡 Posibles soluciones:',
        '• Verifica que seleccionaste una cuenta válida',
        '• Revisa que el archivo Excel tenga el formato correcto',
        '• Si hay contactos duplicados, activa la opción "Permitir duplicados"',
        '',
        'Revisa la consola del navegador para más detalles (F12)'
      ];
      
      alert(errorMessage.join('\n'));
    } finally {
      setIsCreating(false);
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

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`¿Estás seguro de eliminar la campaña "${batchName}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteBatchMutation.mutateAsync({ batchId, deleteJobs: false });
      alert(`✅ Campaña "${batchName}" eliminada exitosamente`);
    } catch (error: any) {
      console.error('Error eliminando campaña:', error);
      alert(`❌ Error al eliminar campaña: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleToggleBatchStatus = async (batch: BatchModel) => {
    const newStatus = batch.status === 'RUNNING' ? false : true;
    const action = newStatus ? 'reanudar' : 'pausar';

    try {
      await toggleBatchStatusMutation.mutateAsync({ 
        batchId: batch.batch_id, 
        isActive: newStatus 
      });
      // No need to show alert, the UI will update automatically due to query invalidation
    } catch (error: any) {
      console.error(`Error al ${action} campaña:`, error);
      alert(`❌ Error al ${action} campaña: ${error.response?.data?.detail || error.message}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Campañas de Llamadas</h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <Megaphone className="h-4 w-4 mr-2" />
            Gestiona tus campañas de llamadas automatizadas y su configuración
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Campaña</span>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {batches?.length || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Megaphone className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Ejecución</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {batches?.filter(b => b.status === 'RUNNING').length || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pausados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {batches?.filter(b => b.status === 'PAUSED').length || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Pause className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completados</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {batches?.filter(b => b.status === 'COMPLETED').length || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Con Error</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {batches?.filter(b => b.status === 'ERROR').length || 0}
              </p>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
              <XCircle className="h-5 w-5 text-white" />
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deuda Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acordado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faltante
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
                  const financials = batchFinancials[batch.batch_id] || { totalDeuda: 0, totalAcordado: 0, totalFaltante: 0 };
                  const porcentajeRecuperado = financials.totalDeuda > 0 
                    ? ((financials.totalAcordado / financials.totalDeuda) * 100).toFixed(1)
                    : '0.0';
                  
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
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${financials.totalDeuda.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-green-600">
                          ${financials.totalAcordado.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {porcentajeRecuperado}% recup.
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-red-600">
                          ${financials.totalFaltante.toFixed(2)}
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
                            <button
                              onClick={() => handleToggleBatchStatus(batch)}
                              disabled={toggleBatchStatusMutation.isPending}
                              title="Pausar campaña"
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Pause className="h-4 w-4" />
                            </button>
                          )}
                          {batch.status === 'PAUSED' && (
                            <button
                              onClick={() => handleToggleBatchStatus(batch)}
                              disabled={toggleBatchStatusMutation.isPending}
                              title="Reanudar campaña"
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteBatch(batch.batch_id, batch.name)}
                            disabled={deleteBatchMutation.isPending}
                            title="Eliminar campaña"
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
        isLoading={isCreating || createBatchMutation.isPending || createBatchFromExcelMutation.isPending}
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