import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { 
  LayoutDashboard, 
  Building2, 
  Megaphone, 
  Phone, 
  BarChart3, 
  Code2,
  LogOut,
  User
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Cuentas', href: '/accounts', icon: Building2 },
    { name: 'Campañas', href: '/batches', icon: Megaphone },
    { name: 'Llamadas', href: '/jobs', icon: Phone },
    { name: 'Reportes', href: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo con efecto de iluminación */}
            <div className="flex items-center group">
              <div className="relative">
                {/* Efecto de iluminación de fondo */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-lg blur-lg opacity-0 group-hover:opacity-70 transition-all duration-500 scale-125"></div>
                
                {/* Logo */}
                <div className="relative">
                  <img 
                    src="/logo.svg" 
                    alt="SpeechAI Campaign Manager" 
                    className="h-8 w-auto relative z-10 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              {/* Test API Button */}
              <button
                onClick={() => navigate('/test-api')}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 group relative"
                title="Test API"
              >
                <Code2 className="h-5 w-5" />
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Test API
                </span>
              </button>

              <div className="flex items-center space-x-2 bg-gray-50 rounded-full px-4 py-2 border border-gray-200">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm text-gray-700 font-medium">
                  {user?.name || user?.email}
                </span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white/80 backdrop-blur-sm shadow-sm border-r border-gray-200 min-h-[calc(100vh-4rem)] sticky top-16">
          <div className="p-4">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <NavLink
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }`
                      }
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};