import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, Plus } from 'lucide-react';
import TablaOrdenes from '../components/TablaOrdenes';
import FormularioPedido from '../components/FormularioPedido';
import { PageHeader, Btn } from '../design/sistema';

export default function OrdenesPage() {
  const [mostrar, setMostrar] = useState(false);
  const qc = useQueryClient();
  return (
    <div>
      <PageHeader icon={FileText} titulo="Gestión de Órdenes" sub="Administra producción y facturación en un solo lugar">
        <Btn onClick={() => setMostrar(true)}><Plus className="w-5 h-5" /> Nueva Orden</Btn>
      </PageHeader>
      <TablaOrdenes />
      {mostrar && (
        <FormularioPedido
          onClose={() => setMostrar(false)}
          onPedidoCreado={() => {
            qc.invalidateQueries(['ordenes']);
            qc.invalidateQueries(['dashboardStats']);
          }}
        />
      )}
    </div>
  );
}