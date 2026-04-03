"use client";

import { requestPasswordReset } from '../login/actions';
import { useFormStatus } from 'react-dom';
import { Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const success = searchParams.get('success');

  return (
    <div className="crt-card w-full max-w-md p-10 relative overflow-hidden">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase">Access <span className="text-blue-500">Recovery</span></h1>
        <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold mt-2">Instructional Flow</p>
      </div>

      {error && <p className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-3 rounded-lg mb-6 uppercase font-black text-center">{error}</p>}
      {success && <p className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] p-3 rounded-lg mb-6 uppercase font-black text-center">{success}</p>}

      <form action={requestPasswordReset} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
            <input name="email" type="email" required placeholder="operator@kimoo.com" className="crt-input w-full pl-12" />
          </div>
        </div>
        <SubmitButton />
      </form>

      <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center">
        <Link href="/login" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all">
          <ArrowLeft size={12} />
          <span className="text-[10px] font-black uppercase tracking-widest">Return to Base</span>
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] p-6">
      <Suspense fallback={<Loader2 className="animate-spin text-zinc-500" />}>
        <ForgotPasswordContent />
      </Suspense>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="crt-btn-primary w-full flex items-center justify-center gap-2 py-4 mt-4 relative overflow-hidden group">
      {pending ? <Loader2 className="animate-spin" size={16} /> : <span className="relative z-10 uppercase font-black tracking-widest text-[11px]">Request Reset Link</span>}
    </button>
  );
}