import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceDot
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
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">📈 Predicción de Ventas</h2>
        <div className="text-center text-gray-500 py-10">Cargando predicción...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">📈 Predicción de Ventas</h2>
        <div className="text-center text-red-500 py-10">
          {error.response?.data?.detail || 'No hay suficientes datos para predecir'}
        </div>
      </div>
    );
  }

  // Preparar datos para el gráfico
  const chartData = data.historial.map(item => ({
    mes: item.mes,
    ventas: item.total,
    tipo: 'histórico'
  }));

  // Agregar punto de predicción
  const prediccionData = [
    ...chartData,
    {
      mes: 'Próximo mes',
      ventas: data.prediccion_proximo_mes,
      tipo: 'predicción'
    }
  ];

  // Determinar color e icono según tendencia
  const tendenciaConfig = {
    'Alza 📈': { color: 'text-green-600', bg: 'bg-green-100', icon: TrendingUp, label: 'Alza' },
    'Baja 📉': { color: 'text-red-600', bg: 'bg-red-100', icon: TrendingDown, label: 'Baja' },
    'Estable ➡️': { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Minus, label: 'Estable' }
  };

  const config = tendenciaConfig[data.tendencia_actual] || tendenciaConfig['Estable ➡️'];
  const TendenciaIcon = config.icon;

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">📈 Predicción de Ventas</h2>
        <div className={`${config.bg} ${config.color} px-3 py-1 rounded-full flex items-center gap-2 text-sm font-medium`}>
          <TendenciaIcon className="w-4 h-4" />
          {config.label}
        </div>
      </div>

      {/* KPI de predicción */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">Ventas proyectadas próximo mes</p>
        <p className="text-3xl font-bold text-blue-600">${data.prediccion_proximo_mes.toFixed(2)}</p>
        <p className="text-xs text-gray-500 mt-1">Basado en Regresión Lineal (Scikit-Learn)</p>
      </div>

      {/* Gráfico */}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={prediccionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="mes" stroke="#6b7280" style={{ fontSize: '12px' }} />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
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

      {/* Leyenda */}
      <div className="flex justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-gray-600">Histórico</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-gray-600">Predicción</span>
        </div>
      </div>
    </div>
  );
}