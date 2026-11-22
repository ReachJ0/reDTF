import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import {
  ScrollText, Search, ChevronDown, ChevronRight, RefreshCw, ShieldCheck,
  Plus, Pencil, Trash2, Activity, Database, UserCheck
} from 'lucide-react';
import { PageHeader, Card, cx, fFechaHora, inputCls, Skeleton, Empty } from '../design/sistema';

const OPS = {
  INSERT: { icon: Plus, cls: 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-400/40' },
  UPDATE: { icon: Pencil, cls: 'text-sky-600 dark:text-sky-300 bg-sky-500/10 border-sky-400/40' },
  DELETE: { icon: Trash2, cls: 'text-rose-600 dark:text-rose-300 bg-rose-500/10 border-rose-400/40' },
};

const cambios = (ant, nue) => {
  const a = ant || {}, b = nue || {};
  const keys = [...new Set([...Object.keys(a), ...Object.keys(b)])];
  return keys
    .filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]))
    .map((k) => ({ campo: k, antes: a[k], despues: b[k] }));
};

const fmt = (v) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));

function FragmentRow({ children }) {
  return <>{children}</>;
}

export default function AuditoriaPage() {
  const [op, setOp] = useState('');
  const [tabla, setTabla] = useState('');
  const [q, setQ] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [skip, setSkip] = useState(0);
  const [abierta, setAbierta] = useState(null);
  const LIMIT = 25;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auditoria', op, tabla, q, desde, hasta, skip],
    queryFn: async () => (await api.get('/auditoria/', {
      params: {
        operacion: op || undefined,
        tabla: tabla || undefined,
        q: q || undefined,
        desde: desde || undefined,
        hasta: hasta || undefined,
        skip,
        limit: LIMIT,
      },
    })).data,
  });

  const { data: resumen } = useQuery({
    queryKey: ['auditoriaResumen'],
    queryFn: async () => (await api.get('/auditoria/resumen')).data,
  });

  const registros = data?.registros ?? [];
  const total = data?.total ?? 0;
  const tablas = [...new Set((resumen?.por_tabla ?? []).map((t) => t.tabla))];

  return (
    <div>
      <PageHeader icon={ScrollText} grad="from-emerald-400 to-teal-600" titulo="Auditoría del Sistema"
        sub="Trazabilidad completa: quién cambió qué, cuándo y con qué valores antes/después">
        <button onClick={() => { refetch(); setSkip(0); }}
          className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-300/70 dark:border-gray-600 hover:border-emerald-400 transition">
          <RefreshCw className="w-4 h-4" /> Actualizar
        </button>
      </PageHeader>

      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {[
            { t: 'Operaciones registradas', v: total, i: Activity, g: 'from-emerald-400 to-teal-600' },
            { t: 'Inserts / Updates / Deletes', v: (resumen.por_operacion || []).map((o) => o.cantidad).join(' / ') || '0', i: ShieldCheck, g: 'from-sky-500 to-blue-600' },
            { t: 'Usuarios con actividad', v: (resumen.por_usuario || []).length, i: UserCheck, g: 'from-violet-500 to-fuchsia-600' },
          ].map((k) => (
            <div key={k.t} className="rdtf-rise relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-md p-4 flex items-center gap-4">
              <span aria-hidden className={cx('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', k.g)} />
              <div className={cx('p-3 rounded-xl bg-gradient-to-br text-white shadow-lg', k.g)}><k.i className="w-5 h-5" /></div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 dark:text-slate-400">{k.t}</p>
                <p className="rdtf-num text-xl font-extrabold text-slate-800 dark:text-white truncate">{k.v}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Card accent="from-emerald-400 via-teal-500 to-sky-500">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setSkip(0); }}
              placeholder="Buscar registro o valor…" className={cx(inputCls, 'w-full pl-9')} />
          </div>
          <select value={op} onChange={(e) => { setOp(e.target.value); setSkip(0); }} className={inputCls} aria-label="Filtrar operación">
            <option value="">Operación: todas</option>
            <option value="INSERT">INSERT</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
          <select value={tabla} onChange={(e) => { setTabla(e.target.value); setSkip(0); }} className={inputCls} aria-label="Filtrar tabla">
            <option value="">Tabla: todas</option>
            {tablas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/70 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-2.5 py-1.5">
            <Database className="w-4 h-4 text-emerald-500" />
            <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setSkip(0); }}
              className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none" aria-label="Desde" />
            <span className="text-slate-400 text-xs">→</span>
            <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setSkip(0); }}
              className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none" aria-label="Hasta" />
          </div>
        </div>

        {isLoading ? <Skeleton filas={6} /> : registros.length === 0 ? (
          <Empty texto="Sin registros de auditoría para los filtros actuales." />
        ) : (
          <>
            <div className="rdtf-scroll overflow-x-auto rounded-lg border border-slate-200/60 dark:border-gray-700/60">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="bg-gradient-to-r from-emerald-500/10 via-slate-50 to-sky-500/10 dark:via-gray-700/60 border-b border-slate-200 dark:border-gray-600">
                    {['', 'ID', 'Fecha y hora', 'Tabla', 'Operación', 'Registro', 'Usuario'].map((h, i) => (
                      <th key={i} className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {registros.map((r, i) => {
                    const o = OPS[r.operacion] || OPS.UPDATE;
                    const diff = cambios(r.datos_antiguos, r.datos_nuevos);
                    const open = abierta === r.id_aud;
                    return (
                      <FragmentRow key={r.id_aud}>
                        <tr onClick={() => setAbierta(open ? null : r.id_aud)}
                          className={cx('cursor-pointer border-b border-slate-100 dark:border-gray-700/70 transition-colors',
                            i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : 'bg-white dark:bg-gray-800',
                            'hover:bg-emerald-500/[0.06] dark:hover:bg-emerald-400/[0.07]')}>
                          <td className="py-3 px-4 w-8 text-slate-400">
                            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </td>
                          <td className="py-3 px-4 rdtf-num text-sm font-bold text-slate-800 dark:text-white">#{r.id_aud}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap">{fFechaHora(r.fec_operacion)}</td>
                          <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">{r.tabla}</td>
                          <td className="py-3 px-4">
                            <span className={cx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold', o.cls)}>
                              <o.icon className="w-3.5 h-3.5" /> {r.operacion}
                            </span>
                          </td>
                          <td className="py-3 px-4 rdtf-num text-sm text-slate-600 dark:text-slate-300">#{r.id_registro ?? '—'}</td>
                          <td className="py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-200">{r.usuario}</td>
                        </tr>
                        {open && (
                          <tr className="bg-emerald-500/[0.04] dark:bg-emerald-400/[0.05]">
                            <td colSpan={7} className="px-6 py-4">
                              {r.operacion === 'INSERT' ? (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  <b>Valores creados:</b> {Object.entries(r.datos_nuevos || {}).map(([k, v]) => `${k}=${fmt(v)}`).join(' · ')}
                                </p>
                              ) : r.operacion === 'DELETE' ? (
                                <p className="text-sm text-slate-600 dark:text-slate-300">
                                  <b>Valores eliminados:</b> {Object.entries(r.datos_antiguos || {}).map(([k, v]) => `${k}=${fmt(v)}`).join(' · ')}
                                </p>
                              ) : diff.length === 0 ? (
                                <p className="text-sm text-slate-400">Sin cambios de valores (actualización sin modificaciones).</p>
                              ) : (
                                <ul className="space-y-1.5">
                                  {diff.map((d) => (
                                    <li key={d.campo} className="flex flex-wrap items-center gap-2 text-sm">
                                      <span className="font-bold text-slate-700 dark:text-slate-200">{d.campo}:</span>
                                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-300 line-through">{fmt(d.antes)}</span>
                                      <span className="text-slate-400">→</span>
                                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-semibold">{fmt(d.despues)}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </td>
                          </tr>
                        )}
                      </FragmentRow>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="rdtf-num">{skip + 1}–{Math.min(skip + LIMIT, total)} de {total} registros</span>
              <div className="flex gap-2">
                <button disabled={skip === 0} onClick={() => setSkip((s) => Math.max(0, s - LIMIT))}
                  className="px-3 py-1.5 rounded-lg border border-slate-300/70 dark:border-gray-600 disabled:opacity-40 hover:border-emerald-400 transition">Anterior</button>
                <button disabled={skip + LIMIT >= total} onClick={() => setSkip((s) => s + LIMIT)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300/70 dark:border-gray-600 disabled:opacity-40 hover:border-emerald-400 transition">Siguiente</button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}