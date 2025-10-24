import React, { useState } from 'react';
import { useAccounts, useCreateAccount, useUpdateAccount, useSuspendAccount, useActivateAccount, useToggleAccountStatus } from '@/services/queries';
import { AccountModel } from '@/types';
import { Button } from '@/components/ui/Button';
import { CreateAccountModal } from '@/components/accounts/CreateAccountModal';
import { AccountDetailModal } from '@/components/accounts/AccountDetailModal';
import { formatNumber, formatCredits, formatMinutes } from '@/utils/format';
import { Building2, Plus, Pause, Play, CheckCircle2, DollarSign } from 'lucide-react';

export const AccountsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountModel | null>(null);
  
  const { data: accounts, isLoading, error } = useAccounts();
  const createAccountMutation = useCreateAccount();
  const updateAccountMutation = useUpdateAccount();
  const suspendAccountMutation = useSuspendAccount();
  const activateAccountMutation = useActivateAccount();
  const toggleAccountStatusMutation = useToggleAccountStatus();

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

  const handleToggleAccountStatus = async (account: AccountModel) => {
    // Si está ACTIVE -> enviar false (para desactivar/suspender)
    // Si está SUSPENDED -> enviar true (para activar)
    const newIsActive = account.status !== 'ACTIVE';
    const action = newIsActive ? 'activar' : 'suspender';

    console.log('Toggle account status:', {
      accountId: account.account_id,
      currentStatus: account.status,
      newIsActive: newIsActive,
      action: action
    });

    try {
      await toggleAccountStatusMutation.mutateAsync({ 
        accountId: account.account_id, 
        isActive: newIsActive 
      });
      // No need to show alert, the UI will update automatically
    } catch (error: any) {
      console.error(`Error al ${action} cuenta:`, error);
      alert(`❌ Error al ${action} cuenta: ${error.response?.data?.detail || error.message}`);
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
          <h1 className="text-3xl font-bold text-gray-900">Cuentas de Empresa</h1>
          <p className="text-gray-600 mt-2 flex items-center">
            <Building2 className="h-4 w-4 mr-2" />
            Gestiona las cuentas de tus clientes, créditos y configuraciones
          </p>
        </div>
        <Button 
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
        >
          <Plus className="h-5 w-5" />
          <span>Nueva Cuenta</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Cuentas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {accounts?.length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Building2 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {accounts?.filter(acc => acc.status === 'ACTIVE').length || 0}
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
              <p className="text-sm font-medium text-gray-600">Suspendidas</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {accounts?.filter(acc => acc.status === 'SUSPENDED').length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <Pause className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Créditos Totales</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatNumber(accounts?.reduce((total, acc) => total + (acc.balance?.credits || 0), 0) || 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
              <DollarSign className="h-6 w-6 text-white" />
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
                          <button
                            onClick={() => handleToggleAccountStatus(account)}
                            disabled={toggleAccountStatusMutation.isPending}
                            title="Suspender cuenta"
                            className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : account.status === 'SUSPENDED' ? (
                          <button
                            onClick={() => handleToggleAccountStatus(account)}
                            disabled={toggleAccountStatusMutation.isPending}
                            title="Activar cuenta"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Play className="h-4 w-4" />
                          </button>
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