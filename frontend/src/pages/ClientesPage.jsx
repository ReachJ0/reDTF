import { Users } from 'lucide-react';
import TablaClientes from '../components/TablaClientes';
import { PageHeader } from '../design/sistema';

export default function ClientesPage() {
  return (
    <div>
      <PageHeader icon={Users} grad="from-sky-500 to-blue-600" titulo="Gestión de Clientes"
        sub="Directorio del estudio con historial de impresión y facturación por cliente" />
      <TablaClientes />
    </div>
  );
}