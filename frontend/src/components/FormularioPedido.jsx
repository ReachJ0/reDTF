import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { ShoppingCart, X, Calculator, User, Tag, Ruler, Hash, CheckCircle } from 'lucide-react';
import { cx, Btn, inputCls, labelCls, money, useToasts, Toasts } from '../design/sistema';

export default function FormularioPedido({ onPedidoCreado, onClose }) {
  const qc = useQueryClient();
  const { toasts, push, cerrar } = useToasts();
  const [form, setForm] = useState({ id_cli: '', id_tarif: '', larcm_order: '', ancm_order: '', can_order: 1, id_estado: 1 });
  const [enviando, setEnviando] = useState(false);

  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: async () => (await api.get('/clientes/')).data });
  const { data: tarifas } = useQuery({ queryKey: ['tarifas'], queryFn: async () => (await api.get('/tarifas/')).data });
  const { data: estados } = useQuery({ queryKey: ['estadosProd'], queryFn: async () => (await api.get('/ordenes/estados-produccion/')).data });

  useEffect(() => {
    if (estados?.length && !estados.some((e) => e.id_estado === Number(form.id_estado))) {
      setForm((f) => ({ ...f, id_estado: estados[0].id_estado }));
    }
  }, [estados]);

  const tarifa = useMemo(() => (tarifas ?? []).find((t) => t.id_tarif === parseInt(form.id_tarif)), [tarifas, form.id_tarif]);
  const calc = useMemo(() => {
    const l = parseFloat(form.larcm_order), a = parseFloat(form.ancm_order), c = parseInt(form.can_order);
    if (!(l > 0 && a > 0 && c > 0)) return null;
    const m2 = (l * a * c) / 10000;
    return { m2, subtotal: tarifa ? m2 * Number(tarifa.pre_tarif) : 0 };
  }, [form.larcm_order, form.ancm_order, form.can_order, tarifa]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const enviar = async (e) => {
    e.preventDefault();
    if (!form.id_cli || !form.id_tarif) return push('error', 'Selecciona cliente y tipo de impresión.');
    if (!calc) return push('error', 'Las dimensiones y cantidad deben ser mayores a cero.');
    setEnviando(true);
    try {
      await api.post('/pedidos/', {
        id_cli: parseInt(form.id_cli),
        id_tarif: parseInt(form.id_tarif),
        larcm_order: parseFloat(form.larcm_order),
        ancm_order: parseFloat(form.ancm_order),
        can_order: parseInt(form.can_order),
        id_estado: parseInt(form.id_estado),
      });
      qc.invalidateQueries(['ordenes']);
      qc.invalidateQueries(['dashboardStats']);
      push('success', `Orden registrada por ${money(calc.subtotal)} · factura generada automáticamente.`);
      onPedidoCreado?.();
      setTimeout(onClose, 800);
    } catch (err) {
      push('error', `No se pudo registrar: ${err.response?.data?.detail || err.message}`);
    } finally { setEnviando(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="rdtf-scrim absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="rdtf-menu rdtf-scroll relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-violet-400/30 bg-white dark:bg-gray-900 shadow-2xl">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/15"><ShoppingCart className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-extrabold">Nueva Orden</h2>
              <p className="text-xs opacity-85">Producción + factura en un solo paso</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-white/15 transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={enviar} className="p-5 space-y-4">
          <div>
            <label className={labelCls}><User className="inline w-3.5 h-3.5 mr-1" />Cliente *</label>
            <select value={form.id_cli} onChange={set('id_cli')} required className={cx(inputCls, 'w-full')}>
              <option value="">Seleccionar cliente…</option>
              {(clientes ?? []).map((c) => <option key={c.id_cli} value={c.id_cli}>{c.nombre_user}{c.telf_user ? ` · ${c.telf_user}` : ''}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}><Tag className="inline w-3.5 h-3.5 mr-1" />Tipo de impresión *</label>
              <select value={form.id_tarif} onChange={set('id_tarif')} required className={cx(inputCls, 'w-full')}>
                <option value="">Seleccionar tarifa…</option>
                {(tarifas ?? []).map((t) => <option key={t.id_tarif} value={t.id_tarif}>{t.tam_tarif} · {money(t.pre_tarif)}/m²</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Estado inicial de producción</label>
              <select value={form.id_estado} onChange={set('id_estado')} className={cx(inputCls, 'w-full')}>
                {(estados ?? []).map((e) => <option key={e.id_estado} value={e.id_estado}>{e.nom_estado}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}><Ruler className="inline w-3.5 h-3.5 mr-1" />Largo (cm)</label>
              <input type="number" min="0.1" step="0.1" value={form.larcm_order} onChange={set('larcm_order')} required placeholder="30" className={cx(inputCls, 'w-full rdtf-num')} />
            </div>
            <div>
              <label className={labelCls}>Ancho (cm)</label>
              <input type="number" min="0.1" step="0.1" value={form.ancm_order} onChange={set('ancm_order')} required placeholder="40" className={cx(inputCls, 'w-full rdtf-num')} />
            </div>
            <div>
              <label className={labelCls}><Hash className="inline w-3.5 h-3.5 mr-1" />Cantidad</label>
              <input type="number" min="1" step="1" value={form.can_order} onChange={set('can_order')} required className={cx(inputCls, 'w-full rdtf-num')} />
            </div>
          </div>

          <div className={cx('rounded-xl border p-4 transition-all', calc ? 'border-fuchsia-400/40 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-sky-500/10' : 'border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/60')}>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-300 mb-3">
              <Calculator className="w-4 h-4" /> Cálculo automático
            </p>
            {calc ? (
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="rdtf-num text-xl font-extrabold text-sky-600 dark:text-sky-300">{calc.m2.toFixed(4)}</p><p className="text-[11px] text-slate-400">m² totales</p></div>
                <div><p className="rdtf-num text-xl font-extrabold text-violet-600 dark:text-violet-300">{tarifa ? money(tarifa.pre_tarif) : '—'}</p><p className="text-[11px] text-slate-400">precio / m²</p></div>
                <div><p className="rdtf-num text-xl font-extrabold text-emerald-600 dark:text-emerald-300">{money(calc.subtotal)}</p><p className="text-[11px] text-slate-400">subtotal</p></div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Completa tarifa, dimensiones y cantidad para ver el subtotal en vivo.</p>
            )}
          </div>

          <div className="flex gap-2.5 pt-1">
            <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={enviando || !calc} className="flex-1">
              {enviando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Registrar orden
            </Btn>
          </div>
        </form>
      </div>
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>, document.body);
}