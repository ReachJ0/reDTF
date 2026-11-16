import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle, XCircle, AlertTriangle, X, Inbox, RefreshCw } from 'lucide-react';

/* ── Inyección única del lenguaje visual compartido ── */
const CSS = `
@keyframes rdtf-pop{from{opacity:0;transform:scale(.95) translateY(-4px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes rdtf-slide{from{transform:translateX(100%)}to{transform:translateX(0)}}
@keyframes rdtf-fade{from{opacity:0}to{opacity:1}}
@keyframes rdtf-toast{from{opacity:0;transform:translateX(28px)}to{opacity:1;transform:translateX(0)}}
@keyframes rdtf-bar{from{width:100%}to{width:0%}}
@keyframes rdtf-shimmer{from{background-position:-400px 0}to{background-position:400px 0}}
@keyframes rdtf-rise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes rdtf-drift{0%{transform:translate3d(0,0,0)}50%{transform:translate3d(30px,-20px,0)}100%{transform:translate3d(0,0,0)}}
.rdtf-menu{animation:rdtf-pop .14s ease-out}
.rdtf-drawer{animation:rdtf-slide .24s cubic-bezier(.22,1,.36,1)}
.rdtf-scrim{animation:rdtf-fade .18s ease-out}
.rdtf-toast{animation:rdtf-toast .22s ease-out}
.rdtf-rise{animation:rdtf-rise .3s ease-out both}
.rdtf-shimmer{background:linear-gradient(90deg,rgba(148,163,184,.08) 25%,rgba(148,163,184,.2) 50%,rgba(148,163,184,.08) 75%);background-size:800px 100%;animation:rdtf-shimmer 1.4s infinite linear}
.rdtf-scroll{scrollbar-width:thin;scrollbar-color:#8b5cf6 rgba(148,163,184,.14)}
.rdtf-scroll::-webkit-scrollbar{width:10px;height:10px}
.rdtf-scroll::-webkit-scrollbar-track{background:rgba(148,163,184,.08);border-radius:8px}
.rdtf-scroll::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#8b5cf6,#6366f1);border-radius:8px;border:2px solid transparent;background-clip:padding-box}
.rdtf-scroll::-webkit-scrollbar-thumb:hover{background:linear-gradient(180deg,#a78bfa,#818cf8);border:2px solid transparent;background-clip:padding-box}
.rdtf-num{font-variant-numeric:tabular-nums}
`;
if (typeof document !== 'undefined' && !document.getElementById('rdtf-css')) {
  const s = document.createElement('style');
  s.id = 'rdtf-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

export const cx = (...c) => c.filter(Boolean).join(' ');
export const money = (n) => `$${Number(n || 0).toFixed(2)}`;
export const hoyISO = () => new Date().toISOString().slice(0, 10);
export const fFecha = (f) => {
  if (!f) return '—';
  const d = new Date(f);
  return isNaN(d) ? '—' : d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
};
export const fFechaHora = (f) => {
  if (!f) return '—';
  const d = new Date(f);
  return isNaN(d) ? '—' : d.toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export const HUES = ['#8b5cf6', '#38bdf8', '#f59e0b', '#10b981', '#f43f5e', '#fb923c', '#e879f9', '#22d3ee'];

export const inputCls = 'rounded-lg border border-slate-300/70 dark:border-gray-600 bg-white dark:bg-gray-800/80 text-slate-700 dark:text-slate-200 text-sm px-3 py-2 outline-none focus:ring-2 focus:ring-violet-500/60 focus:border-violet-400 transition';
export const labelCls = 'block text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5';

export function useTema() {
  const [oscuro, setOscuro] = useState(() => {
    const guardado = localStorage.getItem('redtf-theme');
    if (guardado) return guardado === 'dark';
    return document.documentElement.classList.contains('dark') || true;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', oscuro);
    localStorage.setItem('redtf-theme', oscuro ? 'dark' : 'light');
  }, [oscuro]);
  return [oscuro, setOscuro];
}

export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const id = useRef(0);
  const push = useCallback((tipo, msg, accion = null, duracion = 4500) => {
    const n = ++id.current;
    setToasts((t) => [...t, { id: n, tipo, msg, accion, duracion }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n)), duracion);
  }, []);
  const cerrar = useCallback((n) => setToasts((t) => t.filter((x) => x.id !== n)), []);
  return { toasts, push, cerrar };
}

export function Toasts({ items, onCerrar }) {
  if (!items.length) return null;
  const cfg = {
    success: { i: CheckCircle, c: 'text-emerald-500 dark:text-emerald-300 border-emerald-400/40', b: 'bg-emerald-400' },
    error: { i: XCircle, c: 'text-rose-500 dark:text-rose-300 border-rose-400/40', b: 'bg-rose-400' },
    info: { i: AlertTriangle, c: 'text-sky-500 dark:text-sky-300 border-sky-400/40', b: 'bg-sky-400' },
  };
  return createPortal(
    <div className="fixed top-4 right-4 z-[10050] flex flex-col gap-2.5 w-[min(92vw,380px)]">
      {items.map((t) => {
        const c = cfg[t.tipo] || cfg.info;
        return (
          <div key={t.id} className={cx('rdtf-toast relative overflow-hidden rounded-xl border bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl shadow-black/30 p-3.5 pr-9', c.c)}>
            <div className="flex items-start gap-2.5">
              <c.i className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200 leading-snug">{t.msg}</p>
                {t.accion && (
                  <button type="button" onClick={() => { t.accion.fn(); onCerrar(t.id); }}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-violet-600 dark:text-violet-300 hover:underline">
                    <RefreshCw className="w-3.5 h-3.5" /> {t.accion.label}
                  </button>
                )}
              </div>
            </div>
            <button type="button" onClick={() => onCerrar(t.id)} aria-label="Cerrar notificación"
              className="absolute top-2.5 right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"><X className="w-4 h-4" /></button>
            <span className={cx('absolute bottom-0 left-0 h-0.5', c.b)} style={{ animation: `rdtf-bar ${t.duracion}ms linear forwards` }} />
          </div>
        );
      })}
    </div>, document.body);
}

export function Btn({ variant = 'primary', className, children, ...props }) {
  const v = {
    primary: 'text-white bg-gradient-to-r from-violet-500 to-fuchsia-600 shadow-md shadow-violet-500/25 hover:brightness-110 hover:shadow-lg',
    success: 'text-white bg-gradient-to-r from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25 hover:brightness-110',
    danger: 'text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-md shadow-rose-500/25 hover:brightness-110',
    ghost: 'text-slate-600 dark:text-slate-300 border border-slate-300/70 dark:border-gray-600 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-300',
    soft: 'text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-400/40 hover:bg-rose-500/20',
  }[variant];
  return (
    <button type="button" {...props}
      className={cx('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed', v, className)}>
      {children}
    </button>
  );
}

export function Card({ className, children, accent = 'from-violet-500 via-fuchsia-500 to-sky-500' }) {
  return (
    <div className={cx('relative rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-md p-5 sm:p-6', className)}>
      <span aria-hidden className={cx('absolute inset-x-0 top-0 h-0.5 rounded-t-xl bg-gradient-to-r', accent)} />
      {children}
    </div>
  );
}

export function KPI({ titulo, valor, sub, icon: Icon, grad, delay = 0 }) {
  return (
    <div className="rdtf-rise relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-md p-4 flex items-center gap-4 hover:shadow-lg hover:-translate-y-0.5 transition-all"
      style={{ animationDelay: `${delay}ms` }}>
      <span aria-hidden className={cx('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', grad)} />
      <div className={cx('p-3 rounded-xl bg-gradient-to-br text-white shadow-lg', grad)}><Icon className="w-5 h-5" /></div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{titulo}</p>
        <p className="rdtf-num text-2xl font-extrabold text-slate-800 dark:text-white truncate">{valor}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{sub}</p>}
      </div>
    </div>
  );
}

export function PageHeader({ icon: Icon, grad = 'from-violet-500 to-fuchsia-600', titulo, sub, children }) {
  return (
    <div className="relative mb-7">
      <div aria-hidden className="pointer-events-none absolute -inset-x-6 -top-10 h-48 opacity-60 dark:opacity-40"
        style={{ background: 'radial-gradient(560px 200px at 12% 0%, rgba(139,92,246,.20), transparent 70%), radial-gradient(480px 180px at 88% 10%, rgba(56,189,248,.15), transparent 70%)' }} />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={cx('p-3.5 rounded-2xl bg-gradient-to-br text-white shadow-lg shadow-violet-500/30', grad)}><Icon className="w-7 h-7" /></div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">{titulo}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{sub}</p>
          </div>
        </div>
        {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
      </div>
      <span aria-hidden className="mt-4 block h-px bg-gradient-to-r from-violet-500/60 via-fuchsia-500/30 to-transparent" />
    </div>
  );
}

export function Avatar({ nombre, size = 'w-9 h-9 text-sm', grad = 'from-violet-500 to-fuchsia-600' }) {
  const ini = (nombre || '?').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  return <span className={cx('inline-flex items-center justify-center rounded-full bg-gradient-to-br text-white font-bold shrink-0', size, grad)}>{ini}</span>;
}

export function Empty({ texto, accion }) {
  return (
    <div className="text-center py-14">
      <Inbox className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
      <p className="text-slate-600 dark:text-slate-300 font-medium">{texto}</p>
      {accion}
    </div>
  );
}

export function Skeleton({ filas = 5 }) {
  return <div className="space-y-2 py-2">{[...Array(filas)].map((_, i) => <div key={i} className="rdtf-shimmer h-12 rounded-lg" />)}</div>;
}

export function ConfirmModal({ titulo, texto, onCancelar, onConfirmar, label = 'Eliminar' }) {
  useEffect(() => {
    const t = (e) => e.key === 'Escape' && onCancelar();
    window.addEventListener('keydown', t);
    return () => window.removeEventListener('keydown', t);
  }, [onCancelar]);
  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="rdtf-scrim absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onCancelar} />
      <div className="rdtf-menu relative w-full max-w-sm rounded-2xl border border-rose-400/40 bg-white dark:bg-gray-900 shadow-2xl p-6">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/30 mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-center text-lg font-bold text-slate-800 dark:text-white">{titulo}</h3>
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-1.5">{texto}</p>
        <div className="flex gap-2.5 mt-6">
          <Btn variant="ghost" className="flex-1" onClick={onCancelar}>Cancelar</Btn>
          <Btn variant="danger" className="flex-1" onClick={onConfirmar}>{label}</Btn>
        </div>
      </div>
    </div>, document.body);
}

export function Drawer({ titulo, sub, grad = 'from-violet-600 to-fuchsia-600', onCerrar, children }) {
  useEffect(() => {
    const t = (e) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', t);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', t); document.body.style.overflow = ''; };
  }, [onCerrar]);
  return createPortal(
    <div className="fixed inset-0 z-[9990]">
      <div className="rdtf-scrim absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onCerrar} />
      <aside className="rdtf-drawer rdtf-scroll absolute right-0 top-0 h-full w-full sm:w-[440px] overflow-y-auto bg-white dark:bg-gray-900 border-l border-violet-400/30 shadow-2xl">
        <div className={cx('sticky top-0 z-10 bg-gradient-to-r text-white p-5 flex items-start justify-between', grad)}>
          <div>
            <h3 className="text-2xl font-extrabold">{titulo}</h3>
            {sub && <p className="text-sm opacity-90">{sub}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-white/15 transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-5">{children}</div>
      </aside>
    </div>, document.body);
}

export function Seccion({ icon: Icon, color = 'text-violet-500', titulo, children }) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
        <Icon className={cx('w-4 h-4', color)} /> {titulo}
      </h4>
      {children}
    </section>
  );
}

/* ── Gráfica de área SVG con proyección ── */
export function AreaChart({ puntos, proyeccion = [], alto = 230 }) {
  const uid = useId().replace(/[:]/g, '');
  const [hover, setHover] = useState(null);
  const wrap = useRef(null);
  const todos = [...puntos, ...proyeccion];
  if (!todos.length) return <Empty texto="Sin histórico suficiente para graficar." />;
  const W = 640, H = alto, L = 48, R = 14, T = 18, B = 30;
  const max = Math.max(...todos.map((p) => p.valor), 1) * 1.18;
  const x = (i) => L + (i * (W - L - R)) / Math.max(todos.length - 1, 1);
  const y = (v) => T + (1 - v / max) * (H - T - B);
  const linea = (arr, off = 0) => arr.map((p, i) => `${i ? 'L' : 'M'}${x(i + off).toFixed(1)},${y(p.valor).toFixed(1)}`).join(' ');
  const area = `${linea(puntos)} L${x(puntos.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const proyLinea = puntos.length ? `M${x(puntos.length - 1)},${y(puntos[puntos.length - 1].valor)} ` + proyeccion.map((p, i) => `L${x(puntos.length + i)},${y(p.valor)}`).join(' ') : '';
  const mover = (e) => {
    const r = wrap.current.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    const i = Math.round(((px - L) / (W - L - R)) * (todos.length - 1));
    setHover(Math.max(0, Math.min(todos.length - 1, i)));
  };
  const ticks = [0, 1, 2, 3].map((i) => (max / 3) * i);
  return (
    <div ref={wrap} className="relative" onMouseMove={mover} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block" role="img" aria-label="Ingresos por mes">
        <defs>
          <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#8b5cf6" /><stop offset="55%" stopColor="#e879f9" /><stop offset="100%" stopColor="#38bdf8" />
          </linearGradient>
          <linearGradient id={`f${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity=".38" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="currentColor" strokeOpacity=".09" strokeDasharray="3 5" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="10" fill="currentColor" opacity=".45" className="rdtf-num">${t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t.toFixed(0)}</text>
          </g>
        ))}
        <path d={area} fill={`url(#f${uid})`} />
        <path d={linea(puntos)} fill="none" stroke={`url(#g${uid})`} strokeWidth="2.5" strokeLinecap="round" />
        {proyeccion.length > 0 && (
          <>
            <line x1={x(puntos.length - 1)} x2={x(puntos.length - 1)} y1={T} y2={H - B} stroke="#e879f9" strokeOpacity=".35" strokeDasharray="4 4" />
            <path d={proyLinea} fill="none" stroke="#e879f9" strokeWidth="2" strokeDasharray="6 5" strokeLinecap="round" />
            <text x={x(puntos.length - 1) + 6} y={T + 4} fontSize="9" fill="#e879f9" opacity=".8" fontWeight="700">PROYECCIÓN</text>
          </>
        )}
        {todos.map((p, i) => (
          <g key={i}>
            <circle cx={x(i)} cy={y(p.valor)} r={hover === i ? 5 : 3} fill={i >= puntos.length ? '#e879f9' : '#8b5cf6'} stroke="#fff" strokeWidth={hover === i ? 2 : 0} />
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="10" fill="currentColor" opacity=".55">{p.label}</text>
          </g>
        ))}
        {puntos.length > 0 && (
          <text x={x(puntos.length - 1)} y={y(puntos[puntos.length - 1].valor) - 10} textAnchor="middle" fontSize="11" fontWeight="800" fill="#a78bfa" className="rdtf-num">
            {money(puntos[puntos.length - 1].valor)}
          </text>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute -translate-x-1/2 rounded-lg border border-violet-400/40 bg-gray-900/95 px-2.5 py-1.5 text-[11px] text-white shadow-xl"
          style={{ left: `${(x(hover) / W) * 100}%`, top: `${(y(todos[hover].valor) / H) * 100 - 16}%` }}>
          <span className="font-bold">{todos[hover].label}</span> · <span className="rdtf-num text-fuchsia-300">{money(todos[hover].valor)}</span>
          {hover >= puntos.length && <span className="ml-1 text-fuchsia-400">(est.)</span>}
        </div>
      )}
    </div>
  );
}

export function Donut({ data, centro, sub }) {
  const total = data.reduce((s, d) => s + d.valor, 0);
  const r = 52, C = 2 * Math.PI * r;
  let acc = 0;
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0 -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="17" />
        {total > 0 && data.map((d, i) => {
          const frac = d.valor / total;
          const el = (
            <circle key={d.nombre} cx="70" cy="70" r={r} fill="none" stroke={HUES[i % HUES.length]} strokeWidth="17"
              strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-acc * C} strokeLinecap="butt" />
          );
          acc += frac;
          return el;
        })}
        <g className="rotate-90" style={{ transformOrigin: '70px 70px' }}>
          <text x="70" y="66" textAnchor="middle" fontSize="17" fontWeight="800" fill="currentColor" className="rdtf-num">{centro}</text>
          <text x="70" y="82" textAnchor="middle" fontSize="9" fill="currentColor" opacity=".5">{sub}</text>
        </g>
      </svg>
      <ul className="flex-1 space-y-2 min-w-0">
        {data.map((d, i) => (
          <li key={d.nombre} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: HUES[i % HUES.length] }} />
            <span className="flex-1 truncate text-slate-600 dark:text-slate-300">{d.nombre}</span>
            <span className="rdtf-num font-bold text-slate-800 dark:text-white">{money(d.valor)}</span>
            <span className="rdtf-num w-11 text-right text-[11px] text-slate-400">{total ? ((d.valor / total) * 100).toFixed(0) : 0}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Barras({ data }) {
  const max = Math.max(...data.map((d) => d.valor), 1);
  return (
    <div className="space-y-3.5">
      {data.map((d, i) => (
        <div key={d.nombre}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-600 dark:text-slate-300 font-medium">{d.nombre}</span>
            <span className="rdtf-num font-bold text-slate-800 dark:text-white">{d.valor}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-gray-700/70 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.valor / max) * 100}%`, background: `linear-gradient(90deg, ${HUES[i % HUES.length]}, ${HUES[(i + 1) % HUES.length]})` }} />
          </div>
        </div>
      ))}
      {data.length === 0 && <p className="text-sm text-slate-400 text-center py-3">Sin datos aún.</p>}
    </div>
  );
}