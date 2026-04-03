"use client";

import { login } from './actions';
import { useFormStatus } from 'react-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="crt-card w-full max-w-md p-6 md:p-10 relative overflow-hidden">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">Client <span className="text-blue-500">Terminal</span></h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-2 italic">Institutional Access Point</p>
      </div>

      {error && <p className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-3 rounded-lg mb-6 uppercase font-black text-center">{error}</p>}

      <form action={login} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Operator Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input name="email" type="email" required placeholder="operator@kimoo.com" className="crt-input w-full pl-12" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Access Key</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input name="password" type="password" required placeholder="••••••••" className="crt-input w-full pl-12" />
          </div>
        </div>

        <div className="flex justify-end px-1">
          <Link 
            href="/forgot-password" 
            className="text-[9px] font-black uppercase text-zinc-500 hover:text-blue-500 transition-colors tracking-widest"
          >
            Forgot Access Key?
          </Link>
        </div>

        <SubmitButton />
      </form>

      <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <Link href="/signup" className="text-blue-500 hover:text-blue-400 transition-colors ml-2">
            Create new account
          </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] p-6">
      <Suspense fallback={<Loader2 className="animate-spin text-zinc-500" />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="crt-btn-primary w-full flex items-center justify-center gap-2 py-4 mt-4 relative overflow-hidden group">
      {pending ? <Loader2 className="animate-spin" size={16} /> : <span className="relative z-10 uppercase font-black tracking-widest text-[11px]">Authorize Link</span>}
    </button>
  );
}
