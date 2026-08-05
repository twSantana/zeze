import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Building, Sun, Moon, AlertTriangle, AlertCircle } from 'lucide-react';

export default function LoginScreen({ onThemeToggle, theme }) {
  const { login, supabaseError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    try {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      
      {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-500 scale-105"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1549693578-d683be217e58?w=1600&auto=format&fit=crop&q=80')`,
          filter: 'brightness(0.3) blur(6px)'
        }}
      />

      {/* Theme Toggle Button (Sol/Lua) no topo superior direito */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={onThemeToggle}
          className="p-3 rounded-2xl glass-panel border border-white/10 text-white hover:bg-white/20 transition-all duration-300"
          title="Alternar Tema"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* Container Centralizado */}
      <div className="relative z-10 w-full max-w-md p-4 animate-fadeIn">
        <div className="w-full bg-white/95 dark:bg-slate-900/90 border border-white/10 dark:border-slate-800/40 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 transition-colors duration-300">
          
          {/* Logo / Título */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 mb-3 shadow-lg shadow-emerald-500/10">
              <Building size={28} />
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white font-sans uppercase tracking-wider">
              Mapeamento RMC
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Plataforma de Corretores & Consultores
            </span>
          </div>

          {supabaseError ? (
            <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-700 flex items-center gap-2">
              <AlertTriangle size={14} />
              <span>{supabaseError}</span>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {'Modo Supabase ativo: insira credenciais reais do Supabase.'}
            </div>
          )}

          {/* Feedback de Erro */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">E-mail / Usuário</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin ou corretor@imobiliaria.com"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-slate-850 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full text-xs border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-3 text-slate-850 dark:text-slate-100 bg-white dark:bg-slate-950/50 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 hover:dark:bg-slate-700 font-bold text-xs transition shadow-md disabled:bg-slate-300"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>

          {/* Atalhos do Modo Preview */}

        </div>
      </div>
    </div>
  );
}
