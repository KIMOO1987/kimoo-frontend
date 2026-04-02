import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { Providers } from '@/components/Providers'; 
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Safe to ignore in Server Components
          }
        },
      },
    }
  );

  // 1. Get user session
  const { data: { user } } = await supabase.auth.getUser();

  // 2. If no user, send to login immediately
  if (!user) {
    redirect('/login');
  }

  // 3. Fetch profile (This is the "Source of Truth")
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier, role')
    .eq('id', user.id)
    .single();

  // 4. Permission Logic
  const userRole = profile?.role || 'user';
  const isStaff = userRole === 'admin' || userRole === 'moderator';
  const userTier = isStaff ? 3 : (profile?.tier ?? 0);

  return (
    <Providers>
      <div className="flex bg-[#050505] min-h-screen relative overflow-hidden">
        {/* Pass the data we just fetched directly to the Nav components */}
        <Sidebar tier={userTier} role={userRole} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav tier={userTier} role={userRole} />

          <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
            <div className="h-full w-full px-4 md:px-0">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Providers>
  );
}
