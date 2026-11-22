import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, AlertCircle, Loader2, Eye, EyeOff, Sparkles, ShieldCheck } from 'lucide-react';
import { cx } from '../design/sistema';
import { reglas, useValidacion, Campo, bordeCampo } from '../design/validacion';

const ESQUEMA = {
  email: [reglas.requerido('El correo es obligatorio'), reglas.email],
  password: [reglas.requerido('La contraseña es obligatoria'), reglas.password],
};

export default function Login() {
  const { login } = useAuth();
  const { valores, cambiar, tocar, mostrarError, validarTodo } = useValidacion({ email: '', password: '' }, ESQUEMA);
  const [verPass, setVerPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const { ok } = validarTodo();
    if (!ok) return;
    setLoading(true);
    const resultado = await login(valores.email.trim(), valores.password);
    if (!resultado.success) setError(resultado.error);
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-violet-700 via-fuchsia-700 to-sky-700" />
      <div aria-hidden className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-fuchsia-400/30 blur-3xl animate-pulse" />
      <div aria-hidden className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-sky-400/30 blur-3xl animate-pulse" />

      <div className="rdtf-rise relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 via-fuchsia-500 to-sky-500 rounded-2xl mb-4 shadow-lg shadow-violet-500/40">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">ReDTF</h1>
          <p className="text-slate-500 dark:text-gray-400 mt-1">Sistema de Gestión DTF · Print Studio</p>
        </div>

        {error && (
          <div role="alert" className="mb-4 p-3 bg-rose-500/10 border border-rose-400/40 rounded-lg flex items-center gap-2 text-rose-600 dark:text-rose-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Campo label="Correo electrónico" error={mostrarError('email')} obligatorio>
            <div className="relative">
              <Mail className={cx('absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5', mostrarError('email') ? 'text-rose-400' : 'text-slate-400')} />
              <input
                type="email"
                value={valores.email}
                onChange={cambiar('email')}
                onBlur={tocar('email')}
                aria-invalid={!!mostrarError('email')}
                className={cx('w-full pl-10 pr-4 py-2.5 border bg-white dark:bg-gray-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 outline-none transition placeholder-slate-400', bordeCampo(mostrarError('email'), !mostrarError('email') && valores.email.includes('@')))}
                placeholder="admin@redtf.com"
              />
            </div>
          </Campo>

          <Campo label="Contraseña" error={mostrarError('password')} obligatorio>
            <div className="relative">
              <Lock className={cx('absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5', mostrarError('password') ? 'text-rose-400' : 'text-slate-400')} />
              <input
                type={verPass ? 'text' : 'password'}
                value={valores.password}
                onChange={cambiar('password')}
                onBlur={tocar('password')}
                aria-invalid={!!mostrarError('password')}
                className={cx('w-full pl-10 pr-11 py-2.5 border bg-white dark:bg-gray-800 text-slate-800 dark:text-white rounded-lg focus:ring-2 outline-none transition placeholder-slate-400', bordeCampo(mostrarError('password'), !mostrarError('password') && valores.password.length >= 6))}
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setVerPass((v) => !v)} aria-label={verPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-violet-500 transition">
                {verPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </Campo>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:brightness-110 text-white py-2.5 rounded-lg font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-violet-500/30"
          >
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Ingresando...</>) : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 p-3 bg-slate-50 dark:bg-gray-800/60 rounded-lg text-xs text-slate-600 dark:text-gray-400 border border-slate-200 dark:border-gray-700">
          <p className="font-semibold mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Credenciales de prueba:</p>
          <p>Email: <code className="bg-white dark:bg-gray-900 px-1 rounded">admin@redtf.com</code></p>
          <p>Password: <code className="bg-white dark:bg-gray-900 px-1 rounded">admin123</code></p>
        </div>
      </div>
    </div>
  );
}