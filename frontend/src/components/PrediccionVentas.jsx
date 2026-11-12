import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PrediccionVentas() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['prediccion'],
    queryFn: async () => {
      const response = await api.get('/analitica/prediccion-ventas');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">📈 Predicción de Ventas</h2>
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">Cargando predicción...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">📈 Predicción de Ventas</h2>
        <div className="text-center text-red-500 py-10">
          {error.response?.data?.detail || 'No hay suficientes datos para predecir'}
        </div>
      </div>
    );
  }

  const chartData = data.historial.map(item => ({
    mes: item.mes,
    ventas: item.total,
    tipo: 'histórico'
  }));

  const prediccionData = [
    ...chartData,
    {
      mes: 'Próximo mes',
      ventas: data.prediccion_proximo_mes,
      tipo: 'predicción'
    }
  ];

  const tendenciaConfig = {
    'Alza 📈': { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30', icon: TrendingUp, label: 'Alza' },
    'Baja 📉': { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30', icon: TrendingDown, label: 'Baja' },
    'Estable ➡️': { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-900/30', icon: Minus, label: 'Estable' }
  };

  const config = tendenciaConfig[data.tendencia_actual] || tendenciaConfig['Estable ➡️'];
  const TendenciaIcon = config.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">📈 Predicción de Ventas</h2>
        <div className={`${config.bg} ${config.color} px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium`}>
          <TendenciaIcon className="w-4 h-4" />
          {config.label}
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 mb-6 border border-blue-100 dark:border-blue-800/30">
        <p className="text-sm text-gray-600 dark:text-gray-400">Ventas proyectadas próximo mes</p>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">${data.prediccion_proximo_mes.toFixed(2)}</p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Basado en Regresión Lineal (Scikit-Learn)</p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={prediccionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#fff'
            }}
            formatter={(value) => [`$${value.toFixed(2)}`, 'Ventas']}
          />
          <Line
            type="monotone"
            dataKey="ventas"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (payload.tipo === 'predicción') {
                return (
                  <circle
                    key={`dot-${payload.mes}`}
                    cx={cx}
                    cy={cy}
                    r={6}
                    fill="#ef4444"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                );
              }
              return (
                <circle
                  key={`dot-${payload.mes}`}
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#3b82f6"
                />
              );
            }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Histórico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600 dark:text-gray-400">Predicción</span>
        </div>
      </div>
    </div>
  );
}