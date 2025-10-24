import React, { useState } from 'react';
import { useAccounts, useCreateAccount, useUpdateAccount, useSuspendAccount, useActivateAccount } from '@/services/queries';
import { AccountModel } from '@/types';
import { Button } from '@/components/ui/Button';
import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { AccountDetailModal } from '@/components/accounts/AccountDetailModal';
import { formatNumber, formatCredits, formatMinutes } from '@/utils/format';

export const AccountsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountModel | null>(null);
  
  const { data: accounts, isLoading, error } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const suspendAccountMutation = useSuspendAccount();
  const activateAccountMutation = useActivateAccount();

  const handleCreateAccount = async (accountData: any) => {
    try {
      console.log('🚀 Intentando crear cuenta con:', accountData);
      await createAccountMutation.mutateAsync(accountData);
      setShowCreateModal(false);
    } catch (error: any) {
      console.error('❌ Error creating account:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Mostrar el error al usuario
      alert(`Error al crear cuenta: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleSuspendAccount = async (accountId: string, reason: string) => {
    try {
      await suspendAccountMutation.mutateAsync({ accountId, reason });
    } catch (error) {
      console.error('Error suspending account:', error);
    }
  };

  const handleActivateAccount = async (accountId: string) => {
    try {
      await activateAccountMutation.mutateAsync(accountId);
    } catch (error) {
      console.error('Error activating account:', error);
    }
  };

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
        Error cargando cuentas: {error.toString()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cuentas de Empresa</h1>
          <p className="text-gray-500 mt-1">
            Gestiona las cuentas de tus clientes, créditos y configuraciones
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="mr-2">+</span>
          Nueva Cuenta
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600">🏢</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Cuentas
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {accounts?.length || 0}
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
                  Activas
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {accounts?.filter(acc => acc.status === 'ACTIVE').length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600">⏸️</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Suspendidas
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {accounts?.filter(acc => acc.status === 'SUSPENDED').length || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600">💰</span>
              </div>
            </div>
            <div className="ml-5">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Créditos Totales
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {formatNumber(accounts?.reduce((total, acc) => total + (acc.balance?.credits || 0), 0) || 0)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lista de Cuentas</h3>
        </div>
        
        {!accounts || accounts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No hay cuentas registradas. Crea la primera cuenta para comenzar.
          </div>
        ) : (
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saldo
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
                {accounts.map((account) => (
                  <tr key={account._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {account.account_name}
                        </div>
                        <div className="text-sm text-gray-500 font-mono">
                          ID: {account.account_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        account.plan_type === 'credit_based' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {account.plan_type === 'credit_based' ? 'Por Créditos' : 'Por Minutos'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {account.plan_type === 'credit_based' ? (
                          <span className="font-medium">{formatCredits(account.balance?.credits || 0)}</span>
                        ) : (
                          <span className="font-medium">{formatMinutes(account.balance?.minutes || 0)}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                        {account.status === 'ACTIVE' ? 'Activa' : 
                         account.status === 'SUSPENDED' ? 'Suspendida' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(account.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="secondary"
                          onClick={() => setSelectedAccount(account)}
                        >
                          Ver Detalle
                        </Button>
                        {account.status === 'ACTIVE' ? (
                          <Button 
                            size="sm" 
                            variant="danger"
                            onClick={() => handleSuspendAccount(account.account_id, 'Suspensión manual')}
                            disabled={suspendAccountMutation.isPending}
                          >
                            Suspender
                          </Button>
                        ) : account.status === 'SUSPENDED' ? (
                          <Button 
                            size="sm" 
                            variant="primary"
                            onClick={() => handleActivateAccount(account.account_id)}
                            disabled={activateAccountMutation.isPending}
                          >
                            Activar
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateAccountModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAccount}
        isLoading={createAccountMutation.isPending}
      />

      <AccountDetailModal
        account={selectedAccount}
        isOpen={selectedAccount !== null}
        onClose={() => setSelectedAccount(null)}
      />
    </div>
  );
};