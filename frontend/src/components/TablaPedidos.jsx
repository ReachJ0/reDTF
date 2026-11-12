import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Trash2, Search, ShoppingCart, Edit2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useState } from 'react';

const estados = {
  1: { nombre: 'Pendiente', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', icon: Clock },
  2: { nombre: 'En proceso', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', icon: Edit2 },
  3: { nombre: 'Completado', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', icon: CheckCircle },
  4: { nombre: 'Cancelado', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', icon: XCircle }
};

export default function TablaPedidos() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');

  const { data: pedidos, isLoading, error } = useQuery({
    queryKey: ['pedidos'],
    queryFn: async () => {
      const response = await api.get('/pedidos/');
      return response.data;
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id_order) => {
      await api.delete(`/pedidos/${id_order}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pedidos']);
    },
  });

  const handleEliminar = (id_order) => {
    if (window.confirm(`¿Eliminar pedido #${id_order}?`)) {
      eliminarMutation.mutate(id_order);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">Cargando pedidos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-red-500 py-10">Error al cargar pedidos</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500 p-3 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Lista de Pedidos</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{pedidos?.length || 0} pedidos registrados</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
          />
        </div>
      </div>

      {!pedidos || pedidos.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">
          No hay pedidos registrados
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Factura</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Tarifa</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Dimensiones</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Cantidad</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Subtotal</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pedidos
                .filter(p => !busqueda || p.id_order.toString().includes(busqueda))
                .map((pedido, index) => {
                  const estado = estados[pedido.id_esta] || estados[1];
                  const EstadoIcon = estado.icon;
                  
                  // ✅ Convertir a número antes de usar toFixed
                  const subTotal = Number(pedido.sub_order || 0);
                  const larcm = Number(pedido.larcm_order || 0);
                  const ancm = Number(pedido.ancm_order || 0);
                  const can = Number(pedido.can_order || 0);
                  const m2 = (larcm * ancm * can) / 10000;
                  
                  return (
                    <tr
                      key={pedido.id_order}
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white">#{pedido.id_order}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">#{pedido.id_fac}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">#{pedido.id_tarif}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {larcm} × {ancm} cm
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{can}</td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400">
                        ${subTotal.toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${estado.color}`}>
                          <EstadoIcon className="w-3 h-3" />
                          {estado.nombre}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleEliminar(pedido.id_order)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition"
                          title="Eliminar pedido"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}