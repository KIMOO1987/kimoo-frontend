import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetching EVERYTHING including tier and plan_type
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <ProfileClient 
      initialData={profile} 
      tier={profile?.tier ?? 0}
      expiryDate={profile?.expiry_date}
    />
  );
}

