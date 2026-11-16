import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
  Users, Search, Plus, Download, Trash2, Pencil, Eye, Phone, FileText,
  ArrowUp, ArrowDown, ArrowUpDown, X, Filter, CreditCard, Ruler
} from 'lucide-react';
import {
  Card, Btn, Avatar, Drawer, Seccion, ConfirmModal, Empty, Skeleton,
  cx, money, fFecha, inputCls, useToasts, Toasts, hoyISO
} from '../design/sistema';
import FormularioCliente from './FormularioCliente';

export default function TablaClientes() {
  const qc = useQueryClient();
  const { toasts, push, cerrar } = useToasts();
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState({ campo: 'nombre_user', dir: 'asc' });
  const [sel, setSel] = useState(() => new Set());
  const [drawerId, setDrawerId] = useState(null);
  const [form, setForm] = useState(null);
  const [confirmar, setConfirmar] = useState(null);

  const { data: clientesRaw, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientes'],
    queryFn: async () => (await api.get('/clientes/')).data,
  });
  const { data: ordenesRaw } = useQuery({
    queryKey: ['ordenes'],
    queryFn: async () => (await api.get('/ordenes/')).data,
  });
  const clientes = clientesRaw ?? [];
  const ordenes = ordenesRaw ?? [];

  const enriquecidos = useMemo(() => clientes.map((c) => {
    const suyas = ordenes.filter((o) => o.id_cli === c.id_cli);
    return {
      ...c,
      nOrdenes: suyas.length,
      total: suyas.reduce((s, o) => s + Number(o.sub_order || 0), 0),
      m2: suyas.reduce((s, o) => s + Number(o.m2_total || 0), 0),
      ultima: suyas.map((o) => o.fec_creacion).filter(Boolean).sort().pop() || null,
    };
  }), [clientes, ordenes]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const list = enriquecidos.filter((c) => !q || String(c.id_cli).includes(q) || (c.nombre_user || '').toLowerCase().includes(q) || (c.telf_user || '').includes(q));
    const dir = orden.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const c = orden.campo;
      if (c === 'nombre_user') return dir * String(a[c] || '').localeCompare(String(b[c] || ''), 'es');
      return dir * (Number(a[c] || 0) - Number(b[c] || 0));
    });
  }, [enriquecidos, busqueda, orden]);

  const todos = filtrados.length > 0 && filtrados.every((c) => sel.has(c.id_cli));
  const algunos = filtrados.some((c) => sel.has(c.id_cli)) && !todos;
  const toggleTodos = () => setSel((s) => { const n = new Set(s); todos ? filtrados.forEach((c) => n.delete(c.id_cli)) : filtrados.forEach((c) => n.add(c.id_cli)); return n; });
  const toggleUno = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const eliminar = async (ids) => {
    setConfirmar(null);
    const snapshot = qc.getQueryData(['clientes']);
    qc.setQueryData(['clientes'], (prev = []) => prev.filter((c) => !ids.includes(c.id_cli)));
    setSel((s) => { const n = new Set(s); ids.forEach((i) => n.delete(i)); return n; });
    if (ids.includes(drawerId)) setDrawerId(null);
    const res = await Promise.allSettled(ids.map((id) => api.delete(`/clientes/${id}`)));
    const fallos = res.filter((r) => r.status === 'rejected').length;
    if (fallos) {
      qc.setQueryData(['clientes'], snapshot);
      push('error', `${fallos} cliente(s) no pudieron eliminarse (pueden tener órdenes asociadas). Datos restaurados.`);
    }
    if (res.length - fallos) push('success', `${res.length - fallos} cliente(s) eliminado(s).`);
    qc.invalidateQueries(['clientes']);
  };

  const exportar = () => {
    const rows = sel.size ? filtrados.filter((c) => sel.has(c.id_cli)) : filtrados;
    if (!rows.length) return push('info', 'No hay clientes para exportar.');
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['ID', 'Nombre', 'Teléfono', 'Órdenes', 'Total facturado', 'm² impresos', 'Última orden'];
    const lines = rows.map((c) => [c.id_cli, c.nombre_user, c.telf_user || '', c.nOrdenes, c.total.toFixed(2), c.m2.toFixed(4), fFecha(c.ultima)].map(esc).join(';'));
    const blob = new Blob(['\uFEFF' + [head.map(esc).join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `clientes_redtf_${hoyISO()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    push('success', `${rows.length} cliente(s) exportados a CSV.`);
  };

  const ordenar = (campo) => setOrden((o) => o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' });
  const Th = ({ campo, children, className }) => (
    <th className={cx('py-3 px-4 text-left', className)}>
      <button type="button" onClick={() => ordenar(campo)} className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 transition">
        {children}
        {orden.campo === campo ? (orden.dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
      </button>
    </th>
  );

  const drawer = drawerId !== null ? enriquecidos.find((c) => c.id_cli === drawerId) : null;
  const susOrdenes = drawer ? ordenes.filter((o) => o.id_cli === drawer.id_cli).sort((a, b) => b.id_order - a.id_order) : [];
  const kpiTotal = filtrados.reduce((s, c) => s + c.total, 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { t: 'Clientes activos', v: filtrados.length, g: 'from-sky-500 to-blue-600', i: Users },
          { t: 'Facturación acumulada', v: money(kpiTotal), g: 'from-violet-500 to-fuchsia-600', i: CreditCard },
          { t: 'Con órdenes', v: filtrados.filter((c) => c.nOrdenes > 0).length, g: 'from-emerald-400 to-teal-600', i: FileText },
        ].map((k) => (
          <div key={k.t} className="rdtf-rise relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-md p-4 flex items-center gap-4">
            <span aria-hidden className={cx('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', k.g)} />
            <div className={cx('p-3 rounded-xl bg-gradient-to-br text-white shadow-lg', k.g)}><k.i className="w-5 h-5" /></div>
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{k.t}</p><p className="rdtf-num text-2xl font-extrabold text-slate-800 dark:text-white">{k.v}</p></div>
          </div>
        ))}
      </div>

      <Card accent="from-sky-500 via-blue-500 to-violet-500">
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/30"><Users className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Directorio de Clientes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{filtrados.length} de {clientes.length}{sel.size ? ` · ${sel.size} seleccionado(s)` : ''}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar nombre, teléfono o ID…" className={cx(inputCls, 'w-full pl-9')} />
            </div>
            {busqueda && <Btn variant="soft" onClick={() => setBusqueda('')}><Filter className="w-4 h-4" /> Limpiar</Btn>}
            <Btn variant="ghost" onClick={exportar}><Download className="w-4 h-4" /> Exportar</Btn>
            <Btn onClick={() => setForm({})}><Plus className="w-4 h-4" /> Nuevo cliente</Btn>
          </div>
        </div>

        {sel.size > 0 && (
          <div className="rdtf-rise mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-sky-400/40 bg-gradient-to-r from-sky-500/10 to-violet-500/10 px-4 py-2.5">
            <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{sel.size} seleccionado(s)</span>
            <span className="flex-1" />
            <Btn variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={exportar}><Download className="w-3.5 h-3.5" /> Exportar selección</Btn>
            <Btn variant="soft" className="!py-1.5 !px-3 !text-xs" onClick={() => setConfirmar([...sel])}><Trash2 className="w-3.5 h-3.5" /> Eliminar</Btn>
            <Btn variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => setSel(new Set())}><X className="w-3.5 h-3.5" /> Limpiar</Btn>
          </div>
        )}

        {isLoading ? <Skeleton /> : isError ? (
          <Empty texto="No se pudo cargar el directorio." accion={<Btn className="mt-3" onClick={() => refetch()}>Reintentar</Btn>} />
        ) : filtrados.length === 0 ? (
          <Empty texto={busqueda ? 'Ningún cliente coincide con la búsqueda.' : 'Aún no hay clientes registrados.'}
            accion={!busqueda && <Btn className="mt-3" onClick={() => setForm({})}><Plus className="w-4 h-4" /> Registrar el primero</Btn>} />
        ) : (
          <div className="rdtf-scroll overflow-x-auto rounded-lg border border-slate-200/60 dark:border-gray-700/60">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="bg-gradient-to-r from-sky-500/10 via-slate-50 to-violet-500/10 dark:via-gray-700/60 border-b border-slate-200 dark:border-gray-600">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={todos} onChange={toggleTodos} aria-label="Seleccionar todos"
                      ref={(el) => { if (el) el.indeterminate = algunos; }} className="w-4 h-4 rounded accent-violet-500 cursor-pointer" />
                  </th>
                  <Th campo="id_cli" className="w-16">ID</Th>
                  <Th campo="nombre_user">Cliente</Th>
                  <Th campo="telf_user" className="w-40">Teléfono</Th>
                  <Th campo="nOrdenes" className="w-24">Órdenes</Th>
                  <Th campo="m2" className="w-24">m²</Th>
                  <Th campo="total" className="w-32">Facturado</Th>
                  <Th campo="ultima" className="w-32">Última orden</Th>
                  <th className="py-3 px-4 w-28 text-right"><span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"> </span></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((c, i) => (
                  <tr key={c.id_cli} onClick={() => setDrawerId(c.id_cli)}
                    className={cx('border-b border-slate-100 dark:border-gray-700/70 cursor-pointer transition-colors',
                      i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : 'bg-white dark:bg-gray-800',
                      sel.has(c.id_cli) ? 'bg-sky-500/10' : 'hover:bg-violet-500/[0.06] dark:hover:bg-violet-400/[0.07]')}>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={sel.has(c.id_cli)} onChange={() => toggleUno(c.id_cli)} aria-label={`Seleccionar ${c.nombre_user}`} className="w-4 h-4 rounded accent-violet-500 cursor-pointer" />
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-slate-800 dark:text-white">#{c.id_cli}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-2.5">
                        <Avatar nombre={c.nombre_user} grad="from-sky-500 to-violet-600" />
                        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c.nombre_user}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">{c.telf_user || '—'}</td>
                    <td className="py-3 px-4"><span className="rdtf-num inline-flex px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-400/30 text-xs font-bold text-violet-600 dark:text-violet-300">{c.nOrdenes}</span></td>
                    <td className="py-3 px-4 rdtf-num text-sm text-slate-600 dark:text-slate-300">{c.m2.toFixed(2)}</td>
                    <td className="py-3 px-4 rdtf-num text-sm font-bold text-emerald-600 dark:text-emerald-400">{money(c.total)}</td>
                    <td className="py-3 px-4 text-sm text-slate-500 dark:text-slate-400">{fFecha(c.ultima)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button type="button" onClick={() => setDrawerId(c.id_cli)} title="Ver ficha" className="p-2 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/10 transition"><Eye className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setForm(c)} title="Editar" className="p-2 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/10 transition"><Pencil className="w-4 h-4" /></button>
                      <button type="button" onClick={() => setConfirmar([c.id_cli])} title="Eliminar" className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 transition"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {drawer && (
        <Drawer titulo={drawer.nombre_user} sub={`Cliente #${drawer.id_cli} · ${drawer.telf_user || 'sin teléfono'}`} grad="from-sky-600 to-blue-600" onCerrar={() => setDrawerId(null)}>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { v: drawer.nOrdenes, t: 'órdenes', g: 'text-violet-600 dark:text-violet-300 bg-violet-500/10 border-violet-400/30' },
              { v: money(drawer.total), t: 'facturado', g: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-400/30' },
              { v: `${drawer.m2.toFixed(2)} m²`, t: 'impreso', g: 'text-sky-600 dark:text-sky-300 bg-sky-500/10 border-sky-400/30' },
            ].map((k) => (
              <div key={k.t} className={cx('rounded-xl border py-3', k.g)}>
                <p className="rdtf-num text-lg font-extrabold">{k.v}</p>
                <p className="text-[11px] opacity-70">{k.t}</p>
              </div>
            ))}
          </div>
          <Seccion icon={Phone} color="text-sky-500" titulo="Contacto">
            <p className="text-sm text-slate-600 dark:text-slate-300">{drawer.telf_user || 'Sin teléfono registrado'}</p>
            <p className="text-xs text-slate-400 mt-1">Última actividad: {fFecha(drawer.ultima)}</p>
          </Seccion>
          <Seccion icon={FileText} color="text-violet-500" titulo={`Historial de órdenes (${susOrdenes.length})`}>
            {susOrdenes.length ? (
              <ul className="rdtf-scroll max-h-64 overflow-y-auto space-y-2 pr-1">
                {susOrdenes.map((o) => (
                  <li key={o.id_order} className="flex items-center gap-3 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/60 px-3 py-2">
                    <span className="rdtf-num text-sm font-bold text-slate-700 dark:text-slate-200">#{o.id_order}</span>
                    <span className="flex-1 text-xs text-slate-400">{fFecha(o.fec_creacion)} · {o.larcm_order}×{o.ancm_order} cm ×{o.can_order}</span>
                    <span className="rdtf-num text-sm font-bold text-emerald-600 dark:text-emerald-400">{money(o.sub_order)}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-400">Este cliente aún no tiene órdenes.</p>}
          </Seccion>
          <Seccion icon={Ruler} color="text-fuchsia-500" titulo="Acciones">
            <div className="flex gap-2">
              <Btn className="flex-1 !bg-gradient-to-r !from-sky-500 !to-blue-600" onClick={() => { setForm(drawer); setDrawerId(null); }}><Pencil className="w-4 h-4" /> Editar ficha</Btn>
              <Btn variant="soft" onClick={() => setConfirmar([drawer.id_cli])}><Trash2 className="w-4 h-4" /> Eliminar</Btn>
            </div>
          </Seccion>
        </Drawer>
      )}

      {form !== null && <FormularioCliente cliente={form.id_cli ? form : null} onClose={() => setForm(null)} />}
      {confirmar && (
        <ConfirmModal titulo={`¿Eliminar ${confirmar.length} cliente(s)?`}
          texto="Los clientes con órdenes asociadas pueden no eliminarse por integridad referencial; el sistema lo verificará y restaurará si falla."
          onCancelar={() => setConfirmar(null)} onConfirmar={() => eliminar(confirmar)} />
      )}
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>
  );
}