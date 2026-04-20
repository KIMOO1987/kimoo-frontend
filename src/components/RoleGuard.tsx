"use client";

import { useAuth } from '@/hooks/useAuth';
import AccessGuard from '@/components/AccessGuard';
import { Activity } from 'lucide-react';

export default function RoleGuard({ children }: { children: React.ReactNode }) {
  const { user, role, tier, loading } = useAuth();

  // DEBUG LOG: Shows exactly what the Guard sees in your browser console (F12)
  console.log("DEBUG AUTH:", {
    isLoggedIn: !!user,
    currentRole: role,
    currentTier: tier,
    isLoading: loading,
  });

  // 1. While Supabase is verifying the session, show a spinner
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <Activity size={32} className="text-blue-500 animate-spin" />
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">
          Verifying Access...
        </p>
      </div>
    );
  }

  // 2. Loading is done but no user session found — block access
  if (!user) {
    return <AccessGuard tierName="Alpha" />;
  }

  // 3. User is confirmed — render the page
  return <>{children}</>;
}
