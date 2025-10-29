import React, { useMemo } from 'react';
import { useBatches, useJobs } from '@/services/queries';
import { formatNumber } from '@/utils/format';
import { 
  Phone, 
  TrendingUp, 
  Activity, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Users,
  Target
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  // Obtener datos reales de la API
  const { data: batches, isLoading: batchesLoading } = useBatches({});
  const { data: jobs, isLoading: jobsLoading } = useJobs({});

  // Función para traducir estados a español
  const getStatusText = (batch: any) => {
    if (batch.is_active === true) {
      return 'Activa';
    } else {
      return 'Pausada';
    }
  };

  const getStatusColor = (batch: any) => {
    if (batch.is_active === true) {
      return 'bg-green-100 text-green-800';
    } else {
      return 'bg-yellow-100 text-yellow-800';
    }
  };

  // Calcular estadísticas reales desde los jobs
  const stats = useMemo(() => {
    if (!jobs || !Array.isArray(jobs)) {
      return {
        total_jobs_today: 0,
        success_rate: 0,
        active_batches: 0,
        pending_jobs: 0,
        completed_jobs_today: 0,
        failed_jobs_today: 0,
        in_progress_jobs: 0,
        revenue_today: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const jobsToday = jobs.filter(job => {
      const jobDate = new Date(job.created_at);
      jobDate.setHours(0, 0, 0, 0);
      return jobDate.getTime() === today.getTime();
    });

    const completedToday = jobsToday.filter(j => j.status === 'completed' || j.status === 'done').length;
    const failedToday = jobsToday.filter(j => j.status === 'failed').length;
    const pendingToday = jobsToday.filter(j => j.status === 'pending').length;
    const inProgressToday = jobsToday.filter(j => j.status === 'in_progress').length;
    
    const successRate = jobsToday.length > 0 ? (completedToday / jobsToday.length) * 100 : 0;
    const totalCostToday = jobsToday.reduce((sum, job) => sum + (job.call_result?.summary?.call_cost?.combined_cost || 0), 0);

    return {
      total_jobs_today: jobsToday.length,
      success_rate: successRate,
      active_batches: Array.isArray(batches) ? batches.filter((b: any) => b.is_active === true).length : 0,
      pending_jobs: pendingToday,
      completed_jobs_today: completedToday,
      failed_jobs_today: failedToday,
      in_progress_jobs: inProgressToday,
      revenue_today: totalCostToday
    };
  }, [jobs, batches]);

  const isLoading = batchesLoading || jobsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          Último update: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Jobs Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.total_jobs_today}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Phone className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.success_rate.toFixed(0)}%
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Active Batches */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Lotes Activos</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.active_batches}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        {/* Pending Jobs */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Pendientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.pending_jobs}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Batches */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Lotes Recientes</h3>
          </div>
          <div className="p-6">
            {batches && batches.length > 0 ? (
              <div className="space-y-4">
                {batches.slice(0, 5).map((batch) => (
                  <div key={batch.batch_id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{batch.name}</p>
                      <p className="text-sm text-gray-500">
                        {batch.total_jobs || 0} contactos
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getStatusColor(batch)
                      }`}>
                        {getStatusText(batch)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <p>No hay lotes disponibles</p>
                <p className="text-sm mt-1">
                  {batchesLoading ? 'Cargando...' : 'Crea tu primer lote para comenzar'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Activity Chart Placeholder */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Actividad de Llamadas</h3>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <span className="text-4xl text-gray-400">📊</span>
                <p className="text-gray-500 mt-2">Gráfico de actividad</p>
                <p className="text-sm text-gray-400">
                  Disponible cuando se implemente /api/v1/reports/analytics
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen del Día</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed_jobs_today}</div>
            <div className="text-sm text-gray-500">Completados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.in_progress_jobs}</div>
            <div className="text-sm text-gray-500">En Progreso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed_jobs_today}</div>
            <div className="text-sm text-gray-500">Fallidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">${formatNumber(stats.revenue_today)}</div>
            <div className="text-sm text-gray-500">Ingresos</div>
          </div>
        </div>
      </div>
    </div>
  );
};