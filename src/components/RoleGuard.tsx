"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { Activity } from 'lucide-react';

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, role, tier, loading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'granted' | 'denied'>('loading');

  useEffect(() => {
    // 1. Wait for the Auth system to finish checking cookies/Supabase
    if (loading) return;

    const checkAccess = () => {
      // 2. FOR TESTING: If there is a user, let them in.
      // We are ignoring role and tier restrictions for now.
      if (user) {
        setStatus('granted');
      } else {
        // Only deny if there is absolutely no user session found
        setStatus('denied');
      }
    };

    // Keep a small delay to prevent flickering, but execute immediately if user is found
    const timer = setTimeout(checkAccess, user ? 0 : 300);
    return () => clearTimeout(timer);
  }, [user, loading]);

  // DEBUG LOG: This will show you exactly what the Guard sees in your browser console (F12)
  console.log("DEBUG AUTH (Unlocked Mode):", { 
    isLoggedIn: !!user, 
    currentRole: role, 
    currentTier: tier, 
    finalStatus: status 
  });

  if (status === 'loading') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Activity size={32} className="text-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
          Bypassing Restrictions...
        </p>
      </div>
    );
  }

  // If someone is not logged in at all, show the access guard
  if (status === 'denied') {
    return <AccessGuard tierName="Alpha" />;
  }

  // If status is 'granted', show the actual page content
  return <>{children}</>;
}