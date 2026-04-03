"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { adminForceResetPassword } from '@/app/login/actions';
import { Loader2, Mail, Lock, CheckCircle2, User } from 'lucide-react';

export default function PasswordResets() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data, error } = await supabase.from('password_reset_requests').select('*').eq('status', 'pending');
      if (error) {
        console.error("Error fetching password reset requests:", error);
        // Optionally, display an error message to the user
      } else if (data) {
        setRequests(data);
      }
      setLoading(false);
    };
    fetchRequests();
  }, []);

  const handleManualReset = async (requestId: string, userId: string, email: string) => {
    const newPass = prompt(`Enter new temporary password for ${email}:`);
    if (!newPass || newPass.length < 6) return alert("Password too short.");

    try {
      await adminForceResetPassword(userId, newPass);
      await supabase.from('password_reset_requests').update({ status: 'completed' }).eq('id', requestId);
      setRequests(requests.filter(r => r.id !== requestId));
      alert("Identity Access Keys rotated successfully.");
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-4 md:p-12 bg-[#05070a] min-h-screen text-white">
      <div className="mb-12">
        <h1 className="text-3xl font-black italic uppercase tracking-tighter">Access <span className="text-red-500">Recovery</span></h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-2">Manual Password Intervention Queue</p>
      </div>

      <div className="grid gap-4 max-w-4xl">
        {requests.length === 0 ? (
          <div className="py-24 border border-dashed border-white/5 rounded-[40px] text-center">
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em]">No pending recovery tickets</p>
          </div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 group">
              <div className="flex items-center gap-5 flex-1">
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
                  <Lock size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold">{req.full_name}</p>
                    <span className="text-[8px] font-black text-zinc-500 bg-white/5 px-2 py-0.5 rounded border border-white/10 uppercase">Pending Verification</span>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-1">{req.email}</p>
                </div>
              </div>
              <button 
                onClick={() => handleManualReset(req.id, req.user_id, req.email)}
                className="w-full md:w-auto bg-white text-black hover:bg-red-500 hover:text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                Force Rotate Access Key
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}