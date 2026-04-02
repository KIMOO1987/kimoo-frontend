"use client";

import { useAuth } from '@/hooks/useAuth';
import { Lock, Activity } from 'lucide-react';
import Link from 'next/link';

interface AccessGuardProps {
  children: React.ReactNode;
  requiredTier: number;
  tierName: string;
}

export default function AccessGuard({ children, requiredTier, tierName }: AccessGuardProps) {
  const { tier, loading } = useAuth();

  // 1. Strict Loading State
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-transparent">
        <Activity size={32} className="text-blue-500 animate-spin" />
      </div>
    );
  }

  // 2. HARD LOCKDOWN: If tier is 0, null, undefined, or less than required
  // This prevents "fall-through" access
  const hasAccess = tier !== null && tier !== undefined && tier >= requiredTier;

  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
          <Lock className="text-blue-500" size={32} />
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">
          {tierName} <span className="text-blue-500">Access Required</span>
        </h2>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-4 max-w-md leading-relaxed">
          The CRT Institutional protocol for this module is locked for your current subscription level.
        </p>
        <Link 
          href="/pricing" 
          className="mt-8 px-8 py-4 bg-blue-500 text-black font-black uppercase text-[10px] tracking-[0.2em] rounded-full hover:bg-blue-400 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]"
        >
          Upgrade to {tierName}
        </Link>
      </div>
    );
  }

  // 3. Authorized Access
  return <>{children}</>;
}
