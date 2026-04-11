"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, Loader2, Edit3, Activity } from 'lucide-react';

export default function PlanManager() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    const { data } = await supabase.from('plans').select('*').order('price', { ascending: true });
    if (data) setPlans(data);
    setLoading(false);
  }

  async function updatePlan(id: string, updates: any) {
    setSaving(id);
    const { error } = await supabase.from('plans').update(updates).eq('id', id);
    if (!error) alert("Plan Updated Successfully!");
    setSaving(null);
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#030407]">
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Activity size={40} className="text-zinc-700 mb-4 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Loading Configuration...</p>
      </div>
    </div>
  );

  return (
    <div className="relative p-4 md:p-12 lg:p-16 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
      
      {/* Ambient Glowing Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>
      
      <div className="max-w-[1700px] mx-auto relative z-10 space-y-6 md:space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 md:mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase text-white">
              Plan<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Editor</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3 leading-none">
              • SUBSCRIPTION TIERS & PRICING CONTROL •
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 md:gap-8 max-w-5xl">
          {plans.map((plan) => (
            <div key={plan.id} className="relative overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-6 md:p-8 rounded-[2.5rem] hover:border-white/[0.1] hover:bg-white/[0.06] transition-all duration-300 group shadow-2xl flex flex-col gap-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.05] pb-6">
                 <h2 className="text-2xl font-black italic tracking-tighter uppercase drop-shadow-md flex items-center gap-3">
                   <Edit3 className="text-blue-400" size={20} /> {plan.name}
                 </h2>
                 <button 
                  onClick={() => updatePlan(plan.id, plan)}
                  disabled={saving === plan.id}
                  className={`w-full md:w-auto px-8 py-3.5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 ${
                    saving === plan.id 
                      ? 'bg-white/[0.05] border border-white/5 text-zinc-500 cursor-not-allowed shadow-none' 
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] border border-blue-500/30'
                  }`}
                 >
                   {saving === plan.id ? <Loader2 size={16} className="animate-spin text-blue-200" /> : <Save size={16} className="text-blue-200" />} 
                   {saving === plan.id ? 'Saving...' : 'Save Changes'}
                 </button>
              </div>

              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest block">Price (USDT)</label>
                  <input 
                    type="number" 
                    value={plan.price} 
                    onChange={(e) => {
                      const newPlans = [...plans];
                      newPlans.find(p => p.id === plan.id).price = Number(e.target.value);
                      setPlans(newPlans);
                    }}
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest block">Duration Text</label>
                  <input 
                    type="text" 
                    value={plan.duration_text} 
                    onChange={(e) => {
                      const newPlans = [...plans];
                      newPlans.find(p => p.id === plan.id).duration_text = e.target.value;
                      setPlans(newPlans);
                    }}
                    className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all"
                  />
                </div>
              </div>

              <div className="relative z-10 space-y-2">
                <label className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-widest block">Features (Comma Separated)</label>
                <textarea 
                  value={plan.features.join(', ')} 
                  onChange={(e) => {
                    const newPlans = [...plans];
                    newPlans.find(p => p.id === plan.id).features = e.target.value.split(',').map((f: string) => f.trim());
                    setPlans(newPlans);
                  }}
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-3.5 text-xs font-mono font-bold text-white outline-none focus:border-blue-500/50 hover:border-white/20 transition-all h-28 resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
