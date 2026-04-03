"use client";
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, User, Calendar, TrendingUp, Loader2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createAdminUser } from '@/app/admin/(protected)/users/actions';
export default function NewUserPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>({
    full_name: '',
    email: '',
    password: '',
    role: 'user',
    tier: 0,
    is_pro: false,
    plan_type: 'free',
    subscription_type: 'free',
    subscription_status: 'free',
    expiry_date: null,
    account_size: '0',
    risk_value: '1.0',
    reward_value: '2.0',
    country: '',
    address: '',
    age: 0,
  });
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!user.email || !user.password) {
      alert("Email and Password are required to create an Authentication record.");
      return;
    }

    setSaving(true);
    
    // 1. Call the Server Action to create the Auth record
    const { user: authUser, error: authError } = await createAdminUser(user);

    if (authError || !authUser) {
      alert(`Authentication Error: ${authError}`);
      setSaving(false);
      return;
    }

    // 2. Use the ID from the newly created Auth user for the profile
    const { password: _, ...profileData } = user;
    const insertData = {
      ...profileData,
      id: authUser.id, 
      tier: Number(user.tier),
      is_pro: user.is_pro === true || user.is_pro === 'true',
      age: Number(user.age) || 0,
      account_size: user.account_size?.toString() || '0',
      risk_value: user.risk_value?.toString() || '1.0',
      reward_value: user.reward_value?.toString() || '2.0',
      expiry_date: user.expiry_date || null,
    };
    
    // Use upsert instead of insert to handle cases where a database trigger 
    // might have already created the profile row upon auth user creation.
    const { data, error } = await supabase.from('profiles').upsert(insertData).select();
    
    if (error) {
      alert(`Creation Error: ${error.message}`);
    } else if (!data || data.length === 0) {
      alert("Creation Failed: No record was created.");
    } else {
      alert("New member profile created successfully.");
      // Redirect to the newly created user's edit page
      router.push(`/admin/users/${data[0].id}`);
    }
    setSaving(false);
  };

  return (
    <div className="p-4 md:p-12 bg-[#05070a] min-h-screen text-white">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => router.push('/admin/users')} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-all mb-8 uppercase font-black text-[10px] tracking-widest">
          <ArrowLeft size={14} /> Back to Users
        </button>

        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Add <span className="text-blue-500">New Member</span></h1>
          </div>
          <button 
            onClick={handleCreate} 
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-blue-900/20"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Create Member
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Identity Block */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><User size={14}/> Core Identity</h3>
            <div className="space-y-4">
              <InputField label="Full Name" value={user.full_name} onChange={(v: string) => setUser({...user, full_name: v})} />
              <InputField label="Email Address" value={user.email} onChange={(v: string) => setUser({...user, email: v})} />
              <InputField label="Initial Password" type="password" value={user.password} onChange={(v: string) => setUser({...user, password: v})} />
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
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Country" value={user.country} onChange={(v: string) => setUser({...user, country: v})} />
                <InputField label="Age" type="number" value={user.age} onChange={(v: string) => setUser({...user, age: v})} />
              </div>
              <InputField label="Address" value={user.address} onChange={(v: string) => setUser({...user, address: v})} />
            </div>
          </div>

          {/* Subscription Block */}
          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Calendar size={14}/> Subscription Meta</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <SelectField 
                  label="Plan Display Text" 
                  value={user.subscription_status || 'free'} 
                  options={['free', 'active']} 
                  onChange={(v: string) => setUser({...user, subscription_status: v})} 
                />
                <InputField label="Expiry Date" value={user.expiry_date?.split('T')[0] || ''} type="date" onChange={(v: string) => setUser({...user, expiry_date: v})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <SelectField 
                  label="Plan Type" 
                  value={user.plan_type || 'free'} 
                  options={['free', 'alpha', 'pro', 'ultimate']} 
                  onChange={(v: string) => setUser({...user, plan_type: v})} 
                />
                <SelectField 
                  label="Subscription Type" 
                  value={user.subscription_type || 'free'} 
                  options={['free', 'alpha', 'pro', 'ultimate']} 
                  onChange={(v: string) => setUser({...user, subscription_type: v})} 
                />
              </div>

              <SelectField 
                label="Is Pro Flag" 
                value={user.is_pro?.toString()} 
                options={['true', 'false']} 
                onChange={(v: string) => setUser({...user, is_pro: v === 'true'})} 
              />
            </div>
          </div>

          {/* Trading Parameters */}
          <div className="md:col-span-2 bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 mb-6"><TrendingUp size={14}/> Trading Parameters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <InputField label="Account Size ($)" value={user.account_size} type="number" onChange={(v: string) => setUser({...user, account_size: v})} />
              <InputField label="Risk Value (R)" value={user.risk_value} type="number" step="0.1" onChange={(v: string) => setUser({...user, risk_value: v})} />
              <InputField label="Reward Value (R)" value={user.reward_value} type="number" step="0.1" onChange={(v: string) => setUser({...user, reward_value: v})} />
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