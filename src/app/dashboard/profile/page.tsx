"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, MapPin, Globe, ShieldCheck, RefreshCcw, Save, CheckCircle2, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    age: '',
    country: '',
    address: ''
  });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      
      // 1. Get User Session First
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("No authenticated user found");

      // 2. Try to get data from 'profiles' table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // 3. Logic: If profile table is empty, use auth metadata as fallback
      // This solves the "Signup but not yet in Profile" lag.
      const meta = user.user_metadata || {};
      
      setFormData({
        full_name: profileData?.full_name || meta.full_name || '',
        email: profileData?.email || user.email || '',
        age: (profileData?.age || meta.age || '').toString(),
        country: profileData?.country || meta.country || '',
        address: profileData?.address || meta.address || ''
      });

    } catch (err) {
      console.error("Profile Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async () => {
    setUpdateLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .upsert({ // Using UPSERT instead of update is safer
        id: user.id,
        full_name: formData.full_name,
        age: parseInt(formData.age) || null,
        country: formData.country,
        address: formData.address,
        email: user.email,
        updated_at: new Date()
      });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Identity synchronized!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setUpdateLoading(false);
  };

  if (loading) return (
    <div className="h-96 flex items-center justify-center">
      <RefreshCcw className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* ... (UI code same as previous) ... */}
      <div className="crt-card p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Full Name</label>
                <input className="crt-input w-full pl-4" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Age</label>
                <input type="number" className="crt-input w-full pl-4" value={formData.age} onChange={(e) => setFormData({...formData, age: e.target.value})} />
             </div>
          </div>
          {/* ... Add Email, Country, Address fields similar to above ... */}
          <button onClick={handleUpdateProfile} className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-xl">
             {updateLoading ? 'Saving...' : 'Save Identity Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
