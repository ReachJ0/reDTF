import { useState, useEffect } from 'react';
import api from '../api/client';
import { FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function FormularioFactura({ onFacturaCreada, onClose }) {
  const [formData, setFormData] = useState({
    id_cli: '',
    id_esta: 1,
    mont_fac: '',
    fece_fac: new Date().toISOString().split('T')[0]
  });
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    const cargarClientes = async () => {
      try {
        const response = await api.get('/clientes/');
        setClientes(response.data);
      } catch (error) {
        console.error('Error al cargar clientes:', error);
      }
    };
    cargarClientes();
  }, []);

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
      const facturaData = {
        id_cli: parseInt(formData.id_cli),
        id_esta: parseInt(formData.id_esta),
        mont_fac: parseFloat(formData.mont_fac),
        fecc_fac: new Date().toISOString(),
        fece_fac: new Date(formData.fece_fac).toISOString()
      };

      await api.post('/facturas/', facturaData);
      
      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Factura registrada exitosamente. Monto: $${formData.mont_fac}` 
      });
      setFormData({ id_cli: '', id_esta: 1, mont_fac: '', fece_fac: new Date().toISOString().split('T')[0] });
      
      if (onFacturaCreada) onFacturaCreada();
      
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error completo:', error);
      
      let mensajeError = 'No se pudo registrar la factura';
      
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 relative border border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-green-500 p-3 rounded-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nueva Factura</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos de la factura</p>
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
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
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
              Estado *
            </label>
            <select
              name="id_esta"
              value={formData.id_esta}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value={1}>Pendiente</option>
              <option value={2}>Pagada</option>
              <option value={3}>Cancelada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monto ($) *
            </label>
            <input
              type="number"
              name="mont_fac"
              value={formData.mont_fac}
              onChange={handleChange}
              required
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Ej: 150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Fecha de Emisión *
            </label>
            <input
              type="date"
              name="fece_fac"
              value={formData.fece_fac}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

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
              className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Registrar Factura
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}