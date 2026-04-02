import { AuthProvider } from '@/hooks/useAuth';
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
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
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

  // 1. Get user session - Strict Check
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 2. Immediate redirect only if user definitely does not exist
  if (!user || authError) {
    redirect('/login');
  }

  // 3. Fetch profile data
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, role, subscription_status')
    .eq('id', user.id)
    .single();

  // 4. MASTER PASS LOGIC (Admin & Moderator)
  // We determine if they are staff. If profile fetch fails, we default to 'user' 
  // but we don't redirect yet to prevent loops.
  const userRole = profile?.role || 'user';
  const isStaff = userRole === 'admin' || userRole === 'moderator';
  
  // Staff accounts get Tier 3 access regardless of what the 'tier' column says
  const userTier = isStaff ? 3 : (profile?.tier ?? 0);

  return (
      <Providers> {/* This is now safe to use in a Server Component */}
        <div className="flex bg-[#050505] min-h-screen relative overflow-hidden">
          <Sidebar tier={userTier} role={userRole} />
          
          <div className="flex-1 flex flex-col min-w-0">
            <MobileNav tier={userTier} role={userRole} />
  
            <main className="flex-1 overflow-y-auto w-full custom-scrollbar">
              <div className="h-full w-full">
                {children}
              </div>
            </main>
          </div>
        </div>
      </Providers>
    );
  }
