"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Save, Loader2, Edit3, Plus, Trash2 } from 'lucide-react';

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

  if (loading) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="p-12 bg-[#05070a] min-h-screen text-white">
      <h1 className="text-3xl font-black italic uppercase mb-8">Plan <span className="text-blue-500">Editor</span></h1>
      
      <div className="grid gap-6 max-w-4xl">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white/5 border border-white/10 p-8 rounded-[32px] space-y-4">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-bold">{plan.name}</h2>
               <button 
                onClick={() => updatePlan(plan.id, plan)}
                disabled={saving === plan.id}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2"
               >
                 {saving === plan.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Changes
               </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Price (USDT)</label>
                <input 
                  type="number" 
                  value={plan.price} 
                  onChange={(e) => {
                    const newPlans = [...plans];
                    newPlans.find(p => p.id === plan.id).price = Number(e.target.value);
                    setPlans(newPlans);
                  }}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Duration Text</label>
                <input 
                  type="text" 
                  value={plan.duration_text} 
                  onChange={(e) => {
                    const newPlans = [...plans];
                    newPlans.find(p => p.id === plan.id).duration_text = e.target.value;
                    setPlans(newPlans);
                  }}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase block mb-1">Features (Comma Separated)</label>
              <textarea 
                value={plan.features.join(', ')} 
                onChange={(e) => {
                  const newPlans = [...plans];
                  newPlans.find(p => p.id === plan.id).features = e.target.value.split(',').map(f => f.trim());
                  setPlans(newPlans);
                }}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-sm h-24"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}