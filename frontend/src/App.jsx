import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import ClientesPage from './pages/ClientesPage';
import OrdenesPage from './pages/OrdenesPage';
import ConfiguracionPage from './pages/COnfiguracionPage';
import AuditoriaPage from './pages/AuditoriaPage';
import EquipoPage from './pages/EquipoPage';
import Login from './components/login';
import { LogOut, ShieldAlert, Sparkles } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
});

function SinPermiso({ rol }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-400/40 mb-4">
        <ShieldAlert className="w-10 h-10 text-rose-500" />
      </div>
      <h2 className="text-xl font-bold text-slate-800 dark:text-white">Acceso restringido</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Esta sección requiere rol <b>{rol}</b>. Tu sesión actual no lo posee.
      </p>
      <button
        onClick={() => window.history.back()}
        className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold text-violet-600 dark:text-violet-300 bg-violet-500/10 border border-violet-400/40 hover:bg-violet-500/20 transition"
      >
        Volver
      </button>
    </div>
  );
}

function RequiereRol({ rol, children }) {
  const { rol: rolUsuario } = useAuth();
  if (rol && rolUsuario !== rol) return <SinPermiso rol={rol} />;
  return children;
}

function Cargando() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-lg shadow-violet-500/40 animate-pulse">
          <Sparkles className="w-7 h-7" />
        </div>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando sistema…</p>
      </div>
    </div>
  );
}

function AppContent() {
  const { usuario, rol, logout, loading } = useAuth();

  if (loading) return <Cargando />;
  if (!usuario) return <Login />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-end gap-3 px-4 sm:px-6 lg:px-8 py-3 bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border-b border-slate-200/70 dark:border-gray-700/70">
          <span className="hidden sm:inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-300 bg-fuchsia-500/10 border border-fuchsia-400/30">
            {usuario.correo || usuario.email} · {rol}
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-rose-500/25 hover:brightness-110 transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/clientes" element={<ClientesPage />} />
            <Route path="/ordenes" element={<OrdenesPage />} />
            <Route path="/auditoria" element={<RequiereRol rol="admin"><AuditoriaPage /></RequiereRol>} />
            <Route path="/equipo" element={<RequiereRol rol="admin"><EquipoPage /></RequiereRol>} />
            <Route path="/configuracion" element={<RequiereRol rol="admin"><ConfiguracionPage /></RequiereRol>} />
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