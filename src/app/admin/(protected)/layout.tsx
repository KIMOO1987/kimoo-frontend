"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/AdminSidebar';
import AdminMobileNav from '@/components/AdminMobileNav';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/admin/login';
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (data?.role === 'admin' || data?.role === 'moderator') {
        setRole(data.role);
      } else {
        window.location.href = '/dashboard'; // Boot non-admins back to user area
      }
      setLoading(false);
    }
    getRole();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#030407]">
      <div className="flex flex-col items-center justify-center space-y-6">
        <Loader2 className="animate-spin mx-auto text-blue-400 drop-shadow-[0_0_10px_rgba(96,165,250,0.5)]" size={48} />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Verifying Clearance...</p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#030407] overflow-x-hidden">
      <AdminSidebar userRole={role || 'user'} />
      <main className="flex-1 lg:ml-72 overflow-y-auto">
        {children}
      </main>
      <AdminMobileNav userRole={role || 'user'} />
    </div>
  );
}
