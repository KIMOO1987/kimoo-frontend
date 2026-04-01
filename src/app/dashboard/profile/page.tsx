"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  ShieldCheck, 
  RefreshCcw, 
  Save,
  CheckCircle2,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true); // Start as true to prevent empty flashes
  const [updateLoading, setUpdateLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    age: '',
    country: '',
    address: ''
  });

  // Wrapped in useCallback to prevent unnecessary re-renders
  const fetchProfile = useCallback(async () => {
    try {
      // 1. Get the authenticated user session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.error("Auth error:", authError);
        setLoading(false);
        return;
      }

      // 2. Fetch the actual profile row
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, email, age, country, address')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.warn("Profile fetch error (might not exist yet):", profileError);
      }

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user.email || '', // Fallback to auth email if profile email is null
          age: data.age?.toString() || '',
          country: data.country || '',
          address: data.address || ''
        });
      }
    } catch (err) {
      console.error("Unexpected profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleUpdateProfile = async () => {
    setUpdateLoading(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        age: parseInt(formData.age) || null,
        country: formData.country,
        address: formData.address,
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Identity sync failed. Check database connection.' });
    } else {
      setMessage({ type: 'success', text: 'Identity synchronized successfully.' });
      setTimeout(() => setMessage(null), 3000);
    }
    setUpdateLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#05070a]">
        <RefreshCcw className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Retrieving Secure Identity...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* ... (Header logic remains the same) ... */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic text-white uppercase leading-none">Account <span className="text-blue-500">Identity</span></h2>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">Personal Management & Billing Details</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <ShieldCheck size={12} className="text-blue-500" />
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Verified Profile</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="crt-card p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <User size={14} className="text-blue-500" /> Personal Information
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Full Name</label>
                  <div className="relative">
                    <input 
                      className="crt-input w-full pl-10" 
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Age</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="crt-input w-full pl-10" 
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Registered Email</label>
                <div className="relative opacity-60">
                  <input className="crt-input w-full pl-10 bg-white/5" value={formData.email} readOnly />
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Country</label>
                  <div className="relative">
                    <input 
                      className="crt-input w-full pl-10" 
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                    />
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Billing Address</label>
                  <div className="relative">
                    <input 
                      className="crt-input w-full pl-10" 
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>
              </div>

              {message && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`p-4 rounded-xl border ${message.type === 'success' ? 'text-green-500 border-green-500/20' : 'text-red-500 border-red-500/20'}`}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                </motion.div>
              )}

              <button 
                onClick={handleUpdateProfile}
                disabled={updateLoading}
                className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3"
              >
                {updateLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                {updateLoading ? 'Synchronizing...' : 'Save Identity Changes'}
              </button>
            </div>
          </div>
        </div>
        {/* ... (Sidebar remains same) ... */}
      </div>
    </div>
  );
}
