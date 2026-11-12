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
      setMensaje({ tipo: 'success', texto: `✅ Cliente "${response.data.nombre_user}" registrado exitosamente` });
      setFormData({ nombre_user: '', telf_user: '' });
      
      // Notificar al padre para refrescar datos
      if (onClienteCreado) onClienteCreado();
      
      // Cerrar después de 2 segundos
      setTimeout(() => {
        if (onClose) onClose();
      }, 2000);
    } catch (error) {
      setMensaje({ 
        tipo: 'error', 
        texto: `❌ Error: ${error.response?.data?.detail || 'No se pudo registrar el cliente'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Botón cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-500 p-3 rounded-lg">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nuevo Cliente</h2>
            <p className="text-sm text-gray-500">Completa los datos del cliente</p>
          </div>
        </div>

        {/* Mensaje de feedback */}
        {mensaje && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
            mensaje.tipo === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {mensaje.tipo === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm">{mensaje.texto}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              name="nombre_user"
              value={formData.nombre_user}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Ej: Alfredo González"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono *
            </label>
            <input
              type="tel"
              name="telf_user"
              value={formData.telf_user}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="Ej: 0412-1234567"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
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