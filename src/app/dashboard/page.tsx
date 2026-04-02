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

  // 2. FETCH USER PROFILE DATA (Updated to include tier and role)
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('tier, role, plan_type, expiry_date, full_name, country, email, account_size')
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
        tier: 0,
        role: 'user',
        full_name: 'TRADER',
        account_size: 100000
      })
      .select('tier, role, expiry_date, full_name, country, email, account_size')
      .single();
    
    activeProfile = newProfile;
  }

  // DEBUG LOGS - Check your VSCode terminal for these!
  console.log("--- KIMOO SIGNAL CONSOLE SYNC ---");
  console.log("User:", user.email);
  console.log("Tier Level:", activeProfile?.tier); // Should be 3 for you
  console.log("Role:", activeProfile?.role);       // Should be admin for you
  console.log("-----------------------");

  // 4. Pass the CORRECT props to DashboardClient
  return (
    <DashboardClient 
      tier={activeProfile?.tier ?? 0} // Passing the numeric tier (0, 1, 2, or 3)
      expiryDate={activeProfile?.expiry_date}
      userProfile={activeProfile} // Passing the full object so DashboardClient has access to full_name, email, etc.
    />
  );
}
