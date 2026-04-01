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
            // Handled by middleware
          }
        },
      },
    }
  );

  // 1. STRENGTHENED AUTH CHECK: Get user session
  const { data: { user } } = await supabase.auth.getUser();

  // 2. IMMEDIATE REDIRECT: If no user on the server, kick to login
  if (!user) {
    redirect('/login');
  }

  // 3. FETCH PROFILE DATA: Ensure we get the tier and details
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tier, plan_type, subscription_status')
    .eq('id', user.id)
    .single();

  // 4. FALLBACK LOGIC: If profile doesn't exist yet, default to Tier 0
  const userTier = profile?.tier ?? 0;

  return (
    <KimooProvider>
      <div className="flex bg-[#050505] min-h-screen relative">
        {/* Pass the verified Tier to navigation components */}
        <Sidebar tier={userTier} />
        <MobileNav tier={userTier} />

        <main className="flex-1 overflow-y-auto w-full">
          {/* Optionally pass the profile as a prop to children 
              if your pages need server-side data immediately 
          */}
          {children}
        </main>
      </div>
    </KimooProvider>
  );
}
