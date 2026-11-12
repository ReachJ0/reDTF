import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, Package, TrendingUp, Users, UserPlus } from 'lucide-react';
import PrediccionVentas from '../components/PrediccionVentas';
import FormularioCliente from '../components/FormularioCliente';
import TablaClientes from '../components/TablaClientes';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await api.get('/analitica/dashboard-general');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-gray-600 dark:text-gray-300">Cargando analíticas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-xl text-red-600">Error al cargar los datos</div>
      </div>
    );
  }

  const kpis = [
    { label: 'Ventas Totales', value: `$${data.ventas.total.toFixed(2)}`, icon: DollarSign, color: 'bg-blue-500' },
    { label: 'Promedio por Factura', value: `$${data.ventas.promedio_por_factura.toFixed(2)}`, icon: TrendingUp, color: 'bg-green-500' },
    { label: 'Material Consumido', value: `${data.material_estimado_consumido_m2.toFixed(2)} m²`, icon: Package, color: 'bg-orange-500' },
    { label: 'Top Clientes', value: data.top_clientes.length.toString(), icon: Users, color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Header de la página */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📊 Panel de Control</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Analítica en tiempo real de tu negocio DTF</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition shadow-md"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center space-x-4 border border-gray-200 dark:border-gray-700 transition-colors">
            <div className={`${kpi.color} p-3 rounded-lg`}>
              <kpi.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">🏆 Top Clientes</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.top_clientes}
                dataKey="total_gastado"
                nameKey="nombre"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={{ fill: '#6b7280' }}
              >
                {data.top_clientes.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">💰 Resumen de Ventas</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { nombre: 'Total', valor: data.ventas.total },
              { nombre: 'Promedio', valor: data.ventas.promedio_por_factura },
            ]}>
              <XAxis dataKey="nombre" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#fff'
                }} 
              />
              <Bar dataKey="valor" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predicción */}
      <div className="mt-6">
        <PrediccionVentas />
      </div>

      {/* Tabla de Clientes */}
      <div className="mt-6">
        <TablaClientes />
      </div>

      {/* Modal de formulario */}
      {mostrarFormulario && (
        <FormularioCliente
          onClose={() => setMostrarFormulario(false)}
          onClienteCreado={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}