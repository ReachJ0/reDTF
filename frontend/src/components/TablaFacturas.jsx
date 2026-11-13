import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { 
  Trash2, Search, FileText, CheckCircle, Clock, XCircle, 
  ChevronDown, RefreshCw, Package, AlertTriangle 
} from 'lucide-react';


const estilosEstado = {
  'Pendiente':  { color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800', icon: Clock },
  'Pagada':     { color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800', icon: CheckCircle },
  'Cancelada':  { color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800', icon: XCircle },
  'Vencida':    { color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800', icon: AlertTriangle },
  'default':    { color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600', icon: Clock }
};

export default function TablaFacturas() {
  const queryClient = useQueryClient();
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [error, setError] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(null);


  const { data: estadosBD } = useQuery({
    queryKey: ['estados'],
        queryFn: async () => {
        const response = await api.get('/finanzas/estados-factura/');
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

  const { data: facturas, isLoading } = useQuery({
    queryKey: ['facturas'],
    queryFn: async () => {
      const response = await api.get('/finanzas/facturas/');
      return response.data;
    },
  });

  const eliminarMutation = useMutation({
    mutationFn: async (id_fac) => {
      await api.delete(`/finanzas/facturas/${id_fac}`);
    },
    onSuccess: () => queryClient.invalidateQueries(['facturas']),
    onError: (err) => {
      setError(`❌ Error al eliminar: ${err.response?.data?.detail || 'Error desconocido'}`);
      setTimeout(() => setError(null), 3000);
    },
  });

  const actualizarEstadoMutation = useMutation({
    mutationFn: async ({ id_fac, id_esta }) => {
      const response = await api.put(`/finanzas/facturas/${id_fac}/estado`, { id_esta });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['facturas']);
      setError(null);
    },
    onError: (err) => {
      const detalle = err.response?.data?.detail;
      const mensajeError = typeof detalle === 'string' ? detalle : JSON.stringify(detalle || err.message);
      setError(`❌ No se pudo cambiar el estado: ${mensajeError}`);
      setTimeout(() => setError(null), 4000);
    },
  });

  const handleEliminar = (e, id_fac) => {
    e.stopPropagation();
    if (window.confirm(`¿Eliminar factura #${id_fac}?`)) {
      eliminarMutation.mutate(id_fac);
    }
  };

  const handleCambiarEstado = (e, id_fac, nuevoEstado) => {
    e.stopPropagation();
    actualizarEstadoMutation.mutate({ id_fac, id_esta: parseInt(nuevoEstado) });
    setMenuAbierto(null);
  };

  const getEstilo = (nombreEstado) => {
    return estilosEstado[nombreEstado] || estilosEstado['default'];
  };

  const facturasFiltradas = facturas?.filter(f => {
    const coincideBusqueda = !busqueda || 
      f.id_fac.toString().includes(busqueda) ||
      f.nombre_cliente?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = !filtroEstado || f.id_esta === parseInt(filtroEstado);
    return coincideBusqueda && coincideEstado;
  }) || [];

  const totalFacturas = facturasFiltradas.length;
  const totalMonto = facturasFiltradas.reduce((sum, f) => sum + Number(f.mont_fac || 0), 0);
  const totalPagadas = facturasFiltradas.filter(f => f.nom_esta === 'Pagada').reduce((sum, f) => sum + Number(f.mont_fac || 0), 0);
  const totalPendiente = facturasFiltradas.filter(f => f.nom_esta === 'Pendiente').reduce((sum, f) => sum + Number(f.mont_fac || 0), 0);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400 py-10">Cargando facturas...</div>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Facturas</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalFacturas}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Monto Total</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${totalMonto.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pagado</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">${totalPagadas.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pendiente</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">${totalPendiente.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-500 p-3 rounded-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Lista de Facturas</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{facturasFiltradas.length} facturas</p>
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
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none w-full md:w-64"
              />
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Todos los estados</option>
              {estadosBD?.map(estado => (
                <option key={estado.id_esta} value={estado.id_esta}>
                  {estado.nom_esta}
                </option>
              ))}
            </select>
          </div>
        </div>

        {facturasFiltradas.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            {busqueda || filtroEstado ? 'No se encontraron facturas' : 'No hay facturas registradas'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">ID</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Cliente</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Monto</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.map((factura, index) => {
                  const estilo = getEstilo(factura.nom_esta);
                  const EstadoIcon = estilo.icon;
                  const monto = Number(factura.mont_fac || 0);
                  const fecha = factura.fece_fac ? new Date(factura.fece_fac).toLocaleDateString('es-ES') : '-';
                  const estaCargando = actualizarEstadoMutation.isLoading && actualizarEstadoMutation.variables?.id_fac === factura.id_fac;
                  
                  return (
                    <tr
                      key={factura.id_fac}
                      className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition ${
                        index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-800/50'
                      }`}
                    >
                      <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-white">#{factura.id_fac}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">
                        {factura.nombre_cliente || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600 dark:text-green-400">${monto.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{fecha}</td>
                      
                      <td className="py-3 px-4 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuAbierto(menuAbierto === factura.id_fac ? null : factura.id_fac);
                          }}
                          disabled={estaCargando}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${estilo.color} hover:shadow-md disabled:opacity-50`}
                        >
                          {estaCargando ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <EstadoIcon className="w-4 h-4" />
                          )}
                          {factura.nom_esta || 'Sin estado'}
                          <ChevronDown className="w-3 h-3 opacity-70" />
                        </button>

                        {menuAbierto === factura.id_fac && (
                          <div className="absolute z-50 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 max-h-64 overflow-y-auto">
                            {estadosBD?.map(estado => {
                              const estiloOpcion = getEstilo(estado.nom_esta);
                              const IconoOpcion = estiloOpcion.icon;
                              
                              return (
                                <button
                                  key={estado.id_esta}
                                  onClick={(e) => handleCambiarEstado(e, factura.id_fac, estado.id_esta)}
                                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors ${
                                    factura.id_esta === estado.id_esta 
                                      ? 'bg-gray-100 dark:bg-gray-700 font-semibold' 
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                  }`}
                                >
                                  <IconoOpcion className="w-4 h-4" />
                                  {estado.nom_esta}
                                  {factura.id_esta === estado.id_esta && (
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
                          onClick={(e) => handleEliminar(e, factura.id_fac)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition"
                          title="Eliminar factura"
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