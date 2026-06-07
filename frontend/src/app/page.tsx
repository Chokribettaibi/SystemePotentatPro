'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ShieldCheck, Mail, Lock, LogIn, Cpu, Database } from 'lucide-react';

export default function LoginPage() {
  const { login, user } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      router.push('/dashboard');
    }
  };

  const loadPreset = (presetRole: string) => {
    if (presetRole === 'admin') {
      setEmail('admin@potentat.com');
      setPassword('Password123');
    } else if (presetRole === 'manager') {
      setEmail('manager@potentat.com');
      setPassword('Password123');
    } else {
      setEmail('cashier@potentat.com');
      setPassword('Password123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
<<<<<<< HEAD
      
=======

>>>>>>> 0039a80 (chore: include frontend files (convert submodule to tracked folder))
      {/* Background Neon Blur Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
<<<<<<< HEAD
        
=======

>>>>>>> 0039a80 (chore: include frontend files (convert submodule to tracked folder))
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-400 to-indigo-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.5)] mb-3 border border-cyan-300/20">
            <Cpu className="text-[#060919] w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white glow-text-blue">POTENTAT PRO</h1>
          <p className="text-sm text-cyan-400/80 uppercase font-mono tracking-widest mt-1">Enterprise POS & Inventory</p>
        </div>

        {/* Glassmorphic Form Card */}
        <div className="glass-panel p-8 border border-sky-900/35 relative">
<<<<<<< HEAD
          
=======

>>>>>>> 0039a80 (chore: include frontend files (convert submodule to tracked folder))
          {/* Card subtle scanline effect */}
          <div className="absolute inset-0 rounded-3xl bg-[linear-gradient(rgba(18,24,64,0.03)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none" />

          <h2 className="text-xl font-semibold text-slate-100 mb-6 flex items-center gap-2">
            <ShieldCheck size={20} className="text-cyan-400" />
            Security Login
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase text-slate-400 tracking-wider mb-2">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@store.com"
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium uppercase text-slate-400 tracking-wider mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/50 border border-sky-900/50 rounded-xl py-3 pl-11 pr-4 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 rounded-xl glow-button text-slate-950 font-bold text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  Authorize Access
                </>
              )}
            </button>
          </form>

          {/* Quick presets for testing */}
          <div className="mt-8 pt-6 border-t border-sky-950/50">
            <p className="text-xs text-center text-slate-400 mb-3 flex items-center justify-center gap-1.5 font-medium uppercase tracking-wider">
              <Database size={12} className="text-cyan-400" />
              Sandbox Account Presets
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => loadPreset('admin')}
                className="py-1.5 px-2 bg-sky-950/40 hover:bg-sky-950/80 border border-sky-900/30 rounded-lg text-[10px] font-semibold text-cyan-400 transition-colors"
              >
                ADMIN
              </button>
              <button
                onClick={() => loadPreset('manager')}
                className="py-1.5 px-2 bg-sky-950/40 hover:bg-sky-950/80 border border-sky-900/30 rounded-lg text-[10px] font-semibold text-cyan-400 transition-colors"
              >
                MANAGER
              </button>
              <button
                onClick={() => loadPreset('cashier')}
                className="py-1.5 px-2 bg-sky-950/40 hover:bg-sky-950/80 border border-sky-900/30 rounded-lg text-[10px] font-semibold text-cyan-400 transition-colors"
              >
                CASHIER
              </button>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-3 font-mono">Password: Password123</p>
          </div>

        </div>

      </div>
    </div>
  );
}
