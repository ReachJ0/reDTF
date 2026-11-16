import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
  Settings, Plus, Pencil, Trash2, Tag, RefreshCw, Database, Palette,
  CheckCircle, Clock, Printer, AlertTriangle, Package, XCircle, Ruler
} from 'lucide-react';
import {
  PageHeader, Card, Btn, ConfirmModal, Empty, Skeleton, Seccion,
  cx, money, inputCls, labelCls, useToasts, Toasts, HUES
} from '../design/sistema';

const ICON_PROD = { Pendiente: Clock, Imprimiendo: Printer, 'En Revision': AlertTriangle, Entregado: Package };
const ICON_PAGO = { Pendiente: Clock, Pagada: CheckCircle, Cancelada: XCircle, Vencida: AlertTriangle };

function ModalTarifa({ tarifa, onClose }) {
  const qc = useQueryClient();
  const { toasts, push, cerrar } = useToasts();
  const [form, setForm] = useState({ tam_tarif: tarifa?.tam_tarif || '', pre_tarif: tarifa?.pre_tarif ?? '' });
  const [enviando, setEnviando] = useState(false);
  const editando = !!tarifa?.id_tarif;
  const precio = parseFloat(form.pre_tarif) || 0;

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.tam_tarif.trim() || precio <= 0) return push('error', 'Nombre y precio mayor a 0 son obligatorios.');
    setEnviando(true);
    try {
      const payload = { tam_tarif: form.tam_tarif.trim(), pre_tarif: precio };
      if (editando) await api.put(`/tarifas/${tarifa.id_tarif}`, payload);
      else await api.post('/tarifas/', payload);
      qc.invalidateQueries(['tarifas']);
      push('success', editando ? 'Tarifa actualizada.' : `Tarifa "${payload.tam_tarif}" creada.`);
      setTimeout(onClose, 600);
    } catch (err) {
      push('error', `No se pudo guardar: ${err.response?.data?.detail || err.message}`);
    } finally { setEnviando(false); }
  };

  return (
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="rdtf-scrim absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="rdtf-menu relative w-full max-w-md rounded-2xl border border-amber-400/30 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/15"><Tag className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-extrabold">{editando ? 'Editar Tarifa' : 'Nueva Tarifa'}</h2>
              <p className="text-xs opacity-85">Precio por metro cuadrado de impresión</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-white/15 transition"><Plus className="w-5 h-5 rotate-45" /></button>
        </div>
        <form onSubmit={guardar} className="p-5 space-y-4">
          <div>
            <label className={labelCls}>Nombre de la tarifa *</label>
            <input value={form.tam_tarif} onChange={(e) => setForm((f) => ({ ...f, tam_tarif: e.target.value }))} required autoFocus
              placeholder="Ej: Metro lineal DTF" className={cx(inputCls, 'w-full')} />
          </div>
          <div>
            <label className={labelCls}>Precio por m² (USD) *</label>
            <input type="number" min="0.01" step="0.01" value={form.pre_tarif} onChange={(e) => setForm((f) => ({ ...f, pre_tarif: e.target.value }))} required
              placeholder="12.50" className={cx(inputCls, 'w-full rdtf-num')} />
          </div>
          <div className="rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-300 mb-2"><Ruler className="w-3.5 h-3.5" /> Simulación en vivo</p>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {[0.24, 0.58, 1].map((m2) => (
                <div key={m2} className="rounded-lg bg-white/60 dark:bg-gray-800/60 py-2">
                  <p className="rdtf-num font-extrabold text-slate-800 dark:text-white">{money(m2 * precio)}</p>
                  <p className="text-[10px] text-slate-400">{m2} m²</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2.5">
            <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={enviando} className="flex-1 !bg-gradient-to-r !from-amber-400 !to-orange-500">
              {enviando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {editando ? 'Guardar cambios' : 'Crear tarifa'}
            </Btn>
          </div>
        </form>
      </div>
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>
  );
}

export default function ConfiguracionPage() {
  const qc = useQueryClient();
  const { toasts, push, cerrar } = useToasts();
  const [modal, setModal] = useState(null);
  const [confirmar, setConfirmar] = useState(null);

  const { data: tarifasRaw, isLoading } = useQuery({ queryKey: ['tarifas'], queryFn: async () => (await api.get('/tarifas/')).data });
  const { data: ordenesRaw } = useQuery({ queryKey: ['ordenes'], queryFn: async () => (await api.get('/ordenes/')).data });
  const { data: clientesRaw } = useQuery({ queryKey: ['clientes'], queryFn: async () => (await api.get('/clientes/')).data });
  const { data: epRaw } = useQuery({ queryKey: ['estadosProd'], queryFn: async () => (await api.get('/ordenes/estados-produccion/')).data });
  const { data: efRaw } = useQuery({ queryKey: ['estadosPago'], queryFn: async () => (await api.get('/ordenes/estados-pago/')).data });
  const tarifas = tarifasRaw ?? [];
  const ordenes = ordenesRaw ?? [];

  const uso = useMemo(() => {
    const u = {};
    ordenes.forEach((o) => { u[o.id_tarif] = (u[o.id_tarif] || 0) + 1; });
    return u;
  }, [ordenes]);
  const conteo = (lista, campo) => (lista ?? []).map((e) => ({ ...e, n: ordenes.filter((o) => o[campo] === e.id_estado).length }));

  const eliminar = async (t) => {
    setConfirmar(null);
    const snapshot = qc.getQueryData(['tarifas']);
    qc.setQueryData(['tarifas'], (prev = []) => prev.filter((x) => x.id_tarif !== t.id_tarif));
    try {
      await api.delete(`/tarifas/${t.id_tarif}`);
      push('success', `Tarifa "${t.tam_tarif}" eliminada.`);
    } catch (err) {
      qc.setQueryData(['tarifas'], snapshot);
      push('error', `No se pudo eliminar: ${err.response?.data?.detail || 'tiene órdenes asociadas'}. Tarifa restaurada.`);
    }
    qc.invalidateQueries(['tarifas']);
  };

  const sincronizar = () => {
    ['tarifas', 'ordenes', 'clientes', 'estadosProd', 'estadosPago'].forEach((k) => qc.invalidateQueries([k]));
    push('success', 'Catálogos sincronizados con el servidor.');
  };

  return (
    <div>
      <PageHeader icon={Settings} grad="from-amber-400 to-orange-500" titulo="Configuración"
        sub="Tarifas de impresión, catálogos de estados y salud del sistema">
        <Btn variant="ghost" onClick={sincronizar}><RefreshCw className="w-4 h-4" /> Sincronizar</Btn>
        <Btn className="!bg-gradient-to-r !from-amber-400 !to-orange-500" onClick={() => setModal({})}><Plus className="w-4 h-4" /> Nueva tarifa</Btn>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2" accent="from-amber-400 via-orange-500 to-rose-500">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-amber-500/30"><Tag className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tarifas de impresión</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{tarifas.length} tarifa(s) · el precio alimenta el cálculo automático de cada orden</p>
            </div>
          </div>

          {isLoading ? <Skeleton filas={3} /> : tarifas.length === 0 ? (
            <Empty texto="No hay tarifas. Crea la primera para poder cotizar órdenes."
              accion={<Btn className="mt-3 !bg-gradient-to-r !from-amber-400 !to-orange-500" onClick={() => setModal({})}><Plus className="w-4 h-4" /> Crear tarifa</Btn>} />
          ) : (
            <ul className="space-y-3">
              {tarifas.map((t, i) => (
                <li key={t.id_tarif} className="rdtf-rise group flex flex-wrap items-center gap-4 rounded-xl border border-slate-200/70 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/60 p-4 hover:border-amber-400/50 hover:shadow-md transition" style={{ animationDelay: `${i * 60}ms` }}>
                  <span className="w-11 h-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center font-extrabold shadow-md"
                    style={{ background: `linear-gradient(135deg, ${HUES[i % HUES.length]}, ${HUES[(i + 2) % HUES.length]})` }}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-[160px]">
                    <p className="font-bold text-slate-800 dark:text-white">{t.tam_tarif}</p>
                    <p className="text-xs text-slate-400">{uso[t.id_tarif] || 0} orden(es) usan esta tarifa</p>
                  </div>
                  <div className="text-right">
                    <p className="rdtf-num text-xl font-extrabold text-amber-600 dark:text-amber-300">{money(t.pre_tarif)}</p>
                    <p className="text-[11px] text-slate-400">por m²</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => setModal(t)} title="Editar tarifa" className="p-2 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-500/10 transition"><Pencil className="w-4 h-4" /></button>
                    <button type="button" onClick={() => setConfirmar(t)} title="Eliminar tarifa" className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-5">
          <Card accent="from-violet-500 to-fuchsia-600">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4"><Palette className="w-5 h-5 text-fuchsia-500" /> Catálogo de estados</h3>
            <Seccion icon={Printer} color="text-sky-500" titulo="Producción">
              <ul className="space-y-1.5">
                {conteo(epRaw, 'id_estado_prod').map((e) => {
                  const I = ICON_PROD[e.nom_estado] || Clock;
                  return (
                    <li key={e.id_estado} className="flex items-center gap-2 text-sm">
                      <I className="w-4 h-4 text-sky-500" />
                      <span className="flex-1 text-slate-600 dark:text-slate-300">{e.nom_estado}</span>
                      <span className="rdtf-num px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-400/30 text-xs font-bold text-sky-600 dark:text-sky-300">{e.n}</span>
                    </li>
                  );
                })}
              </ul>
            </Seccion>
            <div className="h-3" />
            <Seccion icon={CheckCircle} color="text-emerald-500" titulo="Pago">
              <ul className="space-y-1.5">
                {conteo(efRaw, 'id_estado_pago').map((e) => {
                  const I = ICON_PAGO[e.nom_estado] || Clock;
                  return (
                    <li key={e.id_estado} className="flex items-center gap-2 text-sm">
                      <I className="w-4 h-4 text-emerald-500" />
                      <span className="flex-1 text-slate-600 dark:text-slate-300">{e.nom_estado}</span>
                      <span className="rdtf-num px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-400/30 text-xs font-bold text-emerald-600 dark:text-emerald-300">{e.n}</span>
                    </li>
                  );
                })}
              </ul>
            </Seccion>
            <p className="mt-3 text-[11px] text-slate-400">Los estados se administran desde PostgreSQL; el frontend los lee en vivo.</p>
          </Card>

          <Card accent="from-sky-400 to-blue-600">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white mb-4"><Database className="w-5 h-5 text-sky-500" /> Salud del sistema</h3>
            <ul className="space-y-2 text-sm">
              {[
                ['Clientes registrados', (clientesRaw ?? []).length],
                ['Órdenes en base', ordenes.length],
                ['Tarifas activas', tarifas.length],
                ['Versión del panel', 'v0.4.0'],
              ].map(([k, v]) => (
                <li key={k} className="flex items-center justify-between rounded-lg bg-slate-50/70 dark:bg-gray-800/70 px-3 py-2">
                  <span className="text-slate-500 dark:text-slate-400">{k}</span>
                  <span className="rdtf-num font-bold text-slate-800 dark:text-white">{v}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> API conectada · caché en vivo
            </div>
          </Card>
        </div>
      </div>

      {modal !== null && <ModalTarifa tarifa={modal.id_tarif ? modal : null} onClose={() => setModal(null)} />}
      {confirmar && (
        <ConfirmModal titulo={`¿Eliminar "${confirmar.tam_tarif}"?`}
          texto={uso[confirmar.id_tarif] ? `Esta tarifa está en uso por ${uso[confirmar.id_tarif]} orden(es). Si la base lo impide, se restaurará automáticamente.` : 'La tarifa dejará de estar disponible para nuevas órdenes.'}
          onCancelar={() => setConfirmar(null)} onConfirmar={() => eliminar(confirmar)} />
      )}
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>
  );
}