import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown, Bookmark, Calendar, Check,
  CheckCircle, ChevronDown, Clock, CreditCard, Download, Eye, FileText, Filter,
  Hash, Inbox, Package, Phone, Printer, RefreshCw, RotateCcw, Ruler, Save,
  Search, SlidersHorizontal, Trash2, X, XCircle
} from 'lucide-react';

/* ─────────────────────────  SISTEMA DE COLOR  ───────────────────────── */

const ESTILOS_PROD = {
  'Pendiente': {
    icon: Clock,
    badge: 'bg-amber-400/10 text-amber-600 dark:text-amber-300 border-amber-400/40',
    text: 'text-amber-600 dark:text-amber-300',
    hover: 'hover:bg-amber-400/10',
    dot: 'bg-amber-400',
    grad: 'from-amber-400 to-orange-500',
  },
  'Imprimiendo': {
    icon: Printer,
    badge: 'bg-sky-400/10 text-sky-600 dark:text-sky-300 border-sky-400/40',
    text: 'text-sky-600 dark:text-sky-300',
    hover: 'hover:bg-sky-400/10',
    dot: 'bg-sky-400',
    grad: 'from-sky-400 to-blue-600',
  },
  'En Revision': {
    icon: AlertTriangle,
    badge: 'bg-orange-400/10 text-orange-600 dark:text-orange-300 border-orange-400/40',
    text: 'text-orange-600 dark:text-orange-300',
    hover: 'hover:bg-orange-400/10',
    dot: 'bg-orange-400',
    grad: 'from-orange-400 to-rose-500',
  },
  'Entregado': {
    icon: Package,
    badge: 'bg-violet-400/10 text-violet-600 dark:text-violet-300 border-violet-400/40',
    text: 'text-violet-600 dark:text-violet-300',
    hover: 'hover:bg-violet-400/10',
    dot: 'bg-violet-400',
    grad: 'from-violet-400 to-fuchsia-500',
  },
  default: {
    icon: Clock,
    badge: 'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/40',
    text: 'text-slate-600 dark:text-slate-300',
    hover: 'hover:bg-slate-400/10',
    dot: 'bg-slate-400',
    grad: 'from-slate-400 to-slate-500',
  },
};

const ESTILOS_PAGO = {
  'Pendiente': {
    icon: Clock,
    badge: 'bg-amber-400/10 text-amber-600 dark:text-amber-300 border-amber-400/40',
    text: 'text-amber-600 dark:text-amber-300',
    hover: 'hover:bg-amber-400/10',
    dot: 'bg-amber-400',
    grad: 'from-amber-400 to-orange-500',
  },
  'Pagada': {
    icon: CheckCircle,
    badge: 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 border-emerald-400/40',
    text: 'text-emerald-600 dark:text-emerald-300',
    hover: 'hover:bg-emerald-400/10',
    dot: 'bg-emerald-400',
    grad: 'from-emerald-400 to-teal-500',
  },
  'Cancelada': {
    icon: XCircle,
    badge: 'bg-rose-400/10 text-rose-600 dark:text-rose-300 border-rose-400/40',
    text: 'text-rose-600 dark:text-rose-300',
    hover: 'hover:bg-rose-400/10',
    dot: 'bg-rose-400',
    grad: 'from-rose-400 to-red-600',
  },
  'Vencida': {
    icon: AlertTriangle,
    badge: 'bg-orange-400/10 text-orange-600 dark:text-orange-300 border-orange-400/40',
    text: 'text-orange-600 dark:text-orange-300',
    hover: 'hover:bg-orange-400/10',
    dot: 'bg-orange-400',
    grad: 'from-orange-400 to-amber-600',
  },
  default: {
    icon: Clock,
    badge: 'bg-slate-400/10 text-slate-600 dark:text-slate-300 border-slate-400/40',
    text: 'text-slate-600 dark:text-slate-300',
    hover: 'hover:bg-slate-400/10',
    dot: 'bg-slate-400',
    grad: 'from-slate-400 to-slate-500',
  },
};

const estiloProd = (n) => ESTILOS_PROD[n] || ESTILOS_PROD.default;
const estiloPago = (n) => ESTILOS_PAGO[n] || ESTILOS_PAGO.default;
const cx = (...c) => c.filter(Boolean).join(' ');

const formatearFecha = (f) => {
  if (!f) return '—';
  const d = new Date(f);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};
const formatearFechaHora = (f) => {
  if (!f) return '—';
  const d = new Date(f);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};
const money = (n) => `$${Number(n || 0).toFixed(2)}`;
const hoyISO = () => new Date().toISOString().slice(0, 10);

/* ─────────────────────────  CSS DEL ARTIFACTO  ───────────────────────── */

const CSS = `
.rdtf-scroll{scrollbar-width:thin;scrollbar-color:#8b5cf6 rgba(148,163,184,.14)}
.rdtf-scroll::-webkit-scrollbar{width:10px;height:10px}
.rdtf-scroll::-webkit-scrollbar-track{background:rgba(148,163,184,.08);border-radius:8px}
.rdtf-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8b5cf6,#6366f1);border-radius:8px;border:2px solid transparent;background-clip:padding-box}
.rdtf-scroll::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#a78bfa,#818cf8);border:2px solid transparent;background-clip:padding-box}
@keyframes rdtf-pop{from{opacity:0;transform:scale(.95) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes rdtf-slide{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes rdtf-fade{from{opacity:0}to{opacity:1}}
@keyframes rdtf-toast{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes rdtf-bar{from{width:100%}to{width:0%}}
@keyframes rdtf-shimmer{from{background-position:-400px 0}to{background-position:400px 0}}
@keyframes rdtf-rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.rdtf-menu{animation:rdtf-pop .14s ease-out}
.rdtf-drawer{animation:rdtf-slide .24s cubic-bezier(.22,1,.36,1)}
.rdtf-scrim{animation:rdtf-fade .18s ease-out}
.rdtf-toast{animation:rdtf-toast .22s ease-out}
.rdtf-rise{animation:rdtf-rise .25s ease-out}
.rdtf-shimmer{background:linear-gradient(90deg,rgba(148,163,184,.08) 25%,rgba(148,163,184,.2) 50%,rgba(148,163,184,.08) 75%);background-size:800px 100%;animation:rdtf-shimmer 1.4s infinite linear}
`;

/* ─────────────────────────  MENÚ DE ESTADO (PORTAL)  ───────────────────────── */

function EstadoMenu({ valor, nombre, opciones, getEstilo, onSeleccionar, disabled, align = 'left', compact }) {
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const estilo = getEstilo(nombre);
  const Icono = estilo.icon;

  const cerrar = useCallback(() => setAbierto(false), []);

  const abrir = () => {
    if (disabled || !opciones?.length) return;
    const r = btnRef.current.getBoundingClientRect();
    const W = 232;
    const H = Math.min(opciones.length * 42 + 10, 300);
    let left = align === 'right' ? r.right - W : r.left;
    left = Math.max(8, Math.min(left, window.innerWidth - W - 8));
    const abajo = window.innerHeight - r.bottom;
    const top = abajo < H + 14 && r.top > H + 14 ? r.top - H - 6 : r.bottom + 6;
    setPos({ top, left });
    setAbierto(true);
  };

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e) => {
      if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
      cerrar();
    };
    const tecla = (e) => { if (e.key === 'Escape') cerrar(); };
    window.addEventListener('mousedown', fuera);
    window.addEventListener('keydown', tecla);
    window.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    return () => {
      window.removeEventListener('mousedown', fuera);
      window.removeEventListener('keydown', tecla);
      window.removeEventListener('scroll', cerrar, true);
      window.removeEventListener('resize', cerrar);
    };
  }, [abierto, cerrar]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => { e.stopPropagation(); abierto ? cerrar() : abrir(); }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className={cx(
          'inline-flex items-center gap-1.5 rounded-lg border font-semibold transition-all',
          compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
          estilo.badge,
          'hover:shadow-md hover:brightness-110 disabled:opacity-60 disabled:cursor-wait'
        )}
      >
        {disabled
          ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          : <Icono className="w-3.5 h-3.5" />}
        <span className="whitespace-nowrap">{nombre || 'Sin estado'}</span>
        <ChevronDown className={cx('w-3 h-3 opacity-70 transition-transform', abierto && 'rotate-180')} />
      </button>

      {abierto && createPortal(
        <div
          ref={menuRef}
          role="listbox"
          className="rdtf-menu rdtf-scroll fixed z-[9999] w-[232px] max-h-[300px] overflow-y-auto rounded-xl border border-violet-400/30 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-violet-950/40 py-1.5"
          style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="px-3.5 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Cambiar estado
          </p>
          {opciones.map((op) => {
            const e = getEstilo(op.nom_estado);
            const I = e.icon;
            const activo = op.id_estado === valor;
            return (
              <button
                key={op.id_estado}
                type="button"
                role="option"
                aria-selected={activo}
                onClick={(ev) => { ev.stopPropagation(); onSeleccionar(op.id_estado); cerrar(); }}
                className={cx(
                  'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] font-medium transition-colors',
                  e.text, e.hover,
                  activo && 'bg-violet-500/10 dark:bg-violet-400/10'
                )}
              >
                <span className={cx('w-2 h-2 rounded-full shrink-0', e.dot)} />
                <I className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{op.nom_estado}</span>
                {activo && <Check className="w-4 h-4 shrink-0" />}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

/* ─────────────────────────  TOASTS  ───────────────────────── */

function Toasts({ items, onCerrar }) {
  if (!items.length) return null;
  const cfg = {
    success: { icon: CheckCircle, cls: 'text-emerald-500 dark:text-emerald-300 border-emerald-400/40', bar: 'bg-emerald-400' },
    error: { icon: XCircle, cls: 'text-rose-500 dark:text-rose-300 border-rose-400/40', bar: 'bg-rose-400' },
    info: { icon: AlertTriangle, cls: 'text-sky-500 dark:text-sky-300 border-sky-400/40', bar: 'bg-sky-400' },
  };
  return createPortal(
    <div className="fixed top-4 right-4 z-[10050] flex flex-col gap-2.5 w-[min(92vw,380px)]">
      {items.map((t) => {
        const c = cfg[t.tipo] || cfg.info;
        const I = c.icon;
        return (
          <div key={t.id} className={cx('rdtf-toast relative overflow-hidden rounded-xl border bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/30 p-3.5 pr-9', c.cls)}>
            <div className="flex items-start gap-2.5">
              <I className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 leading-snug">{t.msg}</p>
                {t.accion && (
                  <button
                    type="button"
                    onClick={() => { t.accion.fn(); onCerrar(t.id); }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-300 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> {t.accion.label}
                  </button>
                )}
              </div>
            </div>
            <button type="button" onClick={() => onCerrar(t.id)} aria-label="Cerrar notificación"
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
              <X className="w-4 h-4" />
            </button>
            <span className={cx('absolute bottom-0 left-0 h-0.5', c.bar)} style={{ animation: `rdtf-bar ${t.duracion}ms linear forwards` }} />
          </div>
        );
      })}
    </div>,
    document.body
  );
}

/* ─────────────────────────  COMPONENTE PRINCIPAL  ───────────────────────── */

export default function TablaOrdenes() {
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [filtroProd, setFiltroProd] = useState('');
  const [filtroPago, setFiltroPago] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [preset, setPreset] = useState('');
  const [orden, setOrden] = useState({ campo: 'id_order', dir: 'desc' });
  const [densidad, setDensidad] = useState('comoda');
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [drawerId, setDrawerId] = useState(null);
  const [confirmar, setConfirmar] = useState(null);
  const [pendientes, setPendientes] = useState({});
  const [toasts, setToasts] = useState([]);
  const [vistas, setVistas] = useState(() => {
    try { return JSON.parse(localStorage.getItem('redtf_vistas_ordenes') || '[]'); } catch { return []; }
  });
  const [panelVistas, setPanelVistas] = useState(false);
  const [nombreVista, setNombreVista] = useState('');
  const toastId = useRef(0);

  const { data: estadosProdRaw } = useQuery({
    queryKey: ['estadosProd'],
    queryFn: async () => (await api.get('/ordenes/estados-produccion/')).data,
  });
  const { data: estadosPagoRaw } = useQuery({
    queryKey: ['estadosPago'],
    queryFn: async () => (await api.get('/ordenes/estados-pago/')).data,
  });
  const estadosProd = estadosProdRaw ?? [];
  const estadosPago = estadosPagoRaw ?? [];

  const { data: ordenesRaw, isLoading, isError, refetch } = useQuery({
    queryKey: ['ordenes'],
    queryFn: async () => (await api.get('/ordenes/')).data,
  });
  const ordenes = ordenesRaw ?? [];

  useEffect(() => {
    localStorage.setItem('redtf_vistas_ordenes', JSON.stringify(vistas));
  }, [vistas]);

  useEffect(() => {
    const lock = drawerId !== null || confirmar !== null;
    document.body.style.overflow = lock ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerId, confirmar]);

  useEffect(() => {
    const tecla = (e) => {
      if (e.key === 'Escape') { setDrawerId(null); setConfirmar(null); setPanelVistas(false); }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, []);

  const toast = useCallback((tipo, msg, accion = null, duracion = 4500) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, tipo, msg, accion, duracion }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), duracion);
  }, []);
  const cerrarToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  /* ── Mutación de estado con update optimista + deshacer ── */
  const aplicarEstado = useCallback((ord, tipo, nuevoId, { undoable = true } = {}) => {
    const campoId = tipo === 'prod' ? 'id_estado_prod' : 'id_estado_pago';
    const campoNom = tipo === 'prod' ? 'nom_estado_prod' : 'nom_estado_pago';
    const lista = tipo === 'prod' ? estadosProd : estadosPago;
    const nuevo = lista.find((e) => e.id_estado === nuevoId);
    const anteriorId = ord[campoId];
    if (anteriorId === nuevoId || !nuevo) return;

    const key = `${ord.id_order}:${tipo}`;
    const snapshot = queryClient.getQueryData(['ordenes']);
    queryClient.setQueryData(['ordenes'], (prev = []) =>
      prev.map((o) => o.id_order === ord.id_order ? { ...o, [campoId]: nuevoId, [campoNom]: nuevo.nom_estado } : o)
    );
    setPendientes((p) => ({ ...p, [key]: true }));

    const url = tipo === 'prod' ? `/ordenes/${ord.id_order}/estado-prod` : `/ordenes/${ord.id_order}/estado-pago`;
    api.put(url, { id_estado: nuevoId })
      .then(() => {
        queryClient.invalidateQueries(['ordenes']);
        queryClient.invalidateQueries(['dashboardStats']);
        const etiqueta = tipo === 'prod' ? 'Producción' : 'Pago';
        toast('success', `Orden #${ord.id_order} · ${etiqueta} → ${nuevo.nom_estado}`,
          undoable ? {
            label: 'Deshacer',
            fn: () => aplicarEstado({ ...ord, [campoId]: nuevoId, [campoNom]: nuevo.nom_estado }, tipo, anteriorId, { undoable: false }),
          } : null,
          undoable ? 6000 : 3500);
      })
      .catch((err) => {
        queryClient.setQueryData(['ordenes'], snapshot);
        toast('error', `No se pudo actualizar: ${err.response?.data?.detail || err.message}`);
      })
      .finally(() => setPendientes((p) => { const n = { ...p }; delete n[key]; return n; }));
  }, [estadosProd, estadosPago, queryClient, toast]);

  /* ── Eliminación con confirmación ── */
  const ejecutarEliminar = async (ids) => {
    setConfirmar(null);
    const snapshot = queryClient.getQueryData(['ordenes']);
    queryClient.setQueryData(['ordenes'], (prev = []) => prev.filter((o) => !ids.includes(o.id_order)));
    setSeleccion((s) => { const n = new Set(s); ids.forEach((i) => n.delete(i)); return n; });
    if (ids.includes(drawerId)) setDrawerId(null);

    const res = await Promise.allSettled(ids.map((id) => api.delete(`/pedidos/${id}`)));
    const fallos = res.filter((r) => r.status === 'rejected').length;
    const ok = res.length - fallos;
    if (fallos) {
      queryClient.setQueryData(['ordenes'], snapshot);
      toast('error', `${fallos} orden(es) no pudieron eliminarse. Se restauraron los datos.`);
    }
    if (ok) toast('success', `${ok} orden(es) eliminada(s) correctamente.`);
    queryClient.invalidateQueries(['ordenes']);
    queryClient.invalidateQueries(['dashboardStats']);
  };

  /* ── Cobro masivo ── */
  const cobrarSeleccion = () => {
    const pagada = estadosPago.find((e) => e.nom_estado === 'Pagada');
    if (!pagada) return toast('info', 'No existe el estado "Pagada" en la base de datos.');
    const objetivo = ordenes.filter((o) => seleccion.has(o.id_order) && o.id_estado_pago !== pagada.id_estado && o.id_fac);
    if (!objetivo.length) return toast('info', 'Las órdenes seleccionadas ya están pagadas o no tienen factura.');
    objetivo.forEach((o) => aplicarEstado(o, 'pago', pagada.id_estado, { undoable: false }));
    toast('success', `${objetivo.length} orden(es) marcadas como pagadas.`);
    setSeleccion(new Set());
  };

  /* ── Filtrado + ordenado ── */
  const filtradas = useMemo(() => {
    const d = desde ? new Date(desde + 'T00:00:00') : null;
    const h = hasta ? new Date(hasta + 'T23:59:59') : null;
    const q = busqueda.trim().toLowerCase();
    const list = ordenes.filter((o) => {
      if (q && !String(o.id_order).includes(q) && !(o.nombre_cliente || '').toLowerCase().includes(q)) return false;
      if (filtroProd && o.id_estado_prod !== parseInt(filtroProd)) return false;
      if (filtroPago && o.id_estado_pago !== parseInt(filtroPago)) return false;
      if (d || h) {
        const f = o.fec_creacion ? new Date(o.fec_creacion) : null;
        if (!f) return false;
        if (d && f < d) return false;
        if (h && f > h) return false;
      }
      return true;
    });
    const dir = orden.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const c = orden.campo;
      if (c === 'nombre_cliente') return dir * String(a[c] || '').localeCompare(String(b[c] || ''), 'es');
      if (c === 'fec_creacion') return dir * ((new Date(a[c] || 0)) - (new Date(b[c] || 0)));
      return dir * (Number(a[c] || 0) - Number(b[c] || 0));
    });
  }, [ordenes, busqueda, filtroProd, filtroPago, desde, hasta, orden]);

  const filtrosActivos = busqueda || filtroProd || filtroPago || desde || hasta;
  const limpiarFiltros = () => { setBusqueda(''); setFiltroProd(''); setFiltroPago(''); setDesde(''); setHasta(''); setPreset(''); };

  const aplicarPreset = (v) => {
    setPreset(v);
    const hoy = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    if (v === 'hoy') { setDesde(iso(hoy)); setHasta(iso(hoy)); }
    else if (v === '7' || v === '30') {
      const ini = new Date(hoy); ini.setDate(ini.getDate() - (parseInt(v) - 1));
      setDesde(iso(ini)); setHasta(iso(hoy));
    } else { setDesde(''); setHasta(''); }
  };

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    const total = filtradas.length;
    const ingresos = filtradas.reduce((s, o) => s + Number(o.sub_order || 0), 0);
    const entregadas = filtradas.filter((o) => o.nom_estado_prod === 'Entregado').length;
    const pendCobro = filtradas.filter((o) => o.nom_estado_pago === 'Pendiente');
    return {
      total, ingresos, entregadas,
      porCobrar: pendCobro.reduce((s, o) => s + Number(o.mont_fac || o.sub_order || 0), 0),
      nPend: pendCobro.length,
      m2: filtradas.reduce((s, o) => s + Number(o.m2_total || 0), 0),
    };
  }, [filtradas]);

  /* ── Selección ── */
  const todosSel = filtradas.length > 0 && filtradas.every((o) => seleccion.has(o.id_order));
  const algunosSel = filtradas.some((o) => seleccion.has(o.id_order)) && !todosSel;
  const toggleTodos = () => setSeleccion((s) => {
    const n = new Set(s);
    if (todosSel) filtradas.forEach((o) => n.delete(o.id_order));
    else filtradas.forEach((o) => n.add(o.id_order));
    return n;
  });
  const toggleUno = (id) => setSeleccion((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  /* ── Exportar CSV (Excel) ── */
  const exportar = () => {
    const rows = seleccion.size ? filtradas.filter((o) => seleccion.has(o.id_order)) : filtradas;
    if (!rows.length) return toast('info', 'No hay órdenes para exportar con los filtros actuales.');
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['ID', 'Fecha', 'Cliente', 'Teléfono', 'Tarifa', 'Precio/m²', 'Largo (cm)', 'Ancho (cm)', 'Cantidad', 'm²', 'Subtotal', 'Factura', 'Producción', 'Pago'];
    const lines = rows.map((o) => [
      o.id_order, formatearFechaHora(o.fec_creacion), o.nombre_cliente || '', o.telf_cliente || '',
      o.tam_tarif || '', Number(o.pre_tarif || 0).toFixed(2), o.larcm_order, o.ancm_order, o.can_order,
      Number(o.m2_total || 0).toFixed(4), Number(o.sub_order || 0).toFixed(2), o.id_fac ?? '',
      o.nom_estado_prod || '', o.nom_estado_pago || '',
    ].map(esc).join(';'));
    const blob = new Blob(['\uFEFF' + [head.map(esc).join(';'), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ordenes_redtf_${hoyISO()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('success', `${rows.length} orden(es) exportadas a CSV (compatible con Excel).`);
  };

  /* ── Vistas guardadas ── */
  const guardarVista = () => {
    const nombre = nombreVista.trim();
    if (!nombre) return;
    setVistas((v) => [...v.filter((x) => x.nombre !== nombre), { nombre, busqueda, filtroProd, filtroPago, desde, hasta }]);
    setNombreVista('');
    toast('success', `Vista "${nombre}" guardada.`);
  };
  const aplicarVista = (v) => {
    setBusqueda(v.busqueda); setFiltroProd(v.filtroProd); setFiltroPago(v.filtroPago);
    setDesde(v.desde); setHasta(v.hasta); setPreset(''); setPanelVistas(false);
  };

  const ordenar = (campo) => setOrden((o) => o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' });

  const Th = ({ campo, children, className }) => (
    <th className={cx('py-3 px-4 text-left', className)}>
      {campo ? (
        <button type="button" onClick={() => ordenar(campo)}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 transition">
          {children}
          {orden.campo === campo
            ? (orden.dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />)
            : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
        </button>
      ) : (
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{children}</span>
      )}
    </th>
  );

  const pad = densidad === 'compacta' ? 'py-1.5' : 'py-3';
  const drawerOrden = drawerId !== null ? ordenes.find((o) => o.id_order === drawerId) : null;

  const inputCls = 'rounded-lg border border-slate-300/70 dark:border-gray-600 bg-white dark:bg-gray-800/80 text-slate-700 dark:text-slate-200 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 transition';

  /* ─────────────────────────  RENDER  ───────────────────────── */

  return (
    <div className="relative">
      <style>{CSS}</style>

      {/* Fondo ambiental */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-10 h-64 opacity-60 dark:opacity-40"
        style={{ background: 'radial-gradient(600px 220px at 15% 0%, rgba(139,92,246,.18), transparent 70%), radial-gradient(500px 200px at 85% 10%, rgba(56,189,248,.14), transparent 70%)' }} />

      {/* KPIs */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { t: 'Total Órdenes', v: kpis.total, s: `${kpis.m2.toFixed(2)} m² de material`, i: FileText, g: 'from-violet-500 to-fuchsia-500' },
          { t: 'Ingresos Totales', v: money(kpis.ingresos), s: 'suma de subtotales filtrados', i: ArrowUp, g: 'from-sky-500 to-blue-600' },
          { t: 'Entregadas', v: kpis.entregadas, s: `de ${kpis.total} órdenes`, i: Package, g: 'from-indigo-500 to-violet-600' },
          { t: 'Por Cobrar', v: money(kpis.porCobrar), s: `${kpis.nPend} factura(s) pendiente(s)`, i: CreditCard, g: 'from-amber-400 to-orange-500' },
        ].map((k) => (
          <div key={k.t} className="rdtf-rise relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-md p-4 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all">
            <span aria-hidden className={cx('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', k.g)} />
            <div className={cx('p-3 rounded-xl bg-gradient-to-br text-white shadow-lg', k.g)}>
              <k.i className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{k.t}</p>
              <p className="text-2xl font-extrabold text-slate-800 dark:text-white truncate">{k.v}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{k.s}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tarjeta principal */}
      <div className="relative rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-md p-5 sm:p-6 w-full">
        <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-sky-500" />

        {/* Encabezado + acciones */}
        <div className="flex flex-col lg:flex-row justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Lista de Órdenes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {filtradas.length} de {ordenes.length} órdenes{seleccion.size ? ` · ${seleccion.size} seleccionada(s)` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setDensidad((d) => d === 'comoda' ? 'compacta' : 'comoda')}
              title="Cambiar densidad de filas"
              className={cx(inputCls, 'inline-flex items-center gap-2 hover:border-violet-400')}>
              <SlidersHorizontal className="w-4 h-4 text-violet-500" />
              {densidad === 'comoda' ? 'Cómoda' : 'Compacta'}
            </button>

            <div className="relative">
              <button type="button" onClick={() => setPanelVistas((v) => !v)}
                className={cx(inputCls, 'inline-flex items-center gap-2 hover:border-violet-400')}>
                <Bookmark className="w-4 h-4 text-violet-500" /> Vistas
                {vistas.length > 0 && <span className="ml-0.5 px-1.5 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 text-[11px] font-bold">{vistas.length}</span>}
              </button>
              {panelVistas && (
                <div className="rdtf-menu absolute right-0 z-40 mt-2 w-72 rounded-xl border border-violet-400/30 bg-white dark:bg-gray-900 shadow-2xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Vistas guardadas</p>
                  <div className="rdtf-scroll max-h-40 overflow-y-auto space-y-1 mb-2">
                    {vistas.length === 0 && <p className="text-xs text-slate-400 py-1">Aún no hay vistas. Guarda los filtros actuales.</p>}
                    {vistas.map((v) => (
                      <div key={v.nombre} className="flex items-center gap-1">
                        <button type="button" onClick={() => aplicarVista(v)}
                          className="flex-1 text-left text-sm px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300 transition truncate">
                          {v.nombre}
                        </button>
                        <button type="button" aria-label={`Eliminar vista ${v.nombre}`}
                          onClick={() => setVistas((x) => x.filter((y) => y.nombre !== v.nombre))}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-1.5">
                    <input value={nombreVista} onChange={(e) => setNombreVista(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && guardarVista()}
                      placeholder="Nombre de la vista…" className={cx(inputCls, 'flex-1 px-2.5 py-1.5 text-xs')} />
                    <button type="button" onClick={guardarVista} disabled={!nombreVista.trim()}
                      className="px-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white disabled:opacity-40 hover:brightness-110 transition">
                      <Save className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button type="button" onClick={exportar}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 hover:brightness-110 hover:shadow-lg transition">
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por ID o cliente…" className={cx(inputCls, 'w-full pl-9')} />
          </div>

          <select value={filtroProd} onChange={(e) => setFiltroProd(e.target.value)} className={inputCls} aria-label="Filtrar por producción">
            <option value="">Producción: todas</option>
            {estadosProd.map((e) => <option key={e.id_estado} value={e.id_estado}>{e.nom_estado}</option>)}
          </select>

          <select value={filtroPago} onChange={(e) => setFiltroPago(e.target.value)} className={inputCls} aria-label="Filtrar por pago">
            <option value="">Pago: todos</option>
            {estadosPago.map((e) => <option key={e.id_estado} value={e.id_estado}>{e.nom_estado}</option>)}
          </select>

          <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300/70 dark:border-gray-600 bg-white dark:bg-gray-800/80 px-2.5 py-1.5">
            <Calendar className="w-4 h-4 text-violet-500" />
            <input type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPreset(''); }} className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none" aria-label="Desde" />
            <span className="text-slate-400 text-xs">→</span>
            <input type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPreset(''); }} className="bg-transparent text-sm text-slate-600 dark:text-slate-300 outline-none" aria-label="Hasta" />
          </div>

          <select value={preset} onChange={(e) => aplicarPreset(e.target.value)} className={inputCls} aria-label="Rango rápido">
            <option value="">Rango rápido…</option>
            <option value="hoy">Hoy</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
            <option value="todo">Todo el histórico</option>
          </select>

          {filtrosActivos && (
            <button type="button" onClick={limpiarFiltros}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-400/30 hover:bg-rose-500/20 transition">
              <Filter className="w-3.5 h-3.5" /> Limpiar
            </button>
          )}
        </div>

        {/* Barra de selección masiva */}
        {seleccion.size > 0 && (
          <div className="rdtf-rise mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-violet-400/40 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 px-4 py-2.5">
            <span className="text-sm font-bold text-violet-700 dark:text-violet-300">{seleccion.size} seleccionada(s)</span>
            <span className="flex-1" />
            <button type="button" onClick={cobrarSeleccion}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:brightness-110 transition">
              <CheckCircle className="w-3.5 h-3.5" /> Marcar pagadas
            </button>
            <button type="button" onClick={exportar}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-sky-700 dark:text-sky-300 bg-sky-500/10 border border-sky-400/40 hover:bg-sky-500/20 transition">
              <Download className="w-3.5 h-3.5" /> Exportar selección
            </button>
            <button type="button" onClick={() => setConfirmar([...seleccion])}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-500/10 border border-rose-400/40 hover:bg-rose-500/20 transition">
              <Trash2 className="w-3.5 h-3.5" /> Eliminar
            </button>
            <button type="button" onClick={() => setSeleccion(new Set())}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition">
              <X className="w-3.5 h-3.5" /> Limpiar
            </button>
          </div>
        )}

        {/* Contenido */}
        {isLoading ? (
          <div className="space-y-2 py-2">
            {[...Array(5)].map((_, i) => <div key={i} className="rdtf-shimmer h-12 rounded-lg" />)}
          </div>
        ) : isError ? (
          <div className="text-center py-12">
            <XCircle className="w-10 h-10 mx-auto text-rose-500 mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-4">No se pudieron cargar las órdenes.</p>
            <button type="button" onClick={() => refetch()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:brightness-110 transition">
              <RefreshCw className="w-4 h-4" /> Reintentar
            </button>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="text-center py-14">
            <Inbox className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
            <p className="text-slate-600 dark:text-slate-300 font-medium">
              {filtrosActivos ? 'Ninguna orden coincide con los filtros.' : 'Todavía no hay órdenes registradas.'}
            </p>
            {filtrosActivos && (
              <button type="button" onClick={limpiarFiltros} className="mt-3 text-sm font-bold text-violet-600 dark:text-violet-300 hover:underline">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="rdtf-scroll overflow-x-auto rounded-lg border border-slate-200/60 dark:border-gray-700/60">
            <table className="w-full min-w-[1280px] border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-violet-500/10 via-slate-50 to-sky-500/10 dark:via-gray-700/60 border-b border-slate-200 dark:border-gray-600">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={todosSel} onChange={toggleTodos} aria-label="Seleccionar todas"
                      ref={(el) => { if (el) el.indeterminate = algunosSel; }}
                      className="w-4 h-4 rounded accent-violet-500 cursor-pointer" />
                  </th>
                  <Th campo="id_order" className="w-16">ID</Th>
                  <Th campo="fec_creacion" className="w-32">Fecha</Th>
                  <Th campo="nombre_cliente" className="w-36">Cliente</Th>
                  <Th className="w-36">Tarifa</Th>
                  <Th className="w-28">Dimensiones</Th>
                  <Th className="w-16">Cant.</Th>
                  <Th campo="m2_total" className="w-20">m²</Th>
                  <Th campo="sub_order" className="w-24">Subtotal</Th>
                  <Th className="w-40">Producción</Th>
                  <Th className="w-36">Pago</Th>
                  <Th className="w-20 text-right"> </Th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((o, i) => {
                  const sel = seleccion.has(o.id_order);
                  return (
                    <tr key={o.id_order} onClick={() => setDrawerId(o.id_order)}
                      className={cx(
                        'border-b border-slate-100 dark:border-gray-700/70 cursor-pointer transition-colors',
                        i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : 'bg-white dark:bg-gray-800',
                        sel ? 'bg-violet-500/10 dark:bg-violet-400/10' : 'hover:bg-violet-500/[0.06] dark:hover:bg-violet-400/[0.07]'
                      )}>
                      <td className={cx(pad, 'px-4')} onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={sel} onChange={() => toggleUno(o.id_order)} aria-label={`Seleccionar orden ${o.id_order}`}
                          className="w-4 h-4 rounded accent-violet-500 cursor-pointer" />
                      </td>
                      <td className={cx(pad, 'px-4 text-sm font-bold text-slate-800 dark:text-white')}>#{o.id_order}</td>
                      <td className={cx(pad, 'px-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap')}>{formatearFecha(o.fec_creacion)}</td>
                      <td className={cx(pad, 'px-4 text-sm font-medium text-slate-700 dark:text-slate-200')}>{o.nombre_cliente || 'N/A'}</td>
                      <td className={cx(pad, 'px-4 text-sm text-slate-600 dark:text-slate-300')}>{o.tam_tarif || '—'}</td>
                      <td className={cx(pad, 'px-4 text-sm text-slate-600 dark:text-slate-300 whitespace-nowrap')}>{o.larcm_order} × {o.ancm_order} cm</td>
                      <td className={cx(pad, 'px-4 text-sm text-slate-600 dark:text-slate-300')}>{o.can_order}</td>
                      <td className={cx(pad, 'px-4 text-sm text-slate-600 dark:text-slate-300')}>{Number(o.m2_total || 0).toFixed(2)}</td>
                      <td className={cx(pad, 'px-4 text-sm font-bold text-emerald-600 dark:text-emerald-400')}>{money(o.sub_order)}</td>

                      <td className={cx(pad, 'px-4')} onClick={(e) => e.stopPropagation()}>
                        <EstadoMenu
                          valor={o.id_estado_prod} nombre={o.nom_estado_prod}
                          opciones={estadosProd} getEstilo={estiloProd}
                          disabled={!!pendientes[`${o.id_order}:prod`]}
                          onSeleccionar={(id) => aplicarEstado(o, 'prod', id)}
                        />
                      </td>
                      <td className={cx(pad, 'px-4')} onClick={(e) => e.stopPropagation()}>
                        <EstadoMenu
                          valor={o.id_estado_pago} nombre={o.nom_estado_pago}
                          opciones={estadosPago} getEstilo={estiloPago}
                          disabled={!!pendientes[`${o.id_order}:pago`]}
                          onSeleccionar={(id) => aplicarEstado(o, 'pago', id)}
                        />
                      </td>

                      <td className={cx(pad, 'px-4 text-right whitespace-nowrap')} onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setDrawerId(o.id_order)} title="Ver detalle" aria-label={`Ver detalle de orden ${o.id_order}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/10 transition">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => setConfirmar([o.id_order])} title="Eliminar" aria-label={`Eliminar orden ${o.id_order}`}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Drawer de detalle ── */}
      {drawerOrden && createPortal(
        <div className="fixed inset-0 z-[9990]">
          <div className="rdtf-scrim absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setDrawerId(null)} />
          <aside className="rdtf-drawer rdtf-scroll absolute right-0 top-0 h-full w-full sm:w-[440px] overflow-y-auto bg-white dark:bg-gray-900 border-l border-violet-400/30 shadow-2xl">
            <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white p-5 flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest opacity-80">Orden</p>
                <h3 className="text-2xl font-extrabold">#{drawerOrden.id_order}</h3>
                <p className="text-sm opacity-90">{drawerOrden.nombre_cliente || 'Sin cliente'}</p>
              </div>
              <button type="button" onClick={() => setDrawerId(null)} aria-label="Cerrar detalle"
                className="p-2 rounded-lg hover:bg-white/15 transition"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              <section className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3"><Phone className="w-4 h-4 text-sky-500" /> Cliente</h4>
                <p className="font-semibold text-slate-800 dark:text-white">{drawerOrden.nombre_cliente || 'N/A'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{drawerOrden.telf_cliente || 'Sin teléfono'}</p>
              </section>

              <section className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3"><Ruler className="w-4 h-4 text-violet-500" /> Producción</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ['Tarifa', drawerOrden.tam_tarif || '—'],
                    ['Precio / m²', money(drawerOrden.pre_tarif)],
                    ['Dimensiones', `${drawerOrden.larcm_order} × ${drawerOrden.ancm_order} cm`],
                    ['Cantidad', drawerOrden.can_order],
                    ['Metros²', `${Number(drawerOrden.m2_total || 0).toFixed(4)} m²`],
                    ['Subtotal', money(drawerOrden.sub_order)],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-slate-50 dark:bg-gray-800/70 px-3 py-2">
                      <p className="text-[11px] text-slate-400">{k}</p>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado</span>
                  <EstadoMenu valor={drawerOrden.id_estado_prod} nombre={drawerOrden.nom_estado_prod}
                    opciones={estadosProd} getEstilo={estiloProd} align="right"
                    disabled={!!pendientes[`${drawerOrden.id_order}:prod`]}
                    onSeleccionar={(id) => aplicarEstado(drawerOrden, 'prod', id)} />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3"><CreditCard className="w-4 h-4 text-emerald-500" /> Facturación</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-slate-50 dark:bg-gray-800/70 px-3 py-2">
                    <p className="text-[11px] text-slate-400 flex items-center gap-1"><Hash className="w-3 h-3" /> Factura</p>
                    <p className="font-semibold text-slate-700 dark:text-slate-200">{drawerOrden.id_fac ? `#${drawerOrden.id_fac}` : '—'}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-gray-800/70 px-3 py-2">
                    <p className="text-[11px] text-slate-400">Monto</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">{money(drawerOrden.mont_fac || drawerOrden.sub_order)}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Estado de pago</span>
                  <EstadoMenu valor={drawerOrden.id_estado_pago} nombre={drawerOrden.nom_estado_pago}
                    opciones={estadosPago} getEstilo={estiloPago} align="right"
                    disabled={!!pendientes[`${drawerOrden.id_order}:pago`]}
                    onSeleccionar={(id) => aplicarEstado(drawerOrden, 'pago', id)} />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 dark:border-gray-700 p-4 text-sm">
                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3"><Calendar className="w-4 h-4 text-amber-500" /> Fechas</h4>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <p><span className="text-slate-400">Creación:</span> {formatearFechaHora(drawerOrden.fec_creacion)}</p>
                  <p><span className="text-slate-400">Factura:</span> {formatearFechaHora(drawerOrden.fece_fac)}</p>
                </div>
              </section>

              <button type="button" onClick={() => setConfirmar([drawerOrden.id_order])}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-400/40 hover:bg-rose-500/20 transition">
                <Trash2 className="w-4 h-4" /> Eliminar orden
              </button>
            </div>
          </aside>
        </div>,
        document.body
      )}

      {/* ── Confirmación de eliminación ── */}
      {confirmar && createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div className="rdtf-scrim absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setConfirmar(null)} />
          <div className="rdtf-menu relative w-full max-w-sm rounded-2xl border border-rose-400/40 bg-white dark:bg-gray-900 shadow-2xl p-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-center text-lg font-bold text-slate-800 dark:text-white">
              ¿Eliminar {confirmar.length} orden{confirmar.length > 1 ? 'es' : ''}?
            </h3>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Se eliminará{confirmar.length > 1 ? 'n' : ''} del registro de producción. Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2.5 mt-6">
              <button type="button" onClick={() => setConfirmar(null)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-gray-600 hover:bg-slate-100 dark:hover:bg-gray-800 transition">
                Cancelar
              </button>
              <button type="button" onClick={() => ejecutarEliminar(confirmar)}
                className="flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-rose-500/30 hover:brightness-110 transition">
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <Toasts items={toasts} onCerrar={cerrarToast} />
    </div>
  );
}