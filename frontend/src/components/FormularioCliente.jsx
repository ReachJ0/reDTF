import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { Users, X, Save, Phone, User, CheckCircle, XCircle } from 'lucide-react';
import { cx, Btn, inputCls, labelCls, useToasts, Toasts } from '../design/sistema';

export default function FormularioCliente({ cliente = null, onClose }) {
  const qc = useQueryClient();
  const { toasts, push, cerrar } = useToasts();
  const [form, setForm] = useState({ nombre_user: cliente?.nombre_user || '', telf_user: cliente?.telf_user || '' });
  const [enviando, setEnviando] = useState(false);
  const editando = !!cliente;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.nombre_user.trim()) return push('error', 'El nombre del cliente es obligatorio.');
    setEnviando(true);
    try {
      const payload = { nombre_user: form.nombre_user.trim(), telf_user: form.telf_user.trim() };
      if (editando) await api.put(`/clientes/${cliente.id_cli}`, payload);
      else await api.post('/clientes/', payload);
      qc.invalidateQueries(['clientes']);
      push('success', editando ? `Cliente "${payload.nombre_user}" actualizado.` : `Cliente "${payload.nombre_user}" registrado.`);
      setTimeout(onClose, 700);
    } catch (err) {
      push('error', `No se pudo guardar: ${err.response?.data?.detail || err.message}`);
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

        <form onSubmit={guardar} className="p-5 space-y-4">
          <div>
            <label className={labelCls} htmlFor="cli-nombre">Nombre / Razón social *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input id="cli-nombre" value={form.nombre_user} onChange={set('nombre_user')} required autoFocus
                placeholder="Ej: Alfredo Pérez" className={cx(inputCls, 'w-full pl-9')} />
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="cli-telf">Teléfono</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input id="cli-telf" value={form.telf_user} onChange={set('telf_user')}
                placeholder="0414 123 4567" className={cx(inputCls, 'w-full pl-9')} />
            </div>
          </div>

          <div className="rounded-xl border border-sky-400/30 bg-gradient-to-r from-sky-500/10 to-violet-500/10 p-3.5 text-xs text-slate-500 dark:text-slate-400">
            <p className="flex items-center gap-1.5 font-bold text-sky-600 dark:text-sky-300 mb-1"><CheckCircle className="w-3.5 h-3.5" /> Vinculación automática</p>
            Al crear órdenes, este cliente quedará disponible en el selector y su historial de impresión se acumulará en su ficha.
          </div>

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