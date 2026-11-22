import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Users, X, Save, Phone, User } from 'lucide-react';
import { cx, Btn, inputCls, useToasts, Toasts } from '../design/sistema';
import { reglas, useValidacion, Campo, ResumenErrores, bordeCampo } from '../design/validacion';

const ESQUEMA = {
  nombre_user: [reglas.requerido('El nombre es obligatorio'), reglas.nombre],
  telf_user: [reglas.telefono],
};

export default function FormularioCliente({ cliente = null, onClose }) {
  const qc = useQueryClient();
  const { toasts, push, cerrar } = useToasts();
  const { valores, cambiar, tocar, mostrarError, validarTodo, reset } = useValidacion(
    { nombre_user: cliente?.nombre_user || '', telf_user: cliente?.telf_user || '' },
    ESQUEMA
  );
  const [enviando, setEnviando] = useState(false);
  const [erroresEnvio, setErroresEnvio] = useState(null);
  const editando = !!cliente;

  const guardar = async (e) => {
    e.preventDefault();
    setErroresEnvio(null);
    const { ok, errs } = validarTodo();
    if (!ok) { setErroresEnvio(errs); return; }
    setEnviando(true);
    try {
      const payload = { nombre_user: valores.nombre_user.trim(), telf_user: valores.telf_user.trim() || null };
      if (editando) await api.put(`/clientes/${cliente.id_cli}`, payload);
      else await api.post('/clientes/', payload);
      qc.invalidateQueries(['clientes']);
      push('success', editando ? `Cliente "${payload.nombre_user}" actualizado.` : `Cliente "${payload.nombre_user}" registrado.`);
      reset();
      setTimeout(onClose, 600);
    } catch (err) {
      const detalle = err.response?.data?.detail || err.message;
      setErroresEnvio({ servidor: detalle });
      push('error', `No se pudo guardar: ${detalle}`);
    } finally {
      setEnviando(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
      <div className="rdtf-scrim absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="rdtf-menu relative w-full max-w-md rounded-2xl border border-violet-400/30 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-white/15"><Users className="w-5 h-5" /></span>
            <div>
              <h2 className="text-lg font-extrabold">{editando ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <p className="text-xs opacity-85">{editando ? `Registro #${cliente.id_cli}` : 'Alta en el directorio del estudio'}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="p-2 rounded-lg hover:bg-white/15 transition"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={guardar} noValidate className="p-5 space-y-4">
          {erroresEnvio && <ResumenErrores errores={erroresEnvio} />}

          <Campo label="Nombre / Razón social" obligatorio error={mostrarError('nombre_user')}
            valido={!mostrarError('nombre_user') && valores.nombre_user.trim().length >= 3}>
            <div className="relative">
              <User className={cx('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', mostrarError('nombre_user') ? 'text-rose-400' : 'text-slate-400')} />
              <input
                value={valores.nombre_user}
                onChange={cambiar('nombre_user')}
                onBlur={tocar('nombre_user')}
                aria-invalid={!!mostrarError('nombre_user')}
                placeholder="Ej: Alfredo Pérez"
                className={cx(inputCls, 'w-full pl-9', bordeCampo(mostrarError('nombre_user'), !mostrarError('nombre_user') && valores.nombre_user.trim().length >= 3))}
              />
            </div>
          </Campo>

          <Campo label="Teléfono" error={mostrarError('telf_user')}
            valido={!mostrarError('telf_user') && !!valores.telf_user}
            ayuda="Opcional · 7–15 dígitos, admite +, -, ( ) y espacios">
            <div className="relative">
              <Phone className={cx('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', mostrarError('telf_user') ? 'text-rose-400' : 'text-slate-400')} />
              <input
                value={valores.telf_user}
                onChange={cambiar('telf_user')}
                onBlur={tocar('telf_user')}
                aria-invalid={!!mostrarError('telf_user')}
                placeholder="0414 123 4567"
                className={cx(inputCls, 'w-full pl-9', bordeCampo(mostrarError('telf_user'), !mostrarError('telf_user') && !!valores.telf_user))}
              />
            </div>
          </Campo>

          <div className="flex gap-2.5 pt-1">
            <Btn variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Btn>
            <Btn type="submit" disabled={enviando} className="flex-1 !bg-gradient-to-r !from-sky-500 !to-blue-600">
              {enviando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              {editando ? 'Guardar cambios' : 'Registrar cliente'}
            </Btn>
          </div>
        </form>
      </div>
      <Toasts items={toasts} onCerrar={cerrar} />
    </div>, document.body);
}