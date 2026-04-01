import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav'; //
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
            // This can be ignored if middleware handles session refreshes
          }
        },
      },
    }
  );

  // Get user to fetch profile
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch Pro Status
  let isPro = false;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_pro')
      .eq('id', user.id)
      .single();
    
    isPro = !!profile?.is_pro;
  }

  return (
    <KimooProvider>
      <div className="flex bg-[#050505] min-h-screen relative">
        {/* DESKTOP SIDEBAR: Handled via 'hidden lg:flex' inside its own file */}
        <Sidebar isPro={isPro} />

        {/* MOBILE NAVIGATION: Handled via 'lg:hidden' inside its own file */}
        <MobileNav isPro={isPro} />

        <main className="flex-1 overflow-y-auto w-full">
          {children}
        </main>
      </div>
    </KimooProvider>
  );
}
