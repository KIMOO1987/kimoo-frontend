"use client";

import { login } from './actions';
import { useFormStatus } from 'react-dom';
import { Lock, Mail, Loader2, ShieldCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] p-6">
      <div className="crt-card w-full max-w-md p-10 relative overflow-hidden">
        {/* Subtle background glow for the card */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/5 blur-[100px] pointer-events-none" />
        
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            CRT<span className="text-blue-500 underline decoration-blue-500/20 underline-offset-8">BOTS</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-2">
            Institutional Access
          </p>
        </div>

        <form action={login} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input 
                name="email"
                type="email"
                required
                placeholder="name@company.com"
                className="crt-input w-full pl-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Master Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input 
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="crt-input w-full pl-12"
              />
            </div>
          </div>

          <SubmitButton />
        </form>

        {/* Footer Actions */}
        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
          <Link 
            href="/signup" 
            className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all transition-colors"
          >
            <span className="text-[10px] font-black uppercase tracking-widest">New Operator?</span>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all">
              <span className="text-[10px] font-bold text-blue-500 uppercase">Create Identity</span>
              <UserPlus size={12} className="text-blue-500" />
            </div>
          </Link>

          <div className="flex items-center gap-2 opacity-30">
            <ShieldCheck size={12} className="text-zinc-500" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">Encrypted AES-256 Link Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="crt-btn-primary w-full flex items-center justify-center gap-2 py-4 mt-4 relative overflow-hidden group"
    >
      {pending ? (
        <Loader2 className="animate-spin" size={16} />
      ) : (
        <>
          <span className="relative z-10">Authenticate</span>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
        </>
      )}
    </button>
  );
}