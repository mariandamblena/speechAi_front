import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Campañas', href: '/batches', icon: '📋' },
    { name: 'Llamadas', href: '/jobs', icon: '📞' },
    { name: 'Reportes', href: '/reports', icon: '📈' },
  ];

  const adminNavigation = [
    { name: 'Workers', href: '/workers', icon: '⚙️' },
    { name: 'Configuración', href: '/settings', icon: '🔧' },
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🤖</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">SpeechAI</h1>
                <p className="text-xs text-gray-500">Campaign Manager</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                  ${isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            ))}

            {user?.role === 'admin' && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Administración
                </div>
                {adminNavigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`
                      flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                      ${isActive(item.href)
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </>
            )}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="ml-2"
              >
                Salir
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {getPageTitle(location.pathname)}
                </h2>
                <p className="text-sm text-gray-500">
                  {getPageDescription(location.pathname)}
                </p>
              </div>
              
              {/* Quick actions */}
              <div className="flex items-center space-x-3">
                {location.pathname === '/batches' && (
                  <Link to="/batches/new">
                    <Button>
                      ➕ Nueva Campaña
                    </Button>
                  </Link>
                )}
                
                {/* Connection status indicator would go here */}
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-gray-500">Conectado</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/batches': 'Campañas',
    '/batches/new': 'Nueva Campaña',
    '/jobs': 'Llamadas',
    '/reports': 'Reportes',
    '/workers': 'Workers',
    '/settings': 'Configuración',
  };

  // Handle dynamic routes
  if (pathname.startsWith('/batches/') && pathname !== '/batches/new') {
    return 'Detalle de Campaña';
  }
  if (pathname.startsWith('/jobs/')) {
    return 'Detalle de Llamada';
  }

  return titles[pathname] || 'SpeechAI';
}

function getPageDescription(pathname: string): string {
  const descriptions: Record<string, string> = {
    '/dashboard': 'Resumen general del sistema',
    '/batches': 'Gestión de campañas de llamadas',
    '/batches/new': 'Crear nueva campaña desde Excel',
    '/jobs': 'Monitoreo de llamadas en tiempo real',
    '/reports': 'Generar y descargar reportes',
    '/workers': 'Estado y control de workers',
    '/settings': 'Configuración del sistema',
  };

  if (pathname.startsWith('/batches/') && pathname !== '/batches/new') {
    return 'Información, contactos y estadísticas';
  }
  if (pathname.startsWith('/jobs/')) {
    return 'Transcripción, análisis y acciones';
  }

  return descriptions[pathname] || '';
}