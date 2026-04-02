"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { Activity } from 'lucide-react';

export default function RoleGuard({ children, requiredTier = 1 }: { children: React.ReactNode; requiredTier?: number }) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    const fetchFreshProfile = async () => {
      // 1. Wait for Auth to initialize
      if (authLoading) return;

      // 2. If no user, strictly deny
      if (!user) {
        setStatus('denied');
        return;
      }

      try {
        // 3. FORCE FETCH from Database (bypass local cache)
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, tier')
          .eq('id', user.id)
          .single();

        if (error || !profile) {
          console.error("Guard Error:", error);
          setStatus('denied');
          return;
        }

        // 4. Permission Logic
        const role = profile.role?.toLowerCase();
        const tier = Number(profile.tier);

        const isStaff = role === 'admin' || role === 'moderator';
        const hasTier = tier >= requiredTier || ['alpha', 'pro', 'ultimate'].includes(role);

        if (isStaff || hasTier) {
          setStatus('granted');
        } else {
          setStatus('denied');
        }
      } catch (err) {
        setStatus('denied');
      }
    };

    fetchFreshProfile();
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
    const tierName = requiredTier >= 3 ? "Ultimate" : requiredTier === 2 ? "Pro" : "Alpha";
    return <AccessGuard tierName={tierName} />;
  }

  return <>{children}</>;
}
