import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Trash2, Search, Users } from 'lucide-react';
import { useState } from 'react';

export default function TablaClientes() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');

  const { data: clientes, isLoading, error } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => {
      const response = await api.get('/clientes/');
      return response.data;
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id_cli) => {
      await api.delete(`/clientes/${id_cli}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['clientes']);
    },
    onError: (error) => {
      alert('Error al eliminar cliente: ' + (error.response?.data?.detail || 'Error desconocido'));
    },
  });

  const handleEliminar = (id_cli, nombre) => {
    if (window.confirm(`¿Estás seguro de eliminar a "${nombre}"?`)) {
      eliminarMutation.mutate(id_cli);
    }
  };

  const clientesFiltrados = clientes?.filter(cliente =>
    cliente.nombre_user.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.telf_user.includes(busqueda)
  ) || [];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">Cargando clientes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-red-500 py-10">Error al cargar clientes</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-purple-500 p-3 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Lista de Clientes</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{clientesFiltrados.length} clientes registrados</p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o teléfono..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tabla */}
      {clientesFiltrados.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          {busqueda ? 'No se encontraron clientes con esa búsqueda' : 'No hay clientes registrados'}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Nombre</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Teléfono</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Usuario ID</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientesFiltrados.map((cliente, index) => (
                <tr
                  key={cliente.id_cli}
                  className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                    index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                  }`}
                >
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{cliente.id_cli}</td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white">{cliente.nombre_user}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{cliente.telf_user}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                    {cliente.id_user_Usuarios || <span className="text-gray-400">-</span>}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleEliminar(cliente.id_cli, cliente.nombre_user)}
                      disabled={eliminarMutation.isLoading}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition disabled:opacity-50"
                      title="Eliminar cliente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}