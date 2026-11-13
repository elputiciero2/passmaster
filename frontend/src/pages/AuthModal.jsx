import React, { useState } from 'react';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ShieldCheck, UserCheck } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CUSTOMER'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role) => {
    setIsRegister(false);
    if (role === 'ADMIN') {
      setFormData({ email: 'admin@passmaster.com', password: 'Password123!', name: '', role: 'ADMIN' });
    } else if (role === 'STAFF') {
      setFormData({ email: 'staff@passmaster.com', password: 'Password123!', name: '', role: 'STAFF' });
    } else {
      setFormData({ email: 'cliente@passmaster.com', password: 'Password123!', name: '', role: 'CUSTOMER' });
    }
    setError('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? 'Crear Cuenta en PassMaster' : 'Iniciar Sesión'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-rose-300 bg-rose-950/50 border border-rose-800 rounded-xl">
            {error}
          </div>
        )}

        {isRegister && (
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Nombre Completo</label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Juan Pérez"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Correo Electrónico</label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="tu@correo.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Contraseña</label>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-3 text-slate-500" />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all text-sm mt-2"
        >
          {loading ? 'Procesando...' : isRegister ? 'Registrarme' : 'Entrar a PassMaster'}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => { setIsRegister(!isRegister); setError(''); }}
            className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
          >
            {isRegister ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿Aún no tienes cuenta? Regístrate aquí'}
          </button>
        </div>

        {/* Cuentas de Demostración Rápidas */}
        <div className="pt-4 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Acceso Rápido para Pruebas y Evaluación
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('ADMIN')}
              className="px-2 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-800/80 hover:bg-indigo-900 text-[11px] font-medium text-indigo-300 flex flex-col items-center justify-center transition-colors"
            >
              <ShieldCheck className="w-4 h-4 mb-0.5" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('STAFF')}
              className="px-2 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/80 hover:bg-emerald-900 text-[11px] font-medium text-emerald-300 flex flex-col items-center justify-center transition-colors"
            >
              <UserCheck className="w-4 h-4 mb-0.5" />
              <span>Staff Check-in</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('CUSTOMER')}
              className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 text-[11px] font-medium text-slate-200 flex flex-col items-center justify-center transition-colors"
            >
              <User className="w-4 h-4 mb-0.5" />
              <span>Cliente</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
