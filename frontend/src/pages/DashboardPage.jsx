import { LayoutDashboard, RefreshCw } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import Dashboard from '../components/Dashboard';
import { PageHeader, Btn, useToasts, Toasts } from '../design/sistema';

export default function DashboardPage() {
  const qc = useQueryClient();
  const { toasts, push, cerrar } = useToasts();
  const refrescar = () => {
    qc.invalidateQueries(['ordenes']);
    qc.invalidateQueries(['clientes']);
    qc.invalidateQueries(['tarifas']);
    push('success', 'Panel sincronizado con el servidor.');
  };
  return (
    <div>
      <PageHeader icon={LayoutDashboard} titulo="Panel de Control" sub="Pulso del negocio DTF: ingresos, producción y cobranza en vivo">
        <Btn variant="ghost" onClick={refrescar}><RefreshCw className="w-4 h-4" /> Sincronizar</Btn>
      </PageHeader>
      <Dashboard />
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>
  );
}