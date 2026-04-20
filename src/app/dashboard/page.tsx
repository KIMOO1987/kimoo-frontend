import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export default async function DashboardPage() {
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
            // Handled by middleware
          }
        },
      },
    }
  );

  // 1. Secure auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. Fetch user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, tier, role, plan_type, expiry_date, full_name, country, email, account_size, risk_value, reward_value')
    .eq('id', user.id)
    .single();

  let activeProfile = profile;

  // 3. Auto-repair: if no profile exists, create one
  // FIXED: upsert select now includes plan_type to match the type of activeProfile above
  if (!activeProfile || error) {
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        tier: 0,
        role: 'user',
        plan_type: null,
        full_name: 'TRADER',
        account_size: 100000,
        risk_value: 1.0,
        reward_value: 2.0
      })
      .select('id, tier, role, plan_type, expiry_date, full_name, country, email, account_size, risk_value, reward_value')
      .single();

    activeProfile = newProfile;
  }

  return (
    <DashboardClient
      tier={activeProfile?.tier ?? 0}
      expiryDate={activeProfile?.expiry_date}
      userProfile={activeProfile}
    />
  );
}
