import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import OrdenesPage from './pages/OrdenesPage';
import ConfiguracionPage from './pages/COnfiguracionPage';
import Login from './components/login';
import { LogOut } from 'lucide-react';

const queryClient = new QueryClient();

function AppContent() {
  const { usuario, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-300">Cargando sistema...</div>
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar />

      <div className="flex-1 ml-64">
        <header className="bg-white dark:bg-gray-800 shadow-sm p-4 flex justify-end sticky top-0 z-30 border-b border-gray-200 dark:border-gray-700 transition-colors">
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </header>

        <main className="p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/ordenes" element={<OrdenesPage />} />
            <Route path="/configuracion" element={<ConfiguracionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;