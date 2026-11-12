import TablaPedidos from '../components/TablaPedidos';
import FormularioPedido from '../components/FormularioPedido';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';

export default function PedidosPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📦 Gestión de Pedidos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Administra los pedidos de impresión DTF</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition shadow-md"
        >
          <ShoppingCart className="w-5 h-5" />
          Nuevo Pedido
        </button>
      </div>

      <TablaPedidos />

      {mostrarFormulario && (
        <FormularioPedido
          onClose={() => setMostrarFormulario(false)}
          onPedidoCreado={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}