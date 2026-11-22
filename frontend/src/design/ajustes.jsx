import { useSyncExternalStore } from 'react';

const CLAVE = 'redtf-ajustes-v1';

export const MONEDAS = [
  { cod: 'USD', sim: '$', nombre: 'Dólar estadounidense' },
  { cod: 'EUR', sim: '€', nombre: 'Euro' },
  { cod: 'COP', sim: '$', nombre: 'Peso colombiano' },
  { cod: 'MXN', sim: '$', nombre: 'Peso mexicano' },
  { cod: 'PEN', sim: 'S/', nombre: 'Sol peruano' },
  { cod: 'VES', sim: 'Bs', nombre: 'Bolívar' },
];
export const LOCALES = [
  { cod: 'es-VE', nombre: 'Español (Venezuela)' },
  { cod: 'es-CO', nombre: 'Español (Colombia)' },
  { cod: 'es-MX', nombre: 'Español (México)' },
  { cod: 'es-ES', nombre: 'Español (España)' },
  { cod: 'en-US', nombre: 'English (US)' },
];
export const REDONDEOS = [
  { v: 'none', nombre: 'Sin redondeo' },
  { v: '0.05', nombre: 'A 0.05' },
  { v: '0.10', nombre: 'A 0.10' },
  { v: '0.50', nombre: 'A 0.50' },
  { v: '1.00', nombre: 'A 1.00' },
];
export const METODOS = ['Efectivo', 'Transferencia', 'Pago Móvil', 'Zelle', 'Binance', 'Tarjeta'];

export const DEFECTOS = {
  negocio: {
    nombre: 'ReDTF Print Studio',
    eslogan: 'Impresión DTF de alta definición',
    rif: 'J-40291837-5',
    telefono: '+58 414 123 4567',
    direccion: 'Av. Principal, Local 12 · Caracas',
  },
  moneda: 'USD', simbolo: '$', posicion: 'prefijo', decimales: 2, locale: 'es-VE',
  mermaPct: 8, cobrarMerma: false, minimoOrden: 3, ivaPct: 16, redondeo: '0.05',
  umbral1: 5, desc1: 0, umbral2: 10, desc2: 8, desc3: 12,
  velocidadM2h: 6, capacidadM2dia: 40, leadDias: 1,
  prefijo: 'FAC-', consecutivo: 1042, vencDias: 15, recargoMoraPct: 0,
  metodos: ['Efectivo', 'Transferencia', 'Pago Móvil', 'Zelle'],
  toastSeg: 5, sonido: true, movimiento: true, tema: 'oscuro', densidad: 'comoda',
  proyeccionMeses: 3, alertaVencidas: true,
  guardadoEn: null,
};

function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) {
      const legado = localStorage.getItem('redtf-theme') || localStorage.getItem('theme');
      const base = { ...DEFECTOS, negocio: { ...DEFECTOS.negocio }, metodos: [...DEFECTOS.metodos] };
      if (legado === 'light' || legado === 'claro') base.tema = 'claro';
      return base;
    }
    const p = JSON.parse(raw);
    return {
      ...DEFECTOS, ...p,
      negocio: { ...DEFECTOS.negocio, ...(p.negocio || {}) },
      metodos: Array.isArray(p.metodos) ? p.metodos : [...DEFECTOS.metodos],
    };
  } catch {
    return { ...DEFECTOS, negocio: { ...DEFECTOS.negocio }, metodos: [...DEFECTOS.metodos] };
  }
}

let estado = cargar();
const oyentes = new Set();
const suscribir = (fn) => { oyentes.add(fn); return () => oyentes.delete(fn); };
const snapshot = () => estado;

export const getAjustes = snapshot;

/* ── Tema: una sola función que pinta el documento ── */
export function temaOscuroActual(tema = estado.tema) {
  if (tema === 'oscuro') return true;
  if (tema === 'claro') return false;
  return typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;
}

export function aplicarTemaDocumento(tema = estado.tema) {
  const oscuro = temaOscuroActual(tema);
  const root = document.documentElement;
  root.classList.toggle('dark', oscuro);
  root.style.colorScheme = oscuro ? 'dark' : 'light';
  root.dataset.tema = oscuro ? 'oscuro' : 'claro';
  return oscuro;
}

function persistir() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch { /* sigue en memoria */ }
  try {
    const v = temaOscuroActual() ? 'dark' : 'light';
    localStorage.setItem('redtf-theme', v);
    localStorage.setItem('theme', v);
  } catch { /* noop */ }
}

export function setAjustes(parche) {
  estado = { ...estado, ...parche, guardadoEn: new Date().toISOString() };
  persistir();
  /* Aplicación SÍNCRONA: el cambio visual ocurre en el mismo tick del clic,
     antes que cualquier effect de React pueda interferir. */
  if (typeof document !== 'undefined') {
    aplicarTemaDocumento(estado.tema);
    document.documentElement.dataset.movimiento = estado.movimiento ? 'on' : 'off';
  }
  oyentes.forEach((fn) => fn());
}
export function setNegocio(parche) { setAjustes({ negocio: { ...estado.negocio, ...parche } }); }
export function resetAjustes() {
  estado = { ...DEFECTOS, negocio: { ...DEFECTOS.negocio }, metodos: [...DEFECTOS.metodos], guardadoEn: new Date().toISOString() };
  persistir();
  if (typeof document !== 'undefined') aplicarTemaDocumento(estado.tema);
  oyentes.forEach((fn) => fn());
}
export function useAjustes() { return useSyncExternalStore(suscribir, snapshot, snapshot); }

if (typeof document !== 'undefined') {
  aplicarTemaDocumento(estado.tema);
  document.documentElement.dataset.movimiento = estado.movimiento ? 'on' : 'off';
  /* Si el SO cambia y el usuario eligió "sistema", seguimos al SO en vivo */
  if (typeof matchMedia !== 'undefined') {
    matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => {
      if (estado.tema === 'sistema') aplicarTemaDocumento(estado.tema);
    });
  }
}

export function fmtMoney(n, a = estado) {
  const v = Number(n || 0);
  const num = v.toLocaleString(a.locale, { minimumFractionDigits: a.decimales, maximumFractionDigits: a.decimales });
  return a.posicion === 'prefijo' ? `${a.simbolo}${num}` : `${num} ${a.simbolo}`;
}
export function fmtFecha(f, conHora = false, a = estado) {
  if (!f) return '—';
  const d = new Date(f);
  if (isNaN(d)) return '—';
  const ops = { day: '2-digit', month: 'short', year: 'numeric' };
  if (conHora) { ops.hour = '2-digit'; ops.minute = '2-digit'; }
  return d.toLocaleDateString(a.locale, ops);
}
export function numFactura(a = estado) { return `${a.prefijo}${String(a.consecutivo).padStart(6, '0')}`; }
export function fechaVenc(a = estado) {
  const d = new Date();
  d.setDate(d.getDate() + Number(a.vencDias || 0));
  return d;
}

/* ── Motor de cotización compartido (formulario de orden + configuración) ── */
export function cotizar(m2, precioM2, a = estado) {
  const m2n = Math.max(0, Number(m2) || 0);
  const precio = Math.max(0, Number(precioM2) || 0);
  const m2plan = m2n * (1 + (Number(a.mermaPct) || 0) / 100);
  const m2fact = a.cobrarMerma ? m2plan : m2n;
  const bruto = m2fact * precio;
  const tier = m2fact < Number(a.umbral1)
    ? { d: Number(a.desc1) || 0, label: `menos de ${a.umbral1} m²` }
    : m2fact < Number(a.umbral2)
      ? { d: Number(a.desc2) || 0, label: `${a.umbral1}–${a.umbral2} m²` }
      : { d: Number(a.desc3) || 0, label: `más de ${a.umbral2} m²` };
  const descuento = bruto * tier.d / 100;
  let base = bruto - descuento;
  const aplicaMinimo = base > 0 && base < Number(a.minimoOrden || 0);
  if (aplicaMinimo) base = Number(a.minimoOrden);
  const iva = base * (Number(a.ivaPct) || 0) / 100;
  const total = base + iva;
  const step = parseFloat(a.redondeo) || 0;
  const totalRed = step ? Math.round(total / step) * step : total;
  const horas = a.velocidadM2h > 0 ? m2plan / Number(a.velocidadM2h) : 0;
  const diasCola = a.capacidadM2dia > 0 ? Math.ceil(m2plan / Number(a.capacidadM2dia)) : 0;
  const entrega = new Date();
  entrega.setDate(entrega.getDate() + Number(a.leadDias || 0) + diasCola);
  return {
    m2plan, m2fact, bruto, tier, descuento, base, aplicaMinimo, iva, total,
    totalRed, ajusteRed: totalRed - total, horas, diasCola, entrega,
  };
}