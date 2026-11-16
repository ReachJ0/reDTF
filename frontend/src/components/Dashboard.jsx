import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import {
  FileText, TrendingUp, Package, CreditCard, Users, Clock, AlertTriangle,
  ArrowUpRight, ArrowDownRight, Ruler, Receipt, Activity
} from 'lucide-react';
import {
  Card, KPI, AreaChart, Donut, Barras, Avatar, Skeleton, Empty, Btn,
  cx, money, HUES
} from '../design/sistema';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function regresion(ys) {
  const n = ys.length;
  if (n < 2) return { pend: 0, base: ys[0] || 0, r2: 0 };
  const mx = (n - 1) / 2;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  ys.forEach((y, i) => { num += (i - mx) * (y - my); den += (i - mx) ** 2; });
  const pend = den ? num / den : 0;
  const base = my - pend * mx;
  let ssRes = 0, ssTot = 0;
  ys.forEach((y, i) => { ssRes += (y - (base + pend * i)) ** 2; ssTot += (y - my) ** 2; });
  return { pend, base, r2: ssTot ? 1 - ssRes / ssTot : 0 };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: ordenesRaw, isLoading } = useQuery({
    queryKey: ['ordenes'],
    queryFn: async () => (await api.get('/ordenes/')).data,
  });
  const ordenes = ordenesRaw ?? [];

  const m = useMemo(() => {
    const ahora = new Date();
    const claves = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
      claves.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}` });
    }
    const serie = claves.map((c) => ({
      label: c.label,
      valor: ordenes.filter((o) => {
        if (!o.fec_creacion) return false;
        const d = new Date(o.fec_creacion);
        return `${d.getFullYear()}-${d.getMonth()}` === c.key;
      }).reduce((s, o) => s + Number(o.sub_order || 0), 0),
    }));
    const { pend, base, r2 } = regresion(serie.map((s) => s.valor));
    const proyeccion = [0, 1, 2].map((k) => {
      const d = new Date(ahora.getFullYear(), ahora.getMonth() + k + 1, 1);
      return { label: `${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`, valor: Math.max(0, base + pend * (6 + k)) };
    });

    const porPago = {};
    const porProd = {};
    const porCliente = {};
    let pagado = 0, porCobrar = 0, m2 = 0, vencidas = 0, activas = 0;
    ordenes.forEach((o) => {
      const v = Number(o.sub_order || 0);
      m2 += Number(o.m2_total || 0);
      porPago[o.nom_estado_pago || 'Sin estado'] = (porPago[o.nom_estado_pago || 'Sin estado'] || 0) + v;
      porProd[o.nom_estado_prod || 'Sin estado'] = (porProd[o.nom_estado_prod || 'Sin estado'] || 0) + 1;
      const c = o.nombre_cliente || 'Sin cliente';
      porCliente[c] = porCliente[c] || { nombre: c, ordenes: 0, monto: 0 };
      porCliente[c].ordenes += 1;
      porCliente[c].monto += v;
      if (o.nom_estado_pago === 'Pagada') pagado += v;
      if (o.nom_estado_pago === 'Pendiente') porCobrar += v;
      if (o.nom_estado_pago === 'Vencida') vencidas += 1;
      if (o.nom_estado_prod !== 'Entregado') activas += 1;
    });
    const total = ordenes.reduce((s, o) => s + Number(o.sub_order || 0), 0);
    return {
      serie, proyeccion, pend, r2,
      total, pagado, porCobrar, m2, vencidas, activas,
      entregadas: ordenes.filter((o) => o.nom_estado_prod === 'Entregado').length,
      ticket: ordenes.length ? total / ordenes.length : 0,
      tasaCobro: total ? (pagado / total) * 100 : 0,
      pago: Object.entries(porPago).map(([nombre, valor]) => ({ nombre, valor })).sort((a, b) => b.valor - a.valor),
      prod: Object.entries(porProd).map(([nombre, valor]) => ({ nombre, valor })).sort((a, b) => b.valor - a.valor),
      clientes: Object.values(porCliente).sort((a, b) => b.monto - a.monto).slice(0, 5),
    };
  }, [ordenes]);

  if (isLoading) return <div className="space-y-4"><Skeleton filas={2} /><div className="grid lg:grid-cols-3 gap-4"><Skeleton filas={4} /><Skeleton filas={4} /><Skeleton filas={4} /></div></div>;

  const sube = m.pend >= 0;

  return (
    <div className="space-y-5">
      {m.vencidas > 0 && (
        <div className="rdtf-rise flex flex-wrap items-center gap-3 rounded-xl border border-orange-400/40 bg-gradient-to-r from-orange-500/15 to-amber-500/10 px-4 py-3">
          <AlertTriangle className="w-5 h-5 text-orange-500" />
          <p className="flex-1 text-sm font-semibold text-orange-700 dark:text-orange-300">
            {m.vencidas} factura(s) vencida(s) requieren seguimiento de cobro.
          </p>
          <Btn variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => navigate('/ordenes')}>Revisar órdenes</Btn>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPI titulo="Ingresos Totales" valor={money(m.total)} sub={`${ordenes.length} órdenes históricas`} icon={TrendingUp} grad="from-violet-500 to-fuchsia-600" delay={0} />
        <KPI titulo="Cobrado" valor={money(m.pagado)} sub={`${m.tasaCobro.toFixed(0)}% del total facturado`} icon={CreditCard} grad="from-emerald-400 to-teal-600" delay={60} />
        <KPI titulo="Por Cobrar" valor={money(m.porCobrar)} sub={`${m.activas} órdenes en producción`} icon={Clock} grad="from-amber-400 to-orange-500" delay={120} />
        <KPI titulo="Material Impreso" valor={`${m.m2.toFixed(2)} m²`} sub={`ticket promedio ${money(m.ticket)}`} icon={Ruler} grad="from-sky-400 to-blue-600" delay={180} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2" accent="from-violet-500 via-fuchsia-500 to-sky-500">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white"><Activity className="w-5 h-5 text-fuchsia-500" /> Ingresos por mes</h3>
              <p className="text-xs text-slate-400">Últimos 6 meses · proyección a 3 meses por regresión lineal</p>
            </div>
            <div className={cx('flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold border',
              sube ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-400/40' : 'text-rose-600 dark:text-rose-300 bg-rose-500/10 border-rose-400/40')}>
              {sube ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {money(Math.abs(m.pend))}/mes · R² {m.r2.toFixed(2)}
            </div>
          </div>
          {ordenes.length ? <AreaChart puntos={m.serie} proyeccion={m.proyeccion} /> : <Empty texto="Crea tu primera orden para ver la tendencia de ingresos." accion={<Btn className="mt-3" onClick={() => navigate('/ordenes')}>Ir a Órdenes</Btn>} />}
        </Card>

        <Card accent="from-emerald-400 to-teal-600">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4"><Receipt className="w-5 h-5 text-emerald-500" /> Cartera por estado de pago</h3>
          {m.pago.length ? <Donut data={m.pago} centro={money(m.total)} sub="facturado" /> : <Empty texto="Sin facturación aún." />}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card accent="from-sky-400 to-blue-600">
          <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4"><Package className="w-5 h-5 text-sky-500" /> Cola de producción</h3>
          <Barras data={m.prod} />
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-violet-500/10 border border-violet-400/30 py-2">
              <p className="rdtf-num text-xl font-extrabold text-violet-600 dark:text-violet-300">{m.entregadas}</p>
              <p className="text-[11px] text-slate-400">entregadas</p>
            </div>
            <div className="rounded-lg bg-amber-500/10 border border-amber-400/30 py-2">
              <p className="rdtf-num text-xl font-extrabold text-amber-600 dark:text-amber-300">{m.activas}</p>
              <p className="text-[11px] text-slate-400">en curso</p>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2" accent="from-fuchsia-500 to-violet-600">
          <div className="flex items-center justify-between mb-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white"><Users className="w-5 h-5 text-fuchsia-500" /> Mejores clientes</h3>
            <Btn variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => navigate('/clientes')}>Ver todos</Btn>
          </div>
          {m.clientes.length ? (
            <ul className="space-y-2.5">
              {m.clientes.map((c, i) => (
                <li key={c.nombre} className="rdtf-rise flex items-center gap-3 rounded-xl border border-slate-200/70 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/60 px-3.5 py-2.5 hover:border-violet-400/50 transition" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="rdtf-num w-5 text-center text-sm font-extrabold text-slate-400">{i + 1}</span>
                  <Avatar nombre={c.nombre} grad={`from-[${HUES[i % HUES.length]}] to-fuchsia-600`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 dark:text-slate-200 truncate">{c.nombre}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-200/70 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${(c.monto / (m.clientes[0]?.monto || 1)) * 100}%`, background: `linear-gradient(90deg,${HUES[i % HUES.length]},#e879f9)` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="rdtf-num font-extrabold text-emerald-600 dark:text-emerald-400">{money(c.monto)}</p>
                    <p className="text-[11px] text-slate-400">{c.ordenes} orden(es)</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : <Empty texto="Aún no hay clientes con órdenes." />}
        </Card>
      </div>
    </div>
  );
}