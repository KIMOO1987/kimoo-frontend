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
            // This is expected when called from a Server Component
          }
        },
      },
    }
  );

  // 1. Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  // 2. Immediate redirect if no user
  if (!user || authError) {
    redirect('/login');
  }

  // 3. Fetch profile data
  // We use .select('*') to ensure we get everything, including your 'tier' column
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('tier, role, subscription_status')
    .eq('id', user.id)
    .single();

  // DEBUG LOG: If you still see "Nill", check your terminal for this message
  if (profileError) {
    console.error("Layout Fetch Error:", profileError.message);
  }

  // 4. Robust Fallback Logic
  // This ensures that even if the DB is slow, the UI gets a number
  const userTier = profile?.tier ?? 0;

  return (
    <KimooProvider>
      <div className="flex bg-[#050505] min-h-screen relative">
        {/* Pass the verified Tier to navigation components */}
        <Sidebar tier={userTier} />
        
        {/* Ensure MobileNav is also updated to accept 'tier' */}
        <MobileNav tier={userTier} />

        <main className="flex-1 overflow-y-auto w-full">
          {/* We wrap children in a container to ensure layout stability */}
          <div className="h-full w-full">
            {children}
          </div>
        </main>
      </div>
    </KimooProvider>
  );
}
