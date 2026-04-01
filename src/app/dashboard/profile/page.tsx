"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  // 1. Core function to fetch data from Supabase
  const loadProfileData = useCallback(async (user: any) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email, age, country, address')
        .eq('id', user.id)
        .single();

      if (data) {
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          age: data.age?.toString() || '',
          country: data.country || '',
          address: data.address || ''
        });
      } else {
        // Fallback: If profile row doesn't exist, use Auth Metadata from Signup
        setFormData(prev => ({
          ...prev,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          age: user.user_metadata?.age || '',
          country: user.user_metadata?.country || '',
          address: user.user_metadata?.address || ''
        }));
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Initialize Auth and Listen for session changes
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfileData(session.user);
      } else {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfileData(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadProfileData]);

  // 3. Handle Profile Update
  const handleUpdateProfile = async () => {
    setUpdateLoading(true);
    setMessage(null);

    // Get fresh session to prevent "Session Expired" errors
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      setMessage({ type: 'error', text: 'Session expired. Please refresh or log in again.' });
      setUpdateLoading(false);
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: session.user.id,
        full_name: formData.full_name,
        age: parseInt(formData.age) || null,
        country: formData.country,
        address: formData.address,
        email: formData.email,
        updated_at: new Date().toISOString()
      });

    if (error) {
      setMessage({ type: 'error', text: `Sync failed: ${error.message}` });
    } else {
      setMessage({ type: 'success', text: 'Identity synchronized successfully.' });
      setTimeout(() => setMessage(null), 3000);
    }
    setUpdateLoading(false);
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center bg-transparent">
        <RefreshCcw className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Syncing Secure Identity...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic text-white uppercase leading-none">
            Account <span className="text-blue-500">Identity</span>
          </h2>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">
            Personal Management & Billing Details
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <ShieldCheck size={12} className="text-blue-500" />
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Verified Profile</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-7 space-y-6">
          <div className="crt-card p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <User size={14} className="text-blue-500" /> Personal Information
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Full Name</label>
                  <div className="relative">
                    <input 
                      className="crt-input w-full pl-10" 
                      placeholder="e.g. John Doe"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    />
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Age</label>
                  <div className="relative">
                    <input 
                      type="number"
                      className="crt-input w-full pl-10" 
                      placeholder="25"
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                    />
                    <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>
              </div>

              {/* Email (Read-only for security) */}
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Registered Email</label>
                <div className="relative opacity-60">
                  <input 
                    className="crt-input w-full pl-10 bg-white/5 cursor-not-allowed" 
                    value={formData.email} 
                    readOnly 
                  />
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Country */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Country</label>
                  <div className="relative">
                    <input 
                      className="crt-input w-full pl-10" 
                      placeholder="e.g. United Kingdom"
                      value={formData.country}
                      onChange={(e) => setFormData({...formData, country: e.target.value})}
                    />
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Billing Address</label>
                  <div className="relative">
                    <input 
                      className="crt-input w-full pl-10" 
                      placeholder="Street, City, Zip"
                      value={formData.address}
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>
              </div>

              {/* Status Message */}
              <AnimatePresence>
                {message && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }}
                    className={`p-4 rounded-xl border flex items-center gap-3 ${
                      message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
                    }`}
                  >
                    {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                onClick={handleUpdateProfile}
                disabled={updateLoading}
                className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20"
              >
                {updateLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                {updateLoading ? 'Processing Sync...' : 'Save Identity Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="crt-card p-6 border-blue-500/20 bg-blue-500/[0.02]">
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Security Notice</h4>
            <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
              Your identity details are used solely for billing and signal localization. KIMOO <span className="text-white italic">CRT</span> utilizes AES-256 node encryption for all personal metadata.
            </p>
          </div>

          <div className="crt-card p-6 border-white/5 bg-white/[0.01]">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Account Metadata</h4>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">System Status</span>
                <span className="text-[9px] font-black text-green-500 uppercase">Synchronized</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">Protection</span>
                <span className="text-[9px] font-black text-white uppercase">Encrypted</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
