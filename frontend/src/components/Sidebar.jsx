import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingCart, 
  FileText, 
  Settings,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';
import { useState } from 'react';
import { useTema } from '../context/ThemeContext';

const menuItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/clientes', label: 'Clientes', icon: Users },
  { path: '/pedidos', label: 'Pedidos', icon: ShoppingCart },
  { path: '/facturas', label: 'Facturas', icon: FileText },
  { path: '/configuracion', label: 'Configuración', icon: Settings },
];

export default function Sidebar() {
  const [colapsado, setColapsado] = useState(false);
  const { tema, alternarTema } = useTema();

  return (
    <aside className={`bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${colapsado ? 'w-20' : 'w-64'} fixed h-full z-40 border-r border-gray-200 dark:border-gray-700`}>
      {/* Header del Sidebar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!colapsado && (
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 p-2 rounded-lg">
              <span className="text-white text-xl">📊</span>
            </div>
            <span className="text-xl font-bold text-gray-800 dark:text-white">ReDTF</span>
          </div>
        )}
        <button
          onClick={() => setColapsado(!colapsado)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition"
        >
          {colapsado ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Menú de navegación */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${colapsado ? 'justify-center' : ''}`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!colapsado && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Toggle de tema */}
      <div className="absolute bottom-16 left-0 right-0 px-4">
        <button
          onClick={alternarTema}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition ${
            colapsado ? 'justify-center' : ''
          } bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600`}
          title={tema === 'claro' ? 'Activar modo oscuro' : 'Activar modo claro'}
        >
          {tema === 'claro' ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
          {!colapsado && <span className="font-medium">{tema === 'claro' ? 'Modo Oscuro' : 'Modo Claro'}</span>}
        </button>
      </div>

      {/* Footer del Sidebar */}
      {!colapsado && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">v0.4.0</p>
        </div>
      )}
    </aside>
  );
}