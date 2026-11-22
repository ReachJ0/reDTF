import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, FileText, Settings, ScrollText, UserCog,
  ChevronLeft, Sun, Moon, Sparkles, Volume2, VolumeX
} from 'lucide-react';
import { cx } from '../design/sistema';
import { useAjustes, setAjustes, aplicarTemaDocumento, temaOscuroActual } from '../design/ajustes';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { a: '/', icon: LayoutDashboard, label: 'Dashboard', grad: 'from-violet-500 to-fuchsia-600' },
  { a: '/clientes', icon: Users, label: 'Clientes', grad: 'from-sky-500 to-blue-600' },
  { a: '/ordenes', icon: FileText, label: 'Órdenes', grad: 'from-fuchsia-500 to-violet-600' },
  { a: '/auditoria', icon: ScrollText, label: 'Auditoría', grad: 'from-emerald-400 to-teal-600', rol: 'admin' },
  { a: '/equipo', icon: UserCog, label: 'Equipo', grad: 'from-sky-400 to-indigo-600', rol: 'admin' },
  { a: '/configuracion', icon: Settings, label: 'Configuración', grad: 'from-amber-400 to-orange-500', rol: 'admin' },
];

export default function Sidebar() {
  const [colapsado, setColapsado] = useState(false);
  const a = useAjustes();
  const { rol } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const oscuro = temaOscuroActual(a.tema);
  const toggleTema = () => setAjustes({ tema: oscuro ? 'claro' : 'oscuro' });

  useEffect(() => {
    aplicarTemaDocumento(a.tema);
  }, [a.tema]);

  const activo = (r) => (r === '/' ? pathname === '/' || pathname === '/dashboard' : pathname.startsWith(r));
  const items = NAV.filter((n) => !n.rol || n.rol === rol);

  return (
    <aside
      data-rdtf-sidebar="1"
      className={cx(
        'relative z-20 flex flex-col shrink-0 h-screen sticky top-0 self-start',
        'border-r border-slate-200/70 dark:border-gray-700/70',
        'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl transition-all duration-300',
        colapsado ? 'w-[76px]' : 'w-64'
      )}
    >
      <span aria-hidden className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-violet-500/50 via-fuchsia-500/20 to-transparent" />

      <div className={cx('flex items-center gap-3 p-4', colapsado && 'justify-center px-2')}>
        <div className="relative p-2.5 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 text-white shadow-lg shadow-violet-500/30">
          <Sparkles className="w-5 h-5" />
        </div>
        {!colapsado && (
          <div className="min-w-0">
            <p className="text-lg font-extrabold tracking-tight text-slate-800 dark:text-white leading-none">ReDTF</p>
            <p className="text-[10px] font-bold uppercase tracking-[.2em] text-fuchsia-500 dark:text-fuchsia-400 mt-1">Print Studio</p>
          </div>
        )}
        <button type="button" onClick={() => setColapsado((c) => !c)} aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
          className={cx('ml-auto p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-500/10 transition', colapsado && 'hidden')}>
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {!colapsado && <p className="px-5 pb-2 text-[10px] font-bold uppercase tracking-[.22em] text-slate-400 dark:text-slate-500">Gestión</p>}

      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto rdtf-scroll">
        {items.map((n) => {
          const on = activo(n.a);
          return (
            <button key={n.a} type="button" onClick={() => navigate(n.a)} title={n.label}
              className={cx('group relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                colapsado && 'justify-center px-0',
                on ? 'text-white shadow-lg shadow-violet-500/25' : 'text-slate-600 dark:text-slate-300 hover:bg-violet-500/10 hover:text-violet-600 dark:hover:text-violet-300')}>
              {on && <span aria-hidden className={cx('absolute inset-0 rounded-xl bg-gradient-to-r', n.grad)} />}
              <n.icon className={cx('relative w-5 h-5 shrink-0', !on && 'group-hover:scale-110 transition-transform')} />
              {!colapsado && <span className="relative truncate">{n.label}</span>}
              {on && !colapsado && <span className="relative ml-auto w-1.5 h-1.5 rounded-full bg-white/90" />}
            </button>
          );
        })}
      </nav>

      <div className={cx('p-3 border-t border-slate-200/70 dark:border-gray-700/70 space-y-2', colapsado && 'px-2')}>
        <div className={cx('flex gap-2', colapsado && 'flex-col')}>
          <button type="button" onClick={toggleTema} aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={oscuro ? 'Modo claro' : 'Modo oscuro'}
            className={cx('flex-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-gray-800/80 border border-slate-200/70 dark:border-gray-700 hover:border-violet-400 transition', colapsado && 'justify-center px-0')}>
            {oscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-500" />}
            {!colapsado && <span>{oscuro ? 'Modo Claro' : 'Modo Oscuro'}</span>}
          </button>
          <button type="button" onClick={() => setAjustes({ sonido: !a.sonido })} aria-label={a.sonido ? 'Silenciar sonidos' : 'Activar sonidos'}
            title={a.sonido ? 'Sonido activado' : 'Sonido silenciado'}
            className={cx('flex items-center justify-center rounded-xl px-3 py-2.5 border transition',
              a.sonido ? 'text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-400/40' : 'text-slate-400 bg-slate-100/80 dark:bg-gray-800/80 border-slate-200/70 dark:border-gray-700')}>
            {a.sonido ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
        {!colapsado && (
          <p className="text-center text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-600">
            v0.4.0 · ReDTF · rol: <span className="text-fuchsia-500 dark:text-fuchsia-400 uppercase">{rol}</span>
          </p>
        )}
      </div>

      {colapsado && (
        <button type="button" onClick={() => setColapsado(false)} aria-label="Expandir menú"
          className="absolute -right-3 top-20 p-1 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg">
          <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
        </button>
      )}
    </aside>
  );
}