import React from 'react';
import { useDashboardStats, useBatches } from '@/services/queries';
import { formatNumber, formatPercentage } from '@/utils/format';
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
  // Real API queries - will show loading/error states if API is not available
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: batches, isLoading: batchesLoading } = useBatches({ limit: 5 });

  // Mock data as fallback for development
  const mockStats = {
    total_accounts: 3,
    active_batches: 2,
    total_jobs_today: 156,
    success_rate: 87.5,
    total_minutes_used: 234.5,
    revenue_today: 450.75,
    pending_jobs: 23,
    in_progress_jobs: 8,
    completed_jobs_today: 125,
    failed_jobs_today: 15,
  };

  // Use real data if available, otherwise use mock data
  const displayStats = stats ? {
    total_accounts: stats.total_accounts || 0,
    active_batches: stats.active_batches || 0,
    total_jobs_today: stats.total_jobs || 0, // ⚠️ Backend retorna total, no "today"
    success_rate: stats.success_rate || 0,
    total_minutes_used: 0, // ⚠️ No disponible en backend
    revenue_today: stats.total_revenue || 0, // ⚠️ Backend retorna total, no "today"
    pending_jobs: stats.pending_jobs || 0,
    in_progress_jobs: 0, // ⚠️ No disponible en backend
    completed_jobs_today: stats.completed_jobs || 0, // ⚠️ Backend retorna total, no "today"
    failed_jobs_today: stats.failed_jobs || 0, // ⚠️ Backend retorna total, no "today"
  } : mockStats;
  const showMockBanner: boolean = Boolean(!stats && !statsLoading && !statsError);

  if (statsLoading || batchesLoading) {
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

      {/* Mock Data Banner */}
      {showMockBanner ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Modo de desarrollo
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Mostrando datos de ejemplo. La API real está en http://localhost:8000
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Error Banner */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Error de conexión con API
              </h3>
              <p className="text-sm text-red-700 mt-1">
                No se pudo conectar con http://localhost:8000. Mostrando datos de ejemplo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Jobs Today */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Hoy</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {displayStats?.total_jobs_today ?? 0}
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
                {formatNumber(displayStats?.success_rate ?? 0)}%
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
                {displayStats?.active_batches ?? 0}
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
                {displayStats?.pending_jobs ?? 0}
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
                        {batch.stats?.total_contacts || 0} contactos • {batch.status}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        batch.status === 'RUNNING' 
                          ? 'bg-green-100 text-green-800'
                          : batch.status === 'PAUSED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {batch.status}
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
            <div className="text-2xl font-bold text-green-600">{displayStats?.completed_jobs_today ?? 0}</div>
            <div className="text-sm text-gray-500">Completados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{displayStats?.in_progress_jobs ?? 0}</div>
            <div className="text-sm text-gray-500">En Progreso</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{displayStats?.failed_jobs_today ?? 0}</div>
            <div className="text-sm text-gray-500">Fallidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">${formatNumber(displayStats?.revenue_today ?? 0)}</div>
            <div className="text-sm text-gray-500">Ingresos</div>
          </div>
        </div>
      </div>
    </div>
  );
};