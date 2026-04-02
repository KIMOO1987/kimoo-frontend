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

  // 1. SECURE AUTH CHECK
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. FETCH USER PROFILE DATA (Removing MT4/MT5 Broker Logic)
  // We now fetch personal details like name, country, and address instead of broker accounts.
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_pro, expiry_date, full_name, country, address, email')
    .eq('id', user.id)
    .single();

  let activeProfile = profile;

  // 3. AUTO-REPAIR: Ensure profile record exists
  if (!activeProfile || error) {
    console.log(`[REPAIR] Profile missing for ${user.email}. Creating record...`);
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({ 
        id: user.id, 
        email: user.email, 
        is_pro: false,
        expiry_date: null,
        full_name: '',
        country: '',
        address: ''
      })
      .select('is_pro, expiry_date, full_name, country, address, email')
      .single();
    
    activeProfile = newProfile;
  }

  // DEBUG LOGS (Updated for Signal Service model)
  console.log("--- KIMOO SIGNAL CONSOLE SYNC ---");
  console.log("User:", user.email);
  console.log("Identity:", activeProfile?.full_name || "Not set");
  console.log("Region:", activeProfile?.country || "Not set");
  console.log("Pro Status:", !!activeProfile?.is_pro);
  console.log("-----------------------");

  // 4. Pass everything to the DashboardClient
  // Passing the personal profile data instead of initialAccounts
  return (
    <DashboardClient 
      isPro={!!activeProfile?.is_pro} 
      expiryDate={activeProfile?.expiry_date}
      userProfile={{
        fullName: activeProfile?.full_name,
        country: activeProfile?.country,
        address: activeProfile?.address,
        email: activeProfile?.email
      }}
    />
  );
}
