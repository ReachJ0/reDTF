import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import {
  UserCog, Users, ShieldCheck, KeyRound, Pencil, Trash2, Eye, Search, Plus, X,
  Check, Ban, RotateCcw, Mail, Lock, Filter, ArrowUp, ArrowDown, ArrowUpDown,
  UserCheck, UserX, EyeOff, Sparkles
} from 'lucide-react';
import {
  PageHeader, Card, Btn, Avatar, Drawer, Seccion, ConfirmModal, Empty, Skeleton,
  cx, inputCls, labelCls, useToasts, Toasts, fFechaHora
} from '../design/sistema';
import { reglas, useValidacion, Campo, ResumenErrores, bordeCampo } from '../design/validacion';
import { useAuth } from '../context/AuthContext';

const ROL_ESTILO = {
  admin: { badge: 'bg-violet-400/10 text-violet-600 dark:text-violet-300 border-violet-400/40', grad: 'from-violet-500 to-fuchsia-600', icon: ShieldCheck, label: 'Admin' },
  operador: { badge: 'bg-sky-400/10 text-sky-600 dark:text-sky-300 border-sky-400/40', grad: 'from-sky-500 to-blue-600', icon: UserCog, label: 'Operador / Empleado' },
};

const PERMISOS = [
  { t: 'Ver dashboard, clientes y órdenes', admin: true, operador: true },
  { t: 'Crear órdenes y cambiar estados de producción/pago', admin: true, operador: true },
  { t: 'Exportar reportes Excel y PDF', admin: true, operador: true },
  { t: 'Eliminar órdenes y clientes (borrado lógico)', admin: true, operador: false },
  { t: 'Crear, editar y eliminar tarifas', admin: true, operador: false },
  { t: 'Consultar la auditoría del sistema', admin: true, operador: false },
  { t: 'Gestionar equipo, roles y contraseñas', admin: true, operador: false },
  { t: 'Configuración del negocio', admin: true, operador: false },
];

const ESQUEMA_NUEVO = {
  correo_user: [reglas.requerido('El correo es obligatorio'), reglas.email],
  password: [reglas.requerido('La contraseña es obligatoria'), reglas.password],
  rol: [reglas.seleccion('Selecciona un rol')],
};
const ESQUEMA_PASS = { password: [reglas.requerido('La contraseña es obligatoria'), reglas.password] };

function ModalEmpleado({ miembro, onClose }) {
  const qc = useQueryClient();
  const { push, toasts, cerrar } = useToasts();
  const editando = !!miembro;
  const { valores, cambiar, tocar, mostrarError, validarTodo, reset } = useValidacion(
    { correo_user: miembro?.correo_user || '', password: '', rol: miembro?.rol || 'operador' },
    editando ? { rol: [reglas.seleccion('Selecciona un rol')] } : ESQUEMA_NUEVO
  );
  const [enviando, setEnviando] = useState(false);
  const [erroresEnvio, setErroresEnvio] = useState(null);
  const [verPass, setVerPass] = useState(false);
  const rolInfo = ROL_ESTILO[valores.rol] || ROL_ESTILO.operador;

  const guardar = async (e) => {
    e.preventDefault();
    setErroresEnvio(null);
    const { ok, errs } = validarTodo();
    if (!ok) { setErroresEnvio(errs); return; }
    setEnviando(true);
    try {
      if (editando) {
        await api.put(`/usuarios/${miembro.id_user}`, { rol: valores.rol });
        push('success', `Rol de ${miembro.correo_user} actualizado a ${ROL_ESTILO[valores.rol].label}.`);
      } else {
        await api.post('/usuarios/', { correo_user: valores.correo_user.trim().toLowerCase(), password: valores.password, rol: valores.rol });
        push('success', `Cuenta de ${valores.correo_user} creada como ${ROL_ESTILO[valores.rol].label}.`);
      }
      qc.invalidateQueries(['equipo']);
      reset();
      setTimeout(onClose, 600);
    } catch (err) {
      const detalle = err.response?.data?.detail || err.message;
      setErroresEnvio({ servidor: typeof detalle === 'string' ? detalle : JSON.stringify(detalle) });
    } finally { setEnviando(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="rdtf-scrim absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="rdtf-menu rdtf-scroll relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl border border-violet-400/30 bg-white dark:bg-gray-900 shadow-2xl">
        <div className={cx('sticky top-0 z-10 bg-gradient-to-r text-white p-5 flex items-center justify-between', rolInfo.grad)}>
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/15"><UserCog className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-extrabold">{editando ? 'Editar rol' : 'Nuevo miembro del equipo'}</h2>
              <p className="text-xs opacity-85">{editando ? miembro.correo_user : 'Alta de cuenta con rol y permisos'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-white/15 transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={guardar} noValidate className="p-5 space-y-4">
          {erroresEnvio && <ResumenErrores errores={erroresEnvio} />}

          <Campo label="Correo electrónico" obligatorio error={mostrarError('correo_user')}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={valores.correo_user} onChange={cambiar('correo_user')} onBlur={tocar('correo_user')}
                disabled={editando} aria-invalid={!!mostrarError('correo_user')} placeholder="empleado@redtf.com"
                className={cx(inputCls, 'w-full pl-9 disabled:opacity-60', bordeCampo(mostrarError('correo_user'), !editando && valores.correo_user.includes('@')))} />
            </div>
          </Campo>

          {!editando && (
            <Campo label="Contraseña inicial" obligatorio error={mostrarError('password')} ayuda="Mínimo 6 caracteres; el empleado podrá usarla al ingresar">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type={verPass ? 'text' : 'password'} value={valores.password} onChange={cambiar('password')} onBlur={tocar('password')}
                  aria-invalid={!!mostrarError('password')} placeholder="••••••••"
                  className={cx(inputCls, 'w-full pl-9 pr-11', bordeCampo(mostrarError('password'), valores.password.length >= 6))} />
                <button type="button" onClick={() => setVerPass(v => !v)} aria-label={verPass ? 'Ocultar' : 'Mostrar'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition">
                  {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Campo>
          )}

          <Campo label="Rol en el sistema" obligatorio error={mostrarError('rol')}>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(ROL_ESTILO).map(([key, info]) => (
                <button key={key} type="button" onClick={() => cambiar('rol')(key)}
                  className={cx('rounded-xl border p-3 text-left transition-all',
                    valores.rol === key ? cx(info.badge, 'ring-2 ring-violet-500/40') : 'border-slate-200 dark:border-gray-700 hover:border-violet-400/50')}>
                  <info.icon className="w-4 h-4 mb-1.5" />
                  <p className="text-sm font-bold">{info.label}</p>
                  <p className="text-[11px] opacity-70 mt-0.5">{key === 'admin' ? 'Control total del sistema' : 'Operación diaria del taller'}</p>
                </button>
              ))}
            </div>
          </Campo>

          <div className="rounded-xl border border-slate-200 dark:border-gray-700 bg-slate-50/60 dark:bg-gray-800/60 p-3.5">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Permisos de este rol</p>
            <ul className="space-y-1">
              {PERMISOS.map(p => (
                <li key={p.t} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  {p[valores.rol] ? <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <X className="w-3.5 h-3.5 text-rose-400 shrink-0" />}
                  <span className={cx(!p[valores.rol] && 'opacity-50 line-through')}>{p.t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2.5 pt-1">
            <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={enviando} className="flex-1">
              {enviando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              {editando ? 'Guardar rol' : 'Crear cuenta'}
            </Btn>
          </div>
        </form>
      </div>
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>, document.body);
}

function ModalPassword({ miembro, onClose }) {
  const qc = useQueryClient();
  const { push, toasts, cerrar } = useToasts();
  const { valores, cambiar, tocar, mostrarError, validarTodo } = useValidacion({ password: '' }, ESQUEMA_PASS);
  const [enviando, setEnviando] = useState(false);
  const [ver, setVer] = useState(false);
  const [error, setError] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(null);
    const { ok, errs } = validarTodo();
    if (!ok) { setError(errs); return; }
    setEnviando(true);
    try {
      await api.put(`/usuarios/${miembro.id_user}/password`, { password: valores.password });
      qc.invalidateQueries(['equipo']);
      push('success', `Contraseña de ${miembro.correo_user} restablecida.`);
      setTimeout(onClose, 600);
    } catch (err) {
      setError({ servidor: err.response?.data?.detail || err.message });
    } finally { setEnviando(false); }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="rdtf-scrim absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="rdtf-menu relative w-full max-w-sm rounded-2xl border border-amber-400/30 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/15"><KeyRound className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-extrabold">Restablecer contraseña</h2>
              <p className="text-xs opacity-85 truncate max-w-[220px]">{miembro.correo_user}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-white/15 transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={guardar} noValidate className="p-5 space-y-4">
          {error && <ResumenErrores errores={error} />}
          <Campo label="Nueva contraseña" obligatorio error={mostrarError('password')} ayuda="Mínimo 6 caracteres">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type={ver ? 'text' : 'password'} value={valores.password} onChange={cambiar('password')} onBlur={tocar('password')}
                aria-invalid={!!mostrarError('password')} placeholder="••••••••" autoFocus
                className={cx(inputCls, 'w-full pl-9 pr-11', bordeCampo(mostrarError('password'), valores.password.length >= 6))} />
              <button type="button" onClick={() => setVer(v => !v)} aria-label={ver ? 'Ocultar' : 'Mostrar'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-500 transition">
                {ver ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </Campo>
          <div className="flex gap-2.5">
            <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={enviando} className="flex-1 !bg-gradient-to-r !from-amber-400 !to-orange-500">
              {enviando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <KeyRound className="w-4 h-4" />}
              Restablecer
            </Btn>
          </div>
        </form>
      </div>
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>, document.body);
}

export default function EquipoPage() {
  const qc = useQueryClient();
  const { usuario: yo } = useAuth();
  const { toasts, push, cerrar } = useToasts();
  const [q, setQ] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [orden, setOrden] = useState({ campo: 'correo_user', dir: 'asc' });
  const [sel, setSel] = useState(() => new Set());
  const [modal, setModal] = useState(null);
  const [modalPass, setModalPass] = useState(null);
  const [drawerId, setDrawerId] = useState(null);
  const [confirmar, setConfirmar] = useState(null);

  const { data: equipoRaw, isLoading, refetch } = useQuery({
    queryKey: ['equipo'],
    queryFn: async () => (await api.get('/usuarios/')).data,
  });
  const equipo = equipoRaw ?? [];

  const filtrados = useMemo(() => {
    const qq = q.trim().toLowerCase();
    const list = equipo.filter(u =>
      (!qq || u.correo_user.toLowerCase().includes(qq)) &&
      (!filtroRol || u.rol === filtroRol) &&
      (!filtroEstado || (filtroEstado === 'activos' ? u.activo : !u.activo))
    );
    const dir = orden.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      if (orden.campo === 'correo_user') return dir * a.correo_user.localeCompare(b.correo_user, 'es');
      if (orden.campo === 'rol') return dir * a.rol.localeCompare(b.rol);
      return dir * (Number(a.activo) - Number(b.activo));
    });
  }, [equipo, q, filtroRol, filtroEstado, orden]);

  const kpis = useMemo(() => ({
    total: equipo.length,
    admins: equipo.filter(u => u.rol === 'admin' && u.activo).length,
    operadores: equipo.filter(u => u.rol === 'operador' && u.activo).length,
    inactivos: equipo.filter(u => !u.activo).length,
  }), [equipo]);

  const todosSel = filtrados.length > 0 && filtrados.every(u => sel.has(u.id_user));
  const algunosSel = filtrados.some(u => sel.has(u.id_user)) && !todosSel;
  const toggleTodos = () => setSel(s => { const n = new Set(s); todosSel ? filtrados.forEach(u => n.delete(u.id_user)) : filtrados.forEach(u => n.add(u.id_user)); return n; });
  const toggleUno = id => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const mutar = async (ids, parche, etiqueta) => {
    const snapshot = qc.getQueryData(['equipo']);
    qc.setQueryData(['equipo'], (prev = []) => prev.map(u => ids.includes(u.id_user) ? { ...u, ...parche } : u));
    const res = await Promise.allSettled(ids.map(id => api.put(`/usuarios/${id}`, parche)));
    const fallos = res.filter(r => r.status === 'rejected');
    if (fallos.length) {
      qc.setQueryData(['equipo'], snapshot);
      const detalle = fallos[0].reason?.response?.data?.detail || 'regla de negocio';
      push('error', `${fallos.length} cuenta(s) no pudieron cambiar: ${detalle}`);
    }
    const ok = res.length - fallos.length;
    if (ok) push('success', `${ok} cuenta(s) ${etiqueta}.`, parche.activo === false ? {
      label: 'Reactivar', fn: () => mutar(ids, { activo: true }, 'reactivadas'),
    } : null, 6000);
    qc.invalidateQueries(['equipo']);
  };

  const eliminar = async (ids) => {
    setConfirmar(null);
    const snapshot = qc.getQueryData(['equipo']);
    qc.setQueryData(['equipo'], (prev = []) => prev.map(u => ids.includes(u.id_user) ? { ...u, activo: false } : u));
    setSel(s => { const n = new Set(s); ids.forEach(i => n.delete(i)); return n; });
    if (ids.includes(drawerId)) setDrawerId(null);
    const res = await Promise.allSettled(ids.map(id => api.delete(`/usuarios/${id}`)));
    const fallos = res.filter(r => r.status === 'rejected');
    if (fallos.length) {
      qc.setQueryData(['equipo'], snapshot);
      push('error', `${fallos.length} cuenta(s) no pudieron eliminarse: ${fallos[0].reason?.response?.data?.detail || 'regla de negocio'}`);
    }
    const ok = res.length - fallos.length;
    if (ok) push('success', `${ok} cuenta(s) desactivada(s) (borrado lógico).`, {
      label: 'Deshacer', fn: () => mutar(ids, { activo: true }, 'reactivadas'),
    }, 7000);
    qc.invalidateQueries(['equipo']);
  };

  const ordenar = campo => setOrden(o => o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: 'asc' });
  const Th = ({ campo, children, className }) => (
    <th className={cx('py-3 px-4 text-left', className)}>
      <button type="button" onClick={() => ordenar(campo)}
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 transition">
        {children}
        {orden.campo === campo ? (orden.dir === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />) : <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />}
      </button>
    </th>
  );

  const drawer = drawerId !== null ? equipo.find(u => u.id_user === drawerId) : null;
  const esYo = u => u.correo_user === (yo?.correo || yo?.email);

  return (
    <div>
      <PageHeader icon={UserCog} grad="from-sky-500 to-indigo-600" titulo="Equipo y Roles"
        sub="Cuentas del estudio: administradores y operadores/empleados con permisos diferenciados">
        <Btn variant="ghost" onClick={() => refetch()}><RotateCcw className="w-4 h-4" /> Sincronizar</Btn>
        <Btn onClick={() => setModal({})}><Plus className="w-4 h-4" /> Nuevo miembro</Btn>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {[
          { t: 'Miembros del equipo', v: kpis.total, i: Users, g: 'from-sky-500 to-blue-600' },
          { t: 'Administradores activos', v: kpis.admins, i: ShieldCheck, g: 'from-violet-500 to-fuchsia-600' },
          { t: 'Operadores activos', v: kpis.operadores, i: UserCog, g: 'from-emerald-400 to-teal-600' },
          { t: 'Cuentas desactivadas', v: kpis.inactivos, i: UserX, g: 'from-amber-400 to-orange-500' },
        ].map(k => (
          <div key={k.t} className="rdtf-rise relative overflow-hidden rounded-xl border border-slate-200/80 dark:border-gray-700 bg-white dark:bg-gray-800/90 shadow-md p-4 flex items-center gap-4">
            <span aria-hidden className={cx('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', k.g)} />
            <div className={cx('p-3 rounded-xl bg-gradient-to-br text-white shadow-lg', k.g)}><k.i className="w-5 h-5" /></div>
            <div><p className="text-xs text-slate-500 dark:text-slate-400">{k.t}</p><p className="rdtf-num text-2xl font-extrabold text-slate-800 dark:text-white">{k.v}</p></div>
          </div>
        ))}
      </div>

      <Card accent="from-sky-500 via-indigo-500 to-violet-500">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por correo…" className={cx(inputCls, 'w-full pl-9')} />
          </div>
          <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)} className={inputCls} aria-label="Filtrar por rol">
            <option value="">Rol: todos</option>
            <option value="admin">Admin</option>
            <option value="operador">Operador / Empleado</option>
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className={inputCls} aria-label="Filtrar por estado">
            <option value="">Estado: todos</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Desactivados</option>
          </select>
          {(q || filtroRol || filtroEstado) && (
            <Btn variant="soft" onClick={() => { setQ(''); setFiltroRol(''); setFiltroEstado(''); }}><Filter className="w-4 h-4" /> Limpiar</Btn>
          )}
        </div>

        {sel.size > 0 && (
          <div className="rdtf-rise mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-sky-400/40 bg-gradient-to-r from-sky-500/10 to-indigo-500/10 px-4 py-2.5">
            <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{sel.size} seleccionada(s)</span>
            <span className="flex-1" />
            <Btn variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => mutar([...sel], { activo: true }, 'activadas')}><UserCheck className="w-3.5 h-3.5" /> Activar</Btn>
            <Btn variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => mutar([...sel], { activo: false }, 'desactivadas')}><Ban className="w-3.5 h-3.5" /> Desactivar</Btn>
            <Btn variant="soft" className="!py-1.5 !px-3 !text-xs" onClick={() => setConfirmar([...sel])}><Trash2 className="w-3.5 h-3.5" /> Eliminar</Btn>
            <Btn variant="ghost" className="!py-1.5 !px-3 !text-xs" onClick={() => setSel(new Set())}><X className="w-3.5 h-3.5" /> Limpiar</Btn>
          </div>
        )}

        {isLoading ? <Skeleton filas={4} /> : filtrados.length === 0 ? (
          <Empty texto="No hay cuentas que coincidan con los filtros." accion={<Btn className="mt-3" onClick={() => setModal({})}><Plus className="w-4 h-4" /> Crear la primera</Btn>} />
        ) : (
          <div className="rdtf-scroll overflow-x-auto rounded-lg border border-slate-200/60 dark:border-gray-700/60">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-gradient-to-r from-sky-500/10 via-slate-50 to-violet-500/10 dark:via-gray-700/60 border-b border-slate-200 dark:border-gray-600">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={todosSel} onChange={toggleTodos} aria-label="Seleccionar todos"
                      ref={el => { if (el) el.indeterminate = algunosSel; }} className="w-4 h-4 rounded accent-violet-500 cursor-pointer" />
                  </th>
                  <Th campo="correo_user">Miembro</Th>
                  <Th campo="rol" className="w-52">Rol</Th>
                  <Th campo="activo" className="w-32">Estado</Th>
                  <th className="py-3 px-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-44">Baja lógica</th>
                  <th className="py-3 px-4 w-40 text-right"><span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"> </span></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((u, i) => {
                  const info = ROL_ESTILO[u.rol] || ROL_ESTILO.operador;
                  return (
                    <tr key={u.id_user} onClick={() => setDrawerId(u.id_user)}
                      className={cx('border-b border-slate-100 dark:border-gray-700/70 cursor-pointer transition-colors',
                        i % 2 ? 'bg-slate-50/50 dark:bg-gray-800/40' : 'bg-white dark:bg-gray-800',
                        sel.has(u.id_user) ? 'bg-sky-500/10' : 'hover:bg-violet-500/[0.06] dark:hover:bg-violet-400/[0.07]',
                        !u.activo && 'opacity-60')}>
                      <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" checked={sel.has(u.id_user)} onChange={() => toggleUno(u.id_user)} aria-label={`Seleccionar ${u.correo_user}`} className="w-4 h-4 rounded accent-violet-500 cursor-pointer" />
                      </td>
                      <td className="py-3 px-4">
                        <span className="flex items-center gap-2.5">
                          <Avatar nombre={u.correo_user.split('@')[0]} grad={info.grad} />
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">{u.correo_user}</span>
                            <span className="block text-[11px] text-slate-400">#{u.id_user}{esYo(u) ? ' · tu sesión' : ''}</span>
                          </span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold', info.badge)}>
                          <info.icon className="w-3.5 h-3.5" /> {info.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {u.activo
                          ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold bg-emerald-400/10 text-emerald-600 dark:text-emerald-300 border-emerald-400/40"><UserCheck className="w-3.5 h-3.5" /> Activo</span>
                          : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold bg-slate-400/10 text-slate-500 dark:text-slate-400 border-slate-400/40"><UserX className="w-3.5 h-3.5" /> Inactivo</span>}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">
                        {u.fec_eliminacion ? <>{fFechaHora(u.fec_eliminacion)}<br /><span className="text-slate-400">por {u.eliminado_por || '—'}</span></> : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                        <button type="button" onClick={() => setDrawerId(u.id_user)} title="Ver ficha" className="p-2 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-300 hover:bg-violet-500/10 transition"><Eye className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setModal(u)} title="Editar rol" className="p-2 rounded-lg text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 hover:bg-sky-500/10 transition"><Pencil className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setModalPass(u)} title="Restablecer contraseña" className="p-2 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-500/10 transition"><KeyRound className="w-4 h-4" /></button>
                        <button type="button" onClick={() => setConfirmar([u.id_user])} title="Desactivar cuenta" disabled={esYo(u)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-500/10 transition disabled:opacity-30 disabled:cursor-not-allowed"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {drawer && (
        <Drawer titulo={drawer.correo_user.split('@')[0]} sub={drawer.correo_user} grad={(ROL_ESTILO[drawer.rol] || ROL_ESTILO.operador).grad} onCerrar={() => setDrawerId(null)}>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className={cx('rounded-xl border py-3', (ROL_ESTILO[drawer.rol] || ROL_ESTILO.operador).badge)}>
              <p className="text-sm font-extrabold">{(ROL_ESTILO[drawer.rol] || ROL_ESTILO.operador).label}</p>
              <p className="text-[11px] opacity-70">rol actual</p>
            </div>
            <div className={cx('rounded-xl border py-3', drawer.activo ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-400/30' : 'bg-slate-400/10 text-slate-500 border-slate-400/30')}>
              <p className="text-sm font-extrabold">{drawer.activo ? 'Activo' : 'Inactivo'}</p>
              <p className="text-[11px] opacity-70">estado de cuenta</p>
            </div>
          </div>

          <Seccion icon={ShieldCheck} color="text-violet-500" titulo="Matriz de permisos efectiva">
            <ul className="space-y-1.5">
              {PERMISOS.map(p => (
                <li key={p.t} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  {p[drawer.rol] ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />}
                  <span className={cx(!p[drawer.rol] && 'opacity-50 line-through')}>{p.t}</span>
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion icon={Sparkles} color="text-sky-500" titulo="Ficha técnica">
            <div className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <p><span className="text-slate-400">ID interno:</span> #{drawer.id_user}</p>
              <p><span className="text-slate-400">id_rol (legado):</span> {drawer.id_rol}</p>
              <p><span className="text-slate-400">Baja lógica:</span> {drawer.fec_eliminacion ? `${fFechaHora(drawer.fec_eliminacion)} por ${drawer.eliminado_por || '—'}` : 'sin baja'}</p>
            </div>
          </Seccion>

          <div className="flex gap-2">
            <Btn className="flex-1" onClick={() => { setModal(drawer); setDrawerId(null); }}><Pencil className="w-4 h-4" /> Cambiar rol</Btn>
            <Btn variant="ghost" onClick={() => { setModalPass(drawer); setDrawerId(null); }}><KeyRound className="w-4 h-4" /> Contraseña</Btn>
          </div>
          {drawer.activo ? (
            <Btn variant="soft" className="w-full" disabled={esYo(drawer)} onClick={() => mutar([drawer.id_user], { activo: false }, 'desactivadas')}>
              <Ban className="w-4 h-4" /> Desactivar cuenta
            </Btn>
          ) : (
            <Btn variant="success" className="w-full" onClick={() => mutar([drawer.id_user], { activo: true }, 'reactivadas')}>
              <UserCheck className="w-4 h-4" /> Reactivar cuenta
            </Btn>
          )}
        </Drawer>
      )}

      {modal !== null && <ModalEmpleado miembro={modal.id_user ? modal : null} onClose={() => setModal(null)} />}
      {modalPass && <ModalPassword miembro={modalPass} onClose={() => setModalPass(null)} />}
      {confirmar && (
        <ConfirmModal titulo={`¿Desactivar ${confirmar.length} cuenta(s)?`}
          texto="Borrado lógico: la cuenta pierde el acceso pero su historial y auditoría se conservan. Puedes reactivarla o deshacer desde el toast."
          onCancelar={() => setConfirmar(null)} onConfirmar={() => eliminar(confirmar)} label="Desactivar" />
      )}
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>
  );
}