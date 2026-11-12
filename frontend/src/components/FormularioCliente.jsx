import { useState } from 'react';
import api from '../api/client';
import { UserPlus, X, CheckCircle, AlertCircle } from 'lucide-react';

export default function FormularioCliente({ onClienteCreado, onClose }) {
  const [formData, setFormData] = useState({
    nombre_user: '',
    telf_user: ''
  });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);

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
      const response = await api.post('/clientes/', formData);
      setMensaje({ 
        tipo: 'success', 
        texto: `✅ Cliente "${response.data.nombre_user}" registrado exitosamente` 
      });
      setFormData({ nombre_user: '', telf_user: '' });
      
      if (onClienteCreado) onClienteCreado();
      
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      console.error('Error completo:', error);
      
      let mensajeError = 'No se pudo registrar el cliente';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (typeof data.detail === 'string') {
          mensajeError = data.detail;
        } else if (Array.isArray(data.detail)) {
          mensajeError = data.detail.map(e => e.msg).join(', ');
        } else if (typeof data === 'object') {
          mensajeError = JSON.stringify(data);
        }
      }
      
      setMensaje({ tipo: 'error', texto: `❌ Error: ${mensajeError}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-200 dark:border-gray-700 transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500 p-3 rounded-lg">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Nuevo Cliente</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Completa los datos del cliente</p>
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
              Nombre del Cliente *
            </label>
            <input
              type="text"
              name="nombre_user"
              value={formData.nombre_user}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Ej: Alfredo González"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              name="telf_user"
              value={formData.telf_user}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Ej: 0412-1234567"
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
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Registrando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Registrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}