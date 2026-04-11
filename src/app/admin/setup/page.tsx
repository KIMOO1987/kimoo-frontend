"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { useOptimisticAuth } from '@/hooks/useOptimisticAuth';

export default function SomeOtherPage() {
  // Just drop this one line in!
  const { user, loading } = useOptimisticAuth('some_page_auth_cache');

  if (loading) return <div>Loading...</div>; // Will be skipped if cached!

  return <div>Welcome back, {user?.id}</div>;
}

function SetupContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your invitation...');

  useEffect(() => {
    async function activateModerator() {
      if (!token) {
        setStatus('error');
        setMessage('Invalid or missing invitation token.');
        return;
      }

      // 1. Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('error');
        setMessage('Please login to your account first to accept the invitation.');
        return;
      }

      // 2. Validate token and email match in the database
      const { data: invite, error: inviteError } = await supabase
        .from('staff_invites')
        .select('*')
        .eq('token', token)
        .eq('email', user.email?.toLowerCase())
        .eq('is_used', false)
        .single();

      if (inviteError || !invite) {
        setStatus('error');
        setMessage('Invitation not found, already used, or email mismatch.');
        return;
      }

      // 3. Check for expiration
      if (new Date(invite.expires_at) < new Date()) {
        setStatus('error');
        setMessage('This invitation has expired.');
        return;
      }

      // 4. Update Profile Role & Mark Token as used
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: invite.role })
        .eq('id', user.id);

      if (profileError) {
        setStatus('error');
        setMessage('Failed to update account permissions.');
        return;
      }

      await supabase
        .from('staff_invites')
        .update({ is_used: true })
        .eq('id', invite.id);

      setStatus('success');
      setMessage(`Success! You are now registered as a ${invite.role}.`);
    }

    activateModerator();
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center p-6 text-white font-sans">
      <div className="w-full max-w-md bg-white/[0.02] border border-white/5 p-10 rounded-[40px] text-center shadow-2xl">
        
        {status === 'verifying' && (
          <div className="space-y-6">
            <Loader2 className="animate-spin mx-auto text-blue-500" size={40} />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-red-500/10 p-4 rounded-full w-fit mx-auto border border-red-500/20">
              <AlertCircle className="text-red-500" size={32} />
            </div>
            <h2 className="text-xl font-black italic uppercase italic">Access <span className="text-red-500">Denied</span></h2>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed px-4">{message}</p>
            <button 
              onClick={() => router.push('/login')}
              className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Back to Login
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="bg-green-500/10 p-4 rounded-full w-fit mx-auto border border-green-500/20">
              <ShieldCheck className="text-green-500" size={32} />
            </div>
            <h2 className="text-xl font-black italic uppercase">Access <span className="text-green-500">Granted</span></h2>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed px-4">{message}</p>
            <button 
              onClick={() => window.location.href = '/admin/plans'}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              Enter Console <ArrowRight size={14} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// Wrap in Suspense because of useSearchParams
export default function SetupPage() {
  return (
    <Suspense fallback={<div className="h-screen bg-black" />}>
      <SetupContent />
    </Suspense>
  );
}
