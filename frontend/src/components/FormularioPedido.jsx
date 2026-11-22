import { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { ShoppingCart, X, Calculator, User, Tag, Ruler, Hash, CheckCircle, Clock } from 'lucide-react';
import { cx, Btn, inputCls, labelCls, money, fFecha, useToasts, Toasts } from '../design/sistema';
import { cotizar, useAjustes } from '../design/ajustes';
import { reglas, useValidacion, Campo, ResumenErrores, bordeCampo } from '../design/validacion';

const ESQUEMA = {
  id_cli: [reglas.seleccion('Selecciona un cliente')],
  id_tarif: [reglas.seleccion('Selecciona el tipo de impresión')],
  larcm_order: [reglas.numeroPositivo(10000)],
  ancm_order: [reglas.numeroPositivo(10000)],
  can_order: [reglas.enteroPositivo(100000)],
};

export default function FormularioPedido({ onPedidoCreado, onClose }) {
  const qc = useQueryClient();
  const ajustes = useAjustes();
  const { toasts, push, cerrar } = useToasts();
  const { valores, cambiar, tocar, mostrarError, validarTodo, reset } = useValidacion(
    { id_cli: '', id_tarif: '', larcm_order: '', ancm_order: '', can_order: 1, id_estado: 1 },
    ESQUEMA
  );
  const [enviando, setEnviando] = useState(false);
  const [erroresEnvio, setErroresEnvio] = useState(null);

  const { data: clientes } = useQuery({ queryKey: ['clientes'], queryFn: async () => (await api.get('/clientes/')).data });
  const { data: tarifas } = useQuery({ queryKey: ['tarifas'], queryFn: async () => (await api.get('/tarifas/')).data });
  const { data: estados } = useQuery({ queryKey: ['estadosProd'], queryFn: async () => (await api.get('/ordenes/estados-produccion/')).data });

  const tarifa = useMemo(() => (tarifas ?? []).find((t) => t.id_tarif === parseInt(valores.id_tarif)), [tarifas, valores.id_tarif]);
  const m2 = (Number(valores.larcm_order) || 0) * (Number(valores.ancm_order) || 0) * (Number(valores.can_order) || 0) / 10000;
  const calc = useMemo(() => cotizar(m2, tarifa ? Number(tarifa.pre_tarif) : 0, ajustes), [m2, tarifa, ajustes]);
  const calcValido = m2 > 0 && !!tarifa;

  const enviar = async (e) => {
    e.preventDefault();
    setErroresEnvio(null);
    const { ok, errs } = validarTodo();
    if (!ok) { setErroresEnvio(errs); return; }
    setEnviando(true);
    try {
      await api.post('/ordenes/', {
        id_cli: parseInt(valores.id_cli),
        id_tarif: parseInt(valores.id_tarif),
        larcm_order: parseFloat(valores.larcm_order),
        ancm_order: parseFloat(valores.ancm_order),
        can_order: parseInt(valores.can_order),
        id_estado: parseInt(valores.id_estado),
      });
      qc.invalidateQueries(['ordenes']);
      qc.invalidateQueries(['dashboardStats']);
      push('success', `Orden registrada por ${money(calc.totalRed)} · factura generada automáticamente.`);
      reset();
      onPedidoCreado?.();
      setTimeout(onClose, 700);
    } catch (err) {
      const detalle = err.response?.data?.detail || err.message;
      setErroresEnvio({ servidor: detalle });
      push('error', `No se pudo registrar: ${detalle}`);
    } finally {
      setEnviando(false);
    }
  };

  const numCls = (campo, extra = '') =>
    cx(inputCls, 'w-full rdtf-num', extra, bordeCampo(mostrarError(campo), !mostrarError(campo) && String(valores[campo]) !== '' && Number(valores[campo]) > 0));

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

        <form onSubmit={enviar} noValidate className="p-5 space-y-4">
          {erroresEnvio && <ResumenErrores errores={erroresEnvio} />}

          <Campo label="Cliente" obligatorio error={mostrarError('id_cli')}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select value={valores.id_cli} onChange={cambiar('id_cli')} onBlur={tocar('id_cli')}
                aria-invalid={!!mostrarError('id_cli')}
                className={cx(inputCls, 'w-full pl-9', bordeCampo(mostrarError('id_cli'), !!valores.id_cli))}>
                <option value="">Seleccionar cliente…</option>
                {(clientes ?? []).map((c) => <option key={c.id_cli} value={c.id_cli}>{c.nombre_user}{c.telf_user ? ` · ${c.telf_user}` : ''}</option>)}
              </select>
            </div>
          </Campo>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Campo label="Tipo de impresión" obligatorio error={mostrarError('id_tarif')}>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select value={valores.id_tarif} onChange={cambiar('id_tarif')} onBlur={tocar('id_tarif')}
                  aria-invalid={!!mostrarError('id_tarif')}
                  className={cx(inputCls, 'w-full pl-9', bordeCampo(mostrarError('id_tarif'), !!valores.id_tarif))}>
                  <option value="">Seleccionar tarifa…</option>
                  {(tarifas ?? []).map((t) => <option key={t.id_tarif} value={t.id_tarif}>{t.tam_tarif} · {money(t.pre_tarif)}/m²</option>)}
                </select>
              </div>
            </Campo>
            <Campo label="Estado inicial">
              <select value={valores.id_estado} onChange={cambiar('id_estado')} className={cx(inputCls, 'w-full')}>
                {(estados ?? []).map((e) => <option key={e.id_estado} value={e.id_estado}>{e.nom_estado}</option>)}
              </select>
            </Campo>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Campo label="Largo (cm)" obligatorio error={mostrarError('larcm_order')}>
              <div className="relative">
                <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" min="0.1" step="0.1" value={valores.larcm_order}
                  onChange={cambiar('larcm_order')} onBlur={tocar('larcm_order')}
                  aria-invalid={!!mostrarError('larcm_order')} placeholder="30" className={numCls('larcm_order', 'pl-9')} />
              </div>
            </Campo>
            <Campo label="Ancho (cm)" obligatorio error={mostrarError('ancm_order')}>
              <input type="number" min="0.1" step="0.1" value={valores.ancm_order}
                onChange={cambiar('ancm_order')} onBlur={tocar('ancm_order')}
                aria-invalid={!!mostrarError('ancm_order')} placeholder="40" className={numCls('ancm_order')} />
            </Campo>
            <Campo label="Cantidad" obligatorio error={mostrarError('can_order')}>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="number" min="1" step="1" value={valores.can_order}
                  onChange={cambiar('can_order')} onBlur={tocar('can_order')}
                  aria-invalid={!!mostrarError('can_order')} className={numCls('can_order', 'pl-9')} />
              </div>
            </Campo>
          </div>

          <div className={cx('rounded-xl border p-4 transition-all', calcValido
            ? 'border-fuchsia-400/40 bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-sky-500/10'
            : 'border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/60')}>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-fuchsia-600 dark:text-fuchsia-300 mb-3">
              <Calculator className="w-4 h-4" /> Cálculo automático en vivo
            </p>
            {calcValido ? (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div><p className="rdtf-num text-lg font-extrabold text-sky-600 dark:text-sky-300">{calc.m2fact.toFixed(4)}</p><p className="text-[11px] text-slate-400">m² facturables</p></div>
                  <div><p className="rdtf-num text-lg font-extrabold text-violet-600 dark:text-violet-300">{money(tarifa.pre_tarif)}</p><p className="text-[11px] text-slate-400">precio / m²</p></div>
                  <div><p className="rdtf-num text-lg font-extrabold text-emerald-600 dark:text-emerald-300">{money(calc.totalRed)}</p><p className="text-[11px] text-slate-400">total con IVA</p></div>
                </div>
                <ul className="space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <li>Subtotal: {money(calc.bruto)}{calc.descuento > 0 && <> · Descuento {calc.tier.d}% ({calc.tier.label}): −{money(calc.descuento)}</>}</li>
                  <li>IVA {ajustes.ivaPct}%: {money(calc.iva)}{calc.aplicaMinimo && <> · Aplica mínimo {money(ajustes.minimoOrden)}</>}</li>
                  <li className="flex items-center gap-1"><Clock className="w-3 h-3" /> Entrega estimada: {fFecha(calc.entrega)} ({calc.horas.toFixed(1)} h de impresión)</li>
                </ul>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Completa tarifa, dimensiones y cantidad para ver el desglose en vivo.</p>
            )}
          </div>

          <div className="flex gap-2.5 pt-1">
            <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={enviando} className="flex-1">
              {enviando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Registrar orden
            </Btn>
          </div>
        </form>
      </div>
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>, document.body);
}