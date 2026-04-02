"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { Activity } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredTier?: number; // Optional: specify if a page needs Tier 1, 2, or 3
}

export default function RoleGuard({ children, requiredTier = 1 }: RoleGuardProps) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    const syncRole = async () => {
      if (authLoading) return;
      if (!user) {
        setStatus('denied');
        return;
      }

      try {
        // Direct Database Sync
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tier')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          setStatus('denied');
          return;
        }

        const role = profile.role?.toLowerCase();
        const tier = Number(profile.tier);

        // Access Logic: Admins get everything, others need the required tier
        const isStaff = ['admin', 'moderator'].includes(role);
        const isPaid = ['alpha', 'pro', 'ultimate'].includes(role) || tier >= requiredTier;

        if (isStaff || isPaid) {
          setStatus('granted');
        } else {
          setStatus('denied');
        }
      } catch (err) {
        setStatus('denied');
      }
    };

    syncRole();
  }, [user, authLoading, requiredTier]);

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Activity size={32} className="text-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Syncing CRT Permissions...</p>
      </div>
    );
  }

  if (status === 'denied') {
    // Maps the required tier to a name for your AccessGuard component
    const tierName = requiredTier === 3 ? "Ultimate" : requiredTier === 2 ? "Pro" : "Alpha";
    return <AccessGuard tierName={tierName} />;
  }

  return <>{children}</>;
}
