import TablaClientes from '../components/TablaClientes';
import FormularioCliente from '../components/FormularioCliente';
import { useState } from 'react';
import { UserPlus } from 'lucide-react';

export default function ClientesPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">👥 Gestión de Clientes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Administra tu base de clientes</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition shadow-md"
        >
          <UserPlus className="w-5 h-5" />
          Nuevo Cliente
        </button>
      </div>

      <TablaClientes />

      {mostrarFormulario && (
        <FormularioCliente
          onClose={() => setMostrarFormulario(false)}
          onClienteCreado={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}