"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import AdminSidebar from '@/components/AdminSidebar';
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
    <div className="h-screen bg-[#05070a] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#05070a] overflow-x-hidden">
      <AdminSidebar userRole={role || 'user'} />
      <main className="flex-1 lg:ml-72 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
