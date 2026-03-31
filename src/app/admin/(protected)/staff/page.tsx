"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserPlus, Shield, Trash2, Mail, Copy, Check, Loader2 } from 'lucide-react';

export default function StaffManager() {
  const [staff, setStaff] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, role')
      .in('role', ['admin', 'moderator']);
    if (data) setStaff(data);
    setLoading(false);
  }

  async function generateInvite() {
    if (!inviteEmail) return;
    const token = Math.random().toString(36).substring(2, 15);
    
    const { error } = await supabase.from('staff_invites').insert({
      email: inviteEmail.toLowerCase(),
      token: token,
      role: 'moderator'
    });

    if (error) alert("Invite already exists for this email.");
    else {
      const inviteUrl = `${window.location.origin}/admin/setup?token=${token}`;
      navigator.clipboard.writeText(inviteUrl);
      alert(`Invite link copied to clipboard for ${inviteEmail}`);
      setInviteEmail('');
    }
  }

  async function removeStaff(id: string) {
    if (!confirm("Remove this person from staff? They will lose all access.")) return;
    const { error } = await supabase.from('profiles').update({ role: 'user' }).eq('id', id);
    if (!error) fetchStaff();
  }

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-12 bg-[#05070a] min-h-screen text-white">
      <h1 className="text-3xl font-black italic uppercase mb-8">Staff <span className="text-blue-500">Access</span></h1>

      {/* Invite Section */}
      <div className="bg-white/5 border border-white/10 p-8 rounded-[32px] mb-12 max-w-2xl">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
          <UserPlus size={14} /> Invite New Moderator
        </h3>
        <div className="flex gap-4">
          <input 
            type="email" 
            placeholder="moderator@email.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
          <button onClick={generateInvite} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
            Generate Link
          </button>
        </div>
      </div>

      {/* Staff List */}
      <div className="grid gap-4 max-w-4xl">
        {staff.map((member) => (
          <div key={member.id} className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${member.role === 'admin' ? 'bg-blue-500/10 text-blue-500' : 'bg-zinc-800 text-zinc-400'}`}>
                <Shield size={20} />
              </div>
              <div>
                <p className="text-sm font-bold">{member.email}</p>
                <p className="text-[10px] uppercase font-black tracking-widest text-zinc-600">{member.role}</p>
              </div>
            </div>
            
            {member.role !== 'admin' && (
              <button onClick={() => removeStaff(member.id)} className="p-3 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}