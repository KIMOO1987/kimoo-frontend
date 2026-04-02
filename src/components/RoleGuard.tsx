"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { Activity } from 'lucide-react';

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, role, tier, loading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setStatus('denied');
      return;
    }

    // MASTER BYPASS: If you are admin, you get in. 
    // Otherwise, you need at least Tier 1.
    console.log("GUARD CHECK:", { role, tier });
    
      const isStaff = role?.toLowerCase() === 'admin' || role?.toLowerCase() === 'moderator';
      const hasTier = Number(tier) >= 1;
    
      if (isStaff || hasTier) {
        setStatus('granted');
      } else {
        setStatus('denied');
      }
    }, [user, role, tier, loading]);
  
  console.log("DEBUG AUTH:", { user: !!user, role, tier, status });
  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Activity size={32} className="text-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Syncing CRT Permissions...</p>
      </div>
    );
  }

  if (status === 'denied') {
    return <AccessGuard tierName="Alpha" />;
  }

  return <>{children}</>;
}
