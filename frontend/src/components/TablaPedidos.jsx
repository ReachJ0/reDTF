import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { 
  Trash2, Search, ShoppingCart, ChevronDown, 
  Clock, RefreshCw, AlertTriangle, Package 
} from 'lucide-react';

const estilosEstado = {
  'Pendiente':    { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: Clock },
  'Imprimiendo':  { color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800', icon: RefreshCw },
  'En Revision':  { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800', icon: AlertTriangle },
  'Entregado':    { color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800', icon: Package },
  'default':      { color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', icon: Clock }
};

export default function TablaPedidos() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [error, setError] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);

  const { data: estadosBD } = useQuery({
    queryKey: ['estadosPedidos'],
    queryFn: async () => {
      const response = await api.get('/pedidos/estados/');
      return response.data;
    },
  });

  useEffect(() => {
    const handleClickOutside = () => setMenuAbierto(null);
    if (menuAbierto) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [menuAbierto]);

  const { data: pedidos, isLoading } = useQuery({
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
    onSuccess: () => queryClient.invalidateQueries(['pedidos']),
    onError: (err) => {
      setError(`❌ Error: ${err.response?.data?.detail || 'Error desconocido'}`);
      setTimeout(() => setError(null), 3000);
    },
  });

  const actualizarEstadoMutation = useMutation({
    mutationFn: async ({ id_order, id_estado }) => {
      await api.put(`/pedidos/${id_order}`, { id_estado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['pedidos']);
      setError(null);
    },
    onError: (err) => {
      setError(`❌ Error: ${err.response?.data?.detail || 'No se pudo cambiar'}`);
      setTimeout(() => setError(null), 4000);
    },
  });

  const handleEliminar = (e, id_order) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar pedido #${id_order}?`)) {
      eliminarMutation.mutate(id_order);
    }
  };

  const handleCambiarEstado = (e, id_order, nuevoEstado) => {
    e.stopPropagation();
    actualizarEstadoMutation.mutate({ id_order, id_estado: parseInt(nuevoEstado) });
    setMenuAbierto(null);
  };

  const getEstilo = (nombreEstado) => estilosEstado[nombreEstado] || estilosEstado['default'];

  const pedidosFiltrados = pedidos?.filter(p => {
    const coincideBusqueda = !busqueda || 
      p.id_order.toString().includes(busqueda) ||
      p.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = !filtroEstado || p.id_estado === parseInt(filtroEstado);
    return coincideBusqueda && coincideEstado;
  }) || [];

  const totalPedidos = pedidosFiltrados.length;
  const totalMonto = pedidosFiltrados.reduce((sum, p) => sum + Number(p.sub_order || 0), 0);
  const totalM2 = pedidosFiltrados.reduce((sum, p) => sum + Number(p.m2_total || 0), 0);
  const pendientes = pedidosFiltrados.filter(p => p.nom_estado === 'Pendiente').length;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">Cargando pedidos...</div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* KPIs de Pedidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Pedidos</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalPedidos}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Ingresos</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${totalMonto.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Material (m²)</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalM2.toFixed(2)} m²</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendientes}</p>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Lista de Pedidos</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{pedidosFiltrados.length} pedidos</p>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por ID o cliente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Todos los estados</option>
              {estadosBD?.map(estado => (
                <option key={estado.id_estado} value={estado.id_estado}>
                  {estado.nom_estado}
                </option>
              ))}
            </select>
          </div>
        </div>

        {pedidosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            {busqueda || filtroEstado ? 'No se encontraron pedidos' : 'No hay pedidos registrados'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Tarifa</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Dimensiones</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Cant.</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">m²</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Subtotal</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map((pedido, index) => {
                  const estilo = getEstilo(pedido.nom_estado);
                  const EstadoIcon = estilo.icon;
                  const estaCargando = actualizarEstadoMutation.isLoading && actualizarEstadoMutation.variables?.id_order === pedido.id_order;
                  
                  return (
                    <tr
                      key={pedido.id_order}
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white">#{pedido.id_order}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{pedido.nombre_cliente || 'N/A'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{pedido.tam_tarif || '-'}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {pedido.larcm_order} × {pedido.ancm_order} cm
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{pedido.can_order}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {pedido.m2_total?.toFixed(2) || '0.00'} m²
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400">
                        ${Number(pedido.sub_order || 0).toFixed(2)}
                      </td>
                      
                      <td className="py-3 px-4 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAbierto(menuAbierto === pedido.id_order ? null : pedido.id_order);
                          }}
                          disabled={estaCargando}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${estilo.color} hover:shadow-md disabled:opacity-50`}
                        >
                          {estaCargando ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <EstadoIcon className="w-4 h-4" />
                          )}
                          {pedido.nom_estado || 'Sin estado'}
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        </button>

                        {menuAbierto === pedido.id_order && (
                          <div className="absolute z-50 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 max-h-64 overflow-y-auto">
                            {estadosBD?.map(estado => {
                              const estiloOpcion = getEstilo(estado.nom_estado);
                              const IconoOpcion = estiloOpcion.icon;
                              
                              return (
                                <button
                                  key={estado.id_estado}
                                  onClick={(e) => handleCambiarEstado(e, pedido.id_order, estado.id_estado)}
                                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                                    pedido.id_estado === estado.id_estado 
                                      ? 'bg-gray-100 dark:bg-gray-700 font-semibold' 
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                  }`}
                                >
                                  <IconoOpcion className="w-4 h-4" />
                                  {estado.nom_estado}
                                  {pedido.id_estado === estado.id_estado && (
                                    <span className="ml-auto text-xs">•</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => handleEliminar(e, pedido.id_order)}
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
    </div>
  );
}