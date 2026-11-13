import TablaFacturas from '../components/TablaFacturas';
import FormularioFactura from '../components/FormularioFactura';
import { useState } from 'react';
import { FileText } from 'lucide-react';

export default function FacturasPage() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <div>
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📄 Gestión de Facturas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Administra las facturas y estados de pago</p>
        </div>
        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition shadow-md"
        >
          <FileText className="w-5 h-5" />
          Nueva Factura
        </button>
      </div>

      <TablaFacturas />

      {mostrarFormulario && (
        <FormularioFactura
          onClose={() => setMostrarFormulario(false)}
          onFacturaCreada={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}