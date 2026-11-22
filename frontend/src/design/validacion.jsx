import { useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/* ── Reglas reutilizables: devuelven '' si es válido, o el mensaje de error ── */
export const reglas = {
  requerido: (msg = 'Este campo es obligatorio') => (v) =>
    v === null || v === undefined || String(v).trim() === '' ? msg : '',
  nombre: (v) =>
    !v || String(v).trim().length >= 3 ? '' : 'El nombre debe tener al menos 3 caracteres',
  email: (v) =>
    !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Correo inválido: falta @ o dominio (ej: persona@correo.com)',
  telefono: (v) =>
    !v || /^[0-9+\-\s()]{7,15}$/.test(String(v).trim()) ? '' : 'Teléfono inválido: usa entre 7 y 15 dígitos, +, -, ( ) o espacios',
  numeroPositivo: (max = 100000) => (v) => {
    const n = Number(v);
    if (v === '' || v === null || v === undefined) return 'Ingresa un número';
    if (isNaN(n)) return 'Debe ser un número válido';
    if (n <= 0) return 'Debe ser mayor a cero';
    if (n > max) return `Máximo permitido: ${max}`;
    return '';
  },
  enteroPositivo: (max = 100000) => (v) => {
    const n = Number(v);
    if (v === '' || v === null || v === undefined) return 'Ingresa una cantidad';
    if (!Number.isInteger(n)) return 'Debe ser un número entero';
    if (n <= 0) return 'Debe ser al menos 1';
    if (n > max) return `Máximo permitido: ${max}`;
    return '';
  },
  seleccion: (msg = 'Selecciona una opción') => (v) =>
    v === '' || v === null || v === undefined ? msg : '',
  password: (v) =>
    !v || String(v).length >= 6 ? '' : 'La contraseña debe tener al menos 6 caracteres',
};

/* ── Hook de validación: errores en vivo, campos tocados y validación final ── */
export function useValidacion(valoresIniciales, esquema) {
  const [valores, setValores] = useState(valoresIniciales);
  const [errores, setErrores] = useState({});
  const [tocados, setTocados] = useState({});
  const [enviado, setEnviado] = useState(false);

  const validarCampo = useCallback((campo, valor, todos) => {
    const reglasCampo = esquema[campo] || [];
    for (const r of reglasCampo) {
      const msg = r(valor, todos || valores);
      if (msg) return msg;
    }
    return '';
  }, [esquema, valores]);

  const cambiar = (campo) => (e) => {
    const valor = e?.target ? e.target.value : e;
    setValores((prev) => {
      const next = { ...prev, [campo]: valor };
      setErrores((errs) => ({ ...errs, [campo]: validarCampo(campo, valor, next) }));
      return next;
    });
  };

  const tocar = (campo) => () => setTocados((t) => ({ ...t, [campo]: true }));

  const mostrarError = (campo) =>
    (tocados[campo] || enviado) && errores[campo] ? errores[campo] : '';

  const validarTodo = () => {
    const errs = {};
    Object.keys(esquema).forEach((campo) => {
      const msg = validarCampo(campo, valores[campo], valores);
      if (msg) errs[campo] = msg;
    });
    setErrores(errs);
    setTocados(Object.keys(esquema).reduce((a, k) => ({ ...a, [k]: true }), {}));
    setEnviado(true);
    return { ok: Object.keys(errs).length === 0, errs };
  };

  const reset = (nuevos = valoresIniciales) => {
    setValores(nuevos); setErrores({}); setTocados({}); setEnviado(false);
  };

  return { valores, errores, tocados, enviado, cambiar, tocar, mostrarError, validarTodo, reset, setValores };
}

/* ── Envoltorio de campo con retroalimentación visual accesible ── */
export function Campo({ label, error, valido, children, ayuda, obligatorio }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">
          {label} {obligatorio && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="rdtf-rise mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-300">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {error}
        </p>
      ) : valido ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5" /> Listo
        </p>
      ) : ayuda ? (
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{ayuda}</p>
      ) : null}
    </div>
  );
}

/* ── Resumen de errores para el envío (retroalimentación clara) ── */
export function ResumenErrores({ errores }) {
  const lista = Object.entries(errores || {}).filter(([, v]) => v);
  if (!lista.length) return null;
  return (
    <div role="alert" className="rdtf-rise rounded-xl border border-rose-400/40 bg-rose-500/10 p-3.5">
      <p className="flex items-center gap-2 text-sm font-bold text-rose-600 dark:text-rose-300">
        <AlertCircle className="w-4 h-4" /> Corrige {lista.length} campo{lista.length > 1 ? 's' : ''} antes de continuar
      </p>
      <ul className="mt-1.5 ml-6 list-disc space-y-0.5 text-xs text-rose-600 dark:text-rose-300">
        {lista.map(([k, v]) => <li key={k}>{v}</li>)}
      </ul>
    </div>
  );
}

/* ── Clase de borde según estado, para inputs ── */
export const bordeCampo = (error, valido) =>
  error
    ? 'border-rose-400 focus:ring-rose-500/50 focus:border-rose-400'
    : valido
      ? 'border-emerald-400/70 focus:ring-emerald-500/50 focus:border-emerald-400'
      : 'border-slate-300/70 dark:border-gray-600 focus:ring-violet-500/60 focus:border-violet-400';