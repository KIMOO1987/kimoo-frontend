"use client";
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, User, Mail, Shield, Calendar, Wallet, Percent, TrendingUp, Loader2, ArrowLeft, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UserDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
      if (data) setUser(data);
      setLoading(false);
    };
    fetchUser();
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update(user).eq('id', id);
    if (!error) alert("Operator profile synchronized with database.");
    setSaving(false);
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-black"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-4 md:p-12 bg-[#05070a] min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-8 uppercase font-black text-[10px] tracking-widest">
          <ArrowLeft size={14} /> Identity Registry
        </button>

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Edit <span className="text-blue-500">Operator</span></h1>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-2 italic">{user.id}</p>
          </div>
          <button 
            onClick={handleUpdate} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-900/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Sync Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Block */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><User size={14}/> Core Identity</h3>
            <div className="space-y-4">
              <InputField label="Full Name" value={user.full_name} onChange={(v: string) => setUser({...user, full_name: v})} />
              <InputField label="Email Address" value={user.email} onChange={(v: string) => setUser({...user, email: v})} />
              <div className="grid grid-cols-2 gap-4">
                <SelectField 
                  label="Access Role" 
                  value={user.role} 
                  options={['user', 'moderator', 'admin']} 
                  onChange={(v: string) => setUser({...user, role: v})} 
                />
                <SelectField 
                  label="Tier Level" 
                  value={user.tier} 
                  options={[0, 1, 2, 3]} 
                  onChange={(v: string) => setUser({...user, tier: Number(v)})} 
                />
              </div>
            </div>
          </div>

          {/* Subscription Block */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Calendar size={14}/> Subscription Meta</h3>
            <div className="space-y-4">
              <InputField label="Plan Display Text" value={user.subscription_status || 'free'} onChange={(v: string) => setUser({...user, subscription_status: v})} />
              <InputField label="Expiry Date (YYYY-MM-DD)" value={user.expiry_date?.split('T')[0] || ''} type="date" onChange={(v: string) => setUser({...user, expiry_date: v})} />
              <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[8px] font-black text-zinc-600 uppercase mb-2">Internal Status</p>
                <p className={`text-[10px] font-bold ${user.tier > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {user.tier > 0 ? 'LICENSED OPERATOR' : 'TRIAL ACCESS'}
                </p>
              </div>
            </div>
          </div>

          {/* Trading Parameters */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-6"><TrendingUp size={14}/> Trading Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InputField label="Account Size ($)" value={user.account_size} type="number" onChange={(v: string) => setUser({...user, account_size: Number(v)})} />
              <InputField label="Risk Value (R)" value={user.risk_value} type="number" step="0.1" onChange={(v: string) => setUser({...user, risk_value: Number(v)})} />
              <InputField label="Reward Value (R)" value={user.reward_value} type="number" step="0.1" onChange={(v: string) => setUser({...user, reward_value: Number(v)})} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", step }: any) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 mb-1 block">{label}</label>
      <input 
        type={type} 
        step={step}
        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 transition-all" 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }: any) {
  return (
    <div>
      <label className="text-[9px] font-black uppercase text-zinc-600 ml-1 mb-1 block">{label}</label>
      <select 
        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-500 appearance-none cursor-pointer" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o: any) => (
          <option key={o} value={o}>{o.toString().toUpperCase()}</option>
        ))}
      </select>
    </div>
  );
}