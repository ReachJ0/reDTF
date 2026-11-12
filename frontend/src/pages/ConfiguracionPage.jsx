import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { DollarSign, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function ConfiguracionPage() {
  const { usuario } = useAuth();
  const queryClient = useQueryClient();
  const [precio, setPrecio] = useState('');
  const [mensaje, setMensaje] = useState(null);

  // Cargar tarifas existentes
  const { data: tarifas, isLoading } = useQuery({
    queryKey: ['tarifas'],
    queryFn: async () => {
      const response = await api.get('/tarifas/');
      return response.data;
    },
  });

  // Mutación para actualizar precio
  const actualizarPrecioMutation = useMutation({
    mutationFn: async ({ id_tarif, nuevo_precio }) => {
      const response = await api.put(`/tarifas/${id_tarif}`, {
        pre_tarif: parseFloat(nuevo_precio)
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['tarifas']);
      setMensaje({ tipo: 'success', texto: '✅ Precio actualizado correctamente' });
      setTimeout(() => setMensaje(null), 3000);
    },
    onError: (error) => {
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Error: ${error.response?.data?.detail || 'No se pudo actualizar'}` 
      });
    },
  });

  const handleActualizarPrecio = (id_tarif) => {
    if (!precio || parseFloat(precio) <= 0) {
      setMensaje({ tipo: 'error', texto: '❌ Ingresa un precio válido' });
      return;
    }
    actualizarPrecioMutation.mutate({ id_tarif, nuevo_precio: precio });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">⚙️ Configuración</h1>
      
      {/* Información del Usuario */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 mb-6 transition-colors">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Información del Usuario</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-500 dark:text-gray-400">Email</label>
            <p className="text-gray-800 dark:text-white font-medium">{usuario?.email || 'No disponible'}</p>
          </div>
        </div>
      </div>

      {/* Gestión de Precios */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-500 p-3 rounded-lg">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Gestión de Precios</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modifica el precio por metro cuadrado</p>
          </div>
        </div>

        {/* Mensaje de feedback */}
        {mensaje && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            mensaje.tipo === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800' 
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
          }`}>
            {mensaje.tipo === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm">{mensaje.texto}</span>
          </div>
        )}

        {/* Lista de tarifas */}
        <div className="space-y-4">
          {tarifas?.map((tarifa) => (
            <div key={tarifa.id_tarif} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white">{tarifa.tam_tarif}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Precio actual: <span className="font-bold text-green-600 dark:text-green-400">${tarifa.pre_tarif.toFixed(2)} / m²</span>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Nuevo precio"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                />
                <button
                  onClick={() => handleActualizarPrecio(tarifa.id_tarif)}
                  disabled={actualizarPrecioMutation.isLoading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition disabled:bg-gray-400"
                >
                  {actualizarPrecioMutation.isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Actualizar
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {tarifas?.length === 0 && (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            No hay tarifas configuradas
          </div>
        )}
      </div>
    </div>
  );
}