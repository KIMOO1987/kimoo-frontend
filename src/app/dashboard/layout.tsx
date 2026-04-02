import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { KimooProvider } from '@/context/KimooContext';
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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Expected in Server Components
          }
        },
      },
    }
  );

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 2. Redirect to login if no session exists
  if (!user || authError) {
    redirect('/login');
  }

  // 3. Fetch profile data (tier, role)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, role, subscription_status')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.error("Layout Fetch Error:", profileError.message);
  }

  // 4. ROLE & TIER SYNC
  // Define Staff Roles: both Admin and Moderator get "Tier 3" privileges automatically
  const isStaff = profile?.role === 'admin' || profile?.role === 'moderator';
  const userTier = isStaff ? 3 : (profile?.tier ?? 0);
  const userRole = profile?.role || 'user';

  return (
    <KimooProvider>
      <div className="flex bg-[#050505] min-h-screen relative overflow-hidden">
        {/* Pass the verified Tier and Role down */}
        <Sidebar tier={userTier} role={userRole} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <MobileNav tier={userTier} role={userRole} />

          <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
            <div className="h-full w-full">
              {/* Children (History, Active, etc.) will now inherit this session */}
              {children}
            </div>
          </main>
        </div>
      </div>
    </KimooProvider>
  );
}
