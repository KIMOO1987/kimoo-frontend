import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import { KimooProvider } from '@/context/KimooContext';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
            // Ignore if handled by middleware
          }
        },
      },
    }
  );

  // 1. Get user to fetch profile
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch the numeric Tier (instead of isPro)
  let userTier = 0; // Default to Free
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier') // Use your new 'tier' column
      .eq('id', user.id)
      .single();
    
    // If the profile has a tier, use it, otherwise stay at 0
    userTier = profile?.tier ?? 0;
  }

  return (
    <KimooProvider>
      <div className="flex bg-[#050505] min-h-screen relative">
        {/* 3. Pass 'userTier' to your Sidebar and MobileNav */}
        <Sidebar tier={userTier} />

        {/* Note: Make sure MobileNav.tsx is also updated to accept 'tier' */}
        <MobileNav tier={userTier} />

        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </KimooProvider>
  );
}
