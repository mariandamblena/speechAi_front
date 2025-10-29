import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { AccountModel } from '@/types';
import { useAccountBatches, useAccountTransactions } from '@/services/queries';
import { useNavigate } from 'react-router-dom';

interface AccountDetailModalProps {
  account: AccountModel | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'batches' | 'transactions' | 'settings'>('info');
  const navigate = useNavigate();

  const { data: batches, isLoading: batchesLoading } = useAccountBatches(
    account?.account_id || '', 
    { enabled: !!account && activeTab === 'batches' }
  );

  const { data: transactions, isLoading: transactionsLoading } = useAccountTransactions(
    account?.account_id || '', 
    { enabled: !!account && activeTab === 'transactions' }
  );

  if (!account) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', { 
      style: 'currency', 
      currency: 'CLP' 
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'SUSPENDED':
        return 'bg-red-100 text-red-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const tabs = [
    { id: 'info', label: 'Información', icon: '📋' },
    { id: 'batches', label: 'Batches', icon: '📞' },
    { id: 'transactions', label: 'Transacciones', icon: '💰' },
    { id: 'settings', label: 'Configuración', icon: '⚙️' }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Cuenta: ${account.account_name}`} size="xl">
      <div className="space-y-6">
        {/* Header con estado y stats */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{account.account_name}</h3>
              <p className="text-sm text-gray-500 font-mono">ID: {account.account_id}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(account.status)}`}>
                {account.status === 'ACTIVE' ? 'Activa' : 
                 account.status === 'SUSPENDED' ? 'Suspendida' : 'Inactiva'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {(account.plan_type === 'credit_based' 
                  ? (account.balance?.credits || 0) 
                  : (account.balance?.minutes || 0)
                ).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">
                {account.plan_type === 'credit_based' ? 'Créditos' : 'Minutos'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {account.features.max_concurrent_calls}
              </div>
              <div className="text-sm text-gray-500">Llamadas Concurrentes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${(account.balance?.total_spent || 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-500">Gastado Total</div>
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
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Información de Contacto</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nombre de Contacto</dt>
                      <dd className="text-sm text-gray-900">{account.contact_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{account.contact_email}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Teléfono</dt>
                      <dd className="text-sm text-gray-900">{account.contact_phone || 'No especificado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha de Creación</dt>
                      <dd className="text-sm text-gray-900">{new Date(account.created_at).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Plan y Facturación</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo de Plan</dt>
                      <dd className="text-sm text-gray-900">
                        {account.plan_type === 'credit_based' ? 'Por Créditos' : 'Por Minutos'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Saldo Actual</dt>
                      <dd className="text-sm text-gray-900">
                        {account.plan_type === 'credit_based' 
                          ? `${(account.balance?.credits || 0).toFixed(2)} créditos`
                          : `${(account.balance?.minutes || 0).toFixed(2)} minutos`
                        }
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Gastado</dt>
                      <dd className="text-sm text-gray-900">${(account.balance?.total_spent || 0).toFixed(2)}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'batches' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">Batches de Llamadas</h4>
                <Button size="sm" variant="primary">
                  Nuevo Batch
                </Button>
              </div>

              {batchesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !batches || (Array.isArray(batches) && batches.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No hay batches creados para esta cuenta
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(batches) && batches.map((batch: any) => (
                    <button
                      key={batch._id}
                      onClick={() => {
                        onClose();
                        navigate('/batches', { state: { selectedBatchId: batch.batch_id } });
                      }}
                      className="w-full border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{batch.name}</h5>
                          <p className="text-sm text-gray-500">
                            {batch.total_jobs || 0} llamadas • Creado {new Date(batch.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            batch.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {batch.is_active ? 'Activa' : 'Pausada'}
                          </span>
                          <span className="text-blue-600">→</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <h4 className="text-lg font-medium text-gray-900 mb-4">Historial de Transacciones</h4>

              {transactionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !transactions || (Array.isArray(transactions) && transactions.length === 0) ? (
                <div className="text-center py-8 text-gray-500">
                  No hay transacciones registradas
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(transactions) && transactions.map((transaction: any) => (
                    <div key={transaction._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-gray-900">{transaction.description}</h5>
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.amount > 0 ? '+' : ''}{transaction.amount} 
                            {transaction.type === 'credits' ? ' créditos' : ' minutos'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatCurrency(transaction.cost || 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Configuraciones Generales</h4>
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Zona Horaria</label>
                      <div className="text-sm text-gray-900">{account.settings?.timezone || 'America/Santiago'}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">País</label>
                      <div className="text-sm text-gray-900">{account.country || 'Chile'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">Límites de Llamadas</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{account.features?.max_concurrent_calls || 5}</div>
                      <div className="text-sm text-gray-500">Llamadas Concurrentes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">—</div>
                      <div className="text-sm text-gray-500">Sin límite por hora</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">—</div>
                      <div className="text-sm text-gray-500">Sin límite por día</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button 
                  variant="secondary"
                  onClick={() => alert('Funcionalidad en desarrollo')}
                >
                  Editar Configuración
                </Button>
                <Button 
                  variant="primary"
                  onClick={() => {
                    if (confirm('¿Estás seguro de regenerar el token? El token actual dejará de funcionar.')) {
                      alert('Funcionalidad en desarrollo');
                    }
                  }}
                >
                  Regenerar Token API
                </Button>
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