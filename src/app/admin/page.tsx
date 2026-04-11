import { redirect } from 'next/navigation';
import { useOptimisticAuth } from '@/hooks/useOptimisticAuth';

export default function AdminPage() {
  // Automatically send you to the payments validation sub-page
  redirect('/admin');
}

export default function SomeOtherPage() {
  // Just drop this one line in!
  const { user, loading } = useOptimisticAuth('some_page_auth_cache');

  if (loading) return <div>Loading...</div>; // Will be skipped if cached!

  return <div>Welcome back, {user?.id}</div>;
}
