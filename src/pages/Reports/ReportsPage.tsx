import React, { useState, useMemo } from 'react';
import { useDashboardStats, useBatches, useJobs } from '@/services/queries';
import { Button } from '@/components/ui/Button';
import { 
  Phone, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Download,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const ReportsPage: React.FC = () => {
  // Obtener fecha de hoy en formato YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];
  
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    from: today,
    to: today,
  });

  // Usar datos reales del dashboard y batches
  const { data: stats, isLoading: statsLoading, error: statsError } = useDashboardStats();
  const { data: batches, isLoading: batchesLoading } = useBatches();
  
  // Obtener jobs filtrados (solo cuando hay filtros aplicados)
  const hasFilters = selectedBatch || dateRange.from || dateRange.to;
  const { data: filteredJobs, isLoading: jobsLoading } = useJobs(
    hasFilters ? { batch_id: selectedBatch || undefined } : {}
  );

  const isLoading = statsLoading || batchesLoading || (hasFilters && jobsLoading);
  const error = statsError;

  const handleExportReport = (format: 'csv' | 'excel') => {
    if (!filteredJobs || filteredJobs.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Preparar datos para exportación
    const exportData = filteredJobs.map((job: any) => {
      // Buscar deuda en diferentes lugares
      const deuda = job.deuda 
        || job.monto_total 
        || job.payload?.debt_amount 
        || job.payload?.deuda
        || job.payload?.monto_total
        || 0;
      
      // Buscar monto acordado en diferentes lugares
      const montoAcordado = job.monto_pago_cliente 
        || job.call_result?.summary?.collected_dynamic_variables?.monto_pago_cliente
        || 0;
      
      // Convertir a número si es string
      const deudaNum = typeof deuda === 'string' ? parseFloat(deuda) || 0 : deuda;
      const acordadoNum = typeof montoAcordado === 'string' ? parseFloat(montoAcordado) || 0 : montoAcordado;
      const faltante = deudaNum - acordadoNum;
      
      return {
        'ID Job': job.job_id || '',
        'ID Lote': job.batch_id || '',
        'Nombre Lote': batches?.find(b => b.batch_id === job.batch_id)?.name || 'N/A',
        'Nombre': job.nombre || job.contact?.name || 'N/A',
        'RUT': job.rut || job.rut_fmt || job.contact?.dni || 'N/A',
        'Teléfono': job.to_number || job.contact?.phones?.[0] || 'N/A',
        'Estado': job.status || 'N/A',
        'Deuda': deudaNum.toFixed(2),
        'Monto Acordado': acordadoNum.toFixed(2),
        'Faltante': faltante.toFixed(2),
        'Fecha Compromiso': job.fecha_pago_cliente || 'N/A',
        'Duración (seg)': job.call_duration_seconds || 0,
        'Costo': (job.call_result?.summary?.call_cost?.combined_cost || 0).toFixed(4),
        'Intentos': job.attempts || 0,
        'Fecha Creación': job.created_at ? new Date(job.created_at).toLocaleString('es-CL') : 'N/A',
        'Fecha Inicio': job.call_started_at ? new Date(job.call_started_at).toLocaleString('es-CL') : 'N/A',
        'Fecha Fin': job.call_ended_at || job.finished_at ? new Date(job.call_ended_at || job.finished_at).toLocaleString('es-CL') : 'N/A',
        'Sentimiento': job.call_result?.summary?.call_analysis?.user_sentiment || 'N/A',
        'Resumen': (job.call_result?.summary?.call_analysis?.call_summary || 'N/A').replace(/[\n\r]/g, ' ').substring(0, 200),
        'URL Grabación': job.call_result?.summary?.recording_url || 'N/A',
      };
    });

    if (format === 'csv') {
      // Generar CSV
      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => {
            const value = row[header as keyof typeof row];
            // Escapar comas y comillas
            const stringValue = String(value).replace(/"/g, '""');
            return `"${stringValue}"`;
          }).join(',')
        )
      ].join('\n');

      // Añadir BOM para Excel
      const BOM = '\uFEFF';
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // Generar Excel (formato HTML que Excel puede abrir)
      const headers = Object.keys(exportData[0]);
      const htmlContent = `
        <html xmlns:x="urn:schemas-microsoft-com:office:excel">
        <head>
          <meta charset="UTF-8">
          <style>
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #4CAF50; color: white; }
          </style>
        </head>
        <body>
          <table>
            <thead>
              <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${exportData.map(row => 
                `<tr>${headers.map(h => `<td>${row[h as keyof typeof row]}</td>`).join('')}</tr>`
              ).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;

      const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte_${new Date().toISOString().split('T')[0]}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Calcular estadísticas basadas en filtros
  const filteredStats = useMemo(() => {
    if (!hasFilters || !filteredJobs) {
      // Sin filtros, usar estadísticas globales
      return {
        totalCalls: stats?.total_jobs || 0,
        successfulCalls: stats?.completed_jobs || 0,
        failedCalls: stats?.failed_jobs || 0,
      };
    }

    // Con filtros, calcular desde los jobs filtrados
    let jobs = filteredJobs;

    // Filtrar por rango de fechas si está especificado
    if (dateRange.from || dateRange.to) {
      jobs = jobs.filter((job: any) => {
        const jobDate = new Date(job.created_at);
        const fromDate = dateRange.from ? new Date(dateRange.from) : null;
        const toDate = dateRange.to ? new Date(dateRange.to) : null;

        if (fromDate && jobDate < fromDate) return false;
        if (toDate && jobDate > toDate) return false;
        return true;
      });
    }

    const totalCalls = jobs.length;
    const successfulCalls = jobs.filter(
      (job: any) => job.status === 'completed' || job.status === 'done'
    ).length;
    const failedCalls = jobs.filter((job: any) => job.status === 'failed').length;

    return { totalCalls, successfulCalls, failedCalls };
  }, [hasFilters, filteredJobs, stats, dateRange]);

  const totalCalls = filteredStats.totalCalls;
  const successfulCalls = filteredStats.successfulCalls;
  const failedCalls = filteredStats.failedCalls;
  const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : 0;

  // Preparar datos para gráficos
  const chartData = useMemo(() => {
    if (!filteredJobs || filteredJobs.length === 0) {
      return { byDay: [], byStatus: [] };
    }

    // Agrupar llamadas por día
    const callsByDay: { [key: string]: number } = {};
    filteredJobs.forEach((job: any) => {
      const date = new Date(job.created_at).toLocaleDateString('es-CL', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      callsByDay[date] = (callsByDay[date] || 0) + 1;
    });

    const byDayData = Object.entries(callsByDay)
      .map(([date, count]) => ({ date, llamadas: count }))
      .sort((a, b) => {
        const [dayA, monthA] = a.date.split('/');
        const [dayB, monthB] = b.date.split('/');
        return new Date(`2025-${monthA}-${dayA}`).getTime() - new Date(`2025-${monthB}-${dayB}`).getTime();
      });

    // Agrupar por estado
    const statusCounts: { [key: string]: number } = {};
    filteredJobs.forEach((job: any) => {
      const status = job.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusLabels: { [key: string]: string } = {
      'completed': 'Completadas',
      'done': 'Completadas',
      'failed': 'Fallidas',
      'pending': 'Pendientes',
      'in_progress': 'En progreso',
      'cancelled': 'Canceladas'
    };

    const byStatusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
      status: status
    }));

    return { byDay: byDayData, byStatus: byStatusData };
  }, [filteredJobs]);

  // Calcular totales por batch
  const batchTotals = useMemo(() => {
    if (!filteredJobs || filteredJobs.length === 0) {
      return [];
    }

    const totalsMap: { [batchId: string]: { 
      batchId: string;
      batchName: string;
      totalDeuda: number;
      totalAcordado: number;
      totalFaltante: number;
      jobCount: number;
    } } = {};

    filteredJobs.forEach((job: any) => {
      const batchId = job.batch_id;
      if (!batchId) return;

      if (!totalsMap[batchId]) {
        totalsMap[batchId] = {
          batchId,
          batchName: batches?.find(b => b.batch_id === batchId)?.name || batchId,
          totalDeuda: 0,
          totalAcordado: 0,
          totalFaltante: 0,
          jobCount: 0
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
        || job.call_result?.summary?.collected_dynamic_variables?.monto_pago_cliente
        || 0;
      
      // Convertir a número si es string
      const deudaNum = typeof deuda === 'string' ? parseFloat(deuda) || 0 : deuda;
      const acordadoNum = typeof acordado === 'string' ? parseFloat(acordado) || 0 : acordado;
      
      totalsMap[batchId].totalDeuda += deudaNum;
      totalsMap[batchId].totalAcordado += acordadoNum;
      totalsMap[batchId].totalFaltante += (deudaNum - acordadoNum);
      totalsMap[batchId].jobCount++;
    });

    return Object.values(totalsMap);
  }, [filteredJobs, batches]);

  // Colores para el gráfico de torta
  const COLORS = {
    'completed': '#10b981',
    'done': '#10b981',
    'failed': '#ef4444',
    'pending': '#f59e0b',
    'in_progress': '#3b82f6',
    'cancelled': '#6b7280'
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
        <div className="flex">
          <XCircle className="h-5 w-5 text-red-400 mr-2" />
          <p className="text-red-800">Error al cargar los reportes: {error.toString()}</p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas desde datos reales
  // const totalCalls = stats?.total_jobs || 0;
  // const successfulCalls = stats?.completed_jobs || 0;
  // const failedCalls = stats?.failed_jobs || 0;
  // const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Análisis detallado de tus campañas y llamadas
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => handleExportReport('csv')}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exportar CSV</span>
          </Button>
          <Button
            variant="primary"
            onClick={() => handleExportReport('excel')}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
          >
            <Download className="h-4 w-4" />
            <span>Exportar Excel</span>
          </Button>
        </div>
      </div>

      {/* Banner informativo si no hay datos del backend */}
      {!stats && !isLoading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Datos de ejemplo</h3>
              <p className="text-sm text-yellow-700 mt-1">
                No se pudo conectar con el backend. Mostrando datos de ejemplo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lote
            </label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los lotes</option>
              {batches?.map((batch) => (
                <option key={batch.batch_id} value={batch.batch_id}>
                  {batch.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha desde
            </label>
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha hasta
            </label>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Llamadas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {totalCalls.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Phone className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Llamadas Exitosas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {successfulCalls.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Llamadas Fallidas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {failedCalls.toLocaleString()}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <XCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tasa de Éxito</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {successRate}%
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Totales por Batch */}
      {batchTotals.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Resumen Financiero por Campaña</h3>
            <p className="text-sm text-gray-600 mt-1">Deuda total, monto acordado y saldo pendiente por lote</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaña
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Llamadas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deuda Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Acordado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faltante
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Recuperado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {batchTotals.map((batch) => {
                  const porcentajeRecuperado = batch.totalDeuda > 0 
                    ? ((batch.totalAcordado / batch.totalDeuda) * 100).toFixed(1)
                    : '0.0';
                  
                  return (
                    <tr key={batch.batchId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{batch.batchName}</div>
                        <div className="text-xs text-gray-500">{batch.batchId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {batch.jobCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        ${batch.totalDeuda.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-green-600">
                        ${batch.totalAcordado.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-red-600">
                        ${batch.totalFaltante.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          parseFloat(porcentajeRecuperado) >= 80 ? 'bg-green-100 text-green-800' :
                          parseFloat(porcentajeRecuperado) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {porcentajeRecuperado}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {/* Fila de totales */}
                <tr className="bg-gray-100 font-bold">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    {batchTotals.reduce((sum, b) => sum + b.jobCount, 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    ${batchTotals.reduce((sum, b) => sum + b.totalDeuda, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                    ${batchTotals.reduce((sum, b) => sum + b.totalAcordado, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                    ${batchTotals.reduce((sum, b) => sum + b.totalFaltante, 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {(() => {
                        const totalDeuda = batchTotals.reduce((sum, b) => sum + b.totalDeuda, 0);
                        const totalAcordado = batchTotals.reduce((sum, b) => sum + b.totalAcordado, 0);
                        return totalDeuda > 0 ? ((totalAcordado / totalDeuda) * 100).toFixed(1) : '0.0';
                      })()}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Llamadas por Día
          </h3>
          {chartData.byDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="llamadas" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Llamadas"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay datos para mostrar</p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Distribución de Estados
          </h3>
          {chartData.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.byStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry: any) => `${entry.name}: ${(entry.percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.byStatus.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.status as keyof typeof COLORS] || '#6b7280'} 
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No hay datos para mostrar</p>
            </div>
          )}
        </div>
      </div>

      {/* Campañas Activas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Campañas Activas
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Campaña
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contactos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completadas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progreso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha Creación
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches && batches.length > 0 ? (
                batches.slice(0, 10).map((batch) => {
                  const totalContacts = batch.stats?.total_contacts || 0;
                  const completed = batch.stats?.calls_completed || 0;
                  const progress = totalContacts > 0 ? Math.round((completed / totalContacts) * 100) : 0;
                  
                  return (
                    <tr key={batch.batch_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{batch.name}</div>
                        <div className="text-sm text-gray-500">{batch.description || 'Sin descripción'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          batch.status === 'RUNNING' 
                            ? 'bg-green-100 text-green-800'
                            : batch.status === 'PAUSED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : batch.status === 'COMPLETED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {totalContacts}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {completed}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all" 
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(batch.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay campañas disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};