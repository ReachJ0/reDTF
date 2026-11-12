import { useState, useEffect } from 'react';
import api from '../api/client';
import { ShoppingCart, X, CheckCircle, AlertCircle, Calculator } from 'lucide-react';

export default function FormularioPedido({ onPedidoCreado, onClose }) {
  const [formData, setFormData] = useState({
    id_cli: '',
    id_tarif: '',
    larcm_order: '',
    ancm_order: '',
    can_order: 1
  });
  const [clientes, setClientes] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [calculo, setCalculo] = useState({ m2: 0, subtotal: 0, precioUnitario: 0 });

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [clientesRes, tarifasRes] = await Promise.all([
          api.get('/clientes/'),
          api.get('/tarifas/')
        ]);
        setClientes(clientesRes.data);
        setTarifas(tarifasRes.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };
    cargarDatos();
  }, []);

  useEffect(() => {
    const { larcm_order, ancm_order, can_order, id_tarif } = formData;
    
    if (larcm_order && ancm_order && can_order && id_tarif) {
      const largo = parseFloat(larcm_order);
      const ancho = parseFloat(ancm_order);
      const cantidad = parseInt(can_order);
      
      if (largo > 0 && ancho > 0 && cantidad > 0) {
        const m2 = (largo * ancho * cantidad) / 10000;
        const tarifa = tarifas.find(t => t.id_tarif === parseInt(id_tarif));
        const subtotal = tarifa ? m2 * tarifa.pre_tarif : 0;
        
        setCalculo({ 
          m2: m2.toFixed(4), 
          subtotal: subtotal.toFixed(2),
          precioUnitario: tarifa?.pre_tarif || 0
        });
      }
    }
  }, [formData.larcm_order, formData.ancm_order, formData.can_order, formData.id_tarif, tarifas]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);

    try {
      const facturaRes = await api.post('/facturas/', {
        id_cli: parseInt(formData.id_cli),
        id_esta: 1,
        mont_fac: parseFloat(calculo.subtotal),
        fecc_fac: new Date().toISOString(),
        fece_fac: new Date().toISOString()
      });

      const id_fac = facturaRes.data.id_fac;

      const pedidoData = {
        id_fac: id_fac,
        id_tarif: parseInt(formData.id_tarif),
        larcm_order: parseFloat(formData.larcm_order),
        ancm_order: parseFloat(formData.ancm_order),  // ✅ CORREGIDO
        can_order: parseInt(formData.can_order),
        id_esta: 1
      };

      await api.post('/pedidos/', pedidoData);
      
      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Pedido registrado exitosamente. Total: $${calculo.subtotal}` 
      });
      setFormData({ id_cli: '', id_tarif: '', larcm_order: '', ancm_order: '', can_order: 1 });
      
      if (onPedidoCreado) onPedidoCreado();
      
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error completo:', error);
      
      let mensajeError = 'No se pudo registrar el pedido';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.detail === 'string') {
          mensajeError = data.detail;
        } else if (Array.isArray(data.detail)) {
          mensajeError = data.detail.map(e => e.msg).join(', ');
        }
      }
      
      setMensaje({ tipo: 'error', texto: `❌ Error: ${mensajeError}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 relative border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500 p-3 rounded-lg">
            <ShoppingCart className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nuevo Pedido</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos del pedido</p>
          </div>
        </div>

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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cliente *
            </label>
            <select
              name="id_cli"
              value={formData.id_cli}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Seleccionar cliente</option>
              {clientes.map(cliente => (
                <option key={cliente.id_cli} value={cliente.id_cli}>
                  {cliente.nombre_user} - {cliente.telf_user}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Impresión *
            </label>
            <select
              name="id_tarif"
              value={formData.id_tarif}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Seleccionar tarifa</option>
              {tarifas.map(tarifa => (
                <option key={tarifa.id_tarif} value={tarifa.id_tarif}>
                  {tarifa.tam_tarif} - ${tarifa.pre_tarif.toFixed(2)}/m²
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Largo (cm) *
              </label>
              <input
                type="number"
                name="larcm_order"
                value={formData.larcm_order}
                onChange={handleChange}
                required
                min="0.1"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ancho (cm) *
              </label>
              <input
                type="number"
                name="ancm_order"
                value={formData.ancm_order}
                onChange={handleChange}
                required
                min="0.1"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: 40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cantidad *
              </label>
              <input
                type="number"
                name="can_order"
                value={formData.can_order}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {calculo.m2 > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-blue-800 dark:text-blue-300">Cálculo Automático</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Metros cuadrados</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{calculo.m2} m²</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Precio unitario</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${calculo.precioUnitario.toFixed(2)}/m²</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Subtotal</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">${calculo.subtotal}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Registrar Pedido
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}