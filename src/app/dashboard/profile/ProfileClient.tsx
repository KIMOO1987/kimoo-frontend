"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, MapPin, Globe, ShieldCheck, 
  RefreshCcw, Save, CheckCircle2, AlertCircle, Star, Clock, Lock 
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

export default function ProfileClient({ initialData, tier, expiryDate }: any) {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: initialData?.full_name || '',
    email: initialData?.email || '',
    country: initialData?.country || '',
    address: initialData?.address || ''
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Days calculation logic
  const daysLeft = expiryDate 
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        country: formData.country,
        address: formData.address,
      })
      .eq('id', user.id);

    if (error) {
      setMessage({ type: 'error', text: 'Failed to update profile identity.' });
    } else {
      setMessage({ type: 'success', text: 'Profile identity synchronized successfully.' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'All security fields are required.' });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    setMessage(null);

    try {
      // 1. Verify old password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: initialData.email,
        password: passwordData.oldPassword,
      });

      if (signInError) throw new Error('Verification failed: Incorrect old password.');

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      setMessage({ type: 'success', text: 'Security credentials rotated successfully.' });
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6 md:space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter italic text-white uppercase leading-none">Account <span className="text-blue-500">Identity</span></h2>
          <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em] mt-2">Personal Management & Billing Details</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
          <ShieldCheck size={12} className="text-blue-500" />
          <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Verified Profile</span>
        </div>
      </div>

      {/* NEW: PLAN STATUS ROW (Synced with Dashboard) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="crt-card p-5 md:p-6 border-white/5 bg-white/[0.02] flex items-center gap-4">
          <Star className="text-yellow-500" size={24} />
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Current Plan</span>
            <span className="text-xl font-black italic uppercase text-white">
               {initialData?.plan_type || (tier === 3 ? 'ULTIMATE' : tier === 2 ? 'PRO' : 'ALPHA')}
            </span>
          </div>
        </div>
        <div className="crt-card p-5 md:p-6 border-white/5 bg-white/[0.02] flex items-center gap-4">
          <Clock className="text-indigo-500" size={24} />
          <div>
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Validity Status</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-xl font-black italic uppercase ${tier > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {tier > 0 ? 'ACTIVE' : 'EXPIRED'}
              </span>
              {tier > 0 && <span className="text-zinc-600 font-bold text-[10px]">({daysLeft} DAYS)</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="crt-card p-5 md:p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <User size={14} className="text-blue-500" /> Personal Information
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Full Name</label>
                <div className="relative">
                  <input className="crt-input w-full pl-10" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} />
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Registered Email</label>
                <div className="relative opacity-60">
                  <input className="crt-input w-full pl-10 cursor-not-allowed bg-white/5" value={formData.email} readOnly />
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Country</label>
                  <div className="relative">
                    <input className="crt-input w-full pl-10" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} />
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Billing Address</label>
                  <div className="relative">
                    <input className="crt-input w-full pl-10" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                  </div>
                </div>
              </div>

              {message && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl flex items-center gap-3 border ${message.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                  {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span className="text-[10px] font-black uppercase tracking-widest">{message.text}</span>
                </motion.div>
              )}

              <button onClick={handleUpdateProfile} disabled={loading} className="w-full mt-4 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3">
                {loading ? <RefreshCcw size={14} className="animate-spin" /> : <Save size={14} />}
                {loading ? 'Processing Sync...' : 'Save Identity Changes'}
              </button>
            </div>
          </div>

          <div className="crt-card p-6 border-blue-500/20 bg-blue-500/[0.02]">
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-4">Security Notice</h4>
            <p className="text-[11px] leading-relaxed text-zinc-400 font-medium italic">
              Identity details are verified for billing and localization.
            </p>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          {/* Password Change Section */}
          <div className="crt-card p-5 md:p-8 border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
            <h3 className="text-[11px] font-black text-white uppercase tracking-widest mb-8 flex items-center gap-2">
              <Lock size={14} className="text-red-500" /> Security Credentials
            </h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Old Password</label>
                <div className="relative">
                  <input type="password" placeholder="••••••••" className="crt-input w-full pl-10" value={passwordData.oldPassword} onChange={(e) => setPasswordData({...passwordData, oldPassword: e.target.value})} />
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">New Password</label>
                <div className="relative">
                  <input type="password" placeholder="••••••••" className="crt-input w-full pl-10" value={passwordData.newPassword} onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} />
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-500 uppercase ml-1">Re-enter Password</label>
                <div className="relative">
                  <input type="password" placeholder="••••••••" className="crt-input w-full pl-10" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} />
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" />
                </div>
              </div>
            </div>

            <button onClick={handlePasswordChange} disabled={passwordLoading} className="w-full mt-8 py-4 bg-zinc-800 hover:bg-red-900/20 border border-white/5 hover:border-red-500/50 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl transition-all flex items-center justify-center gap-3 group">
              {passwordLoading ? <RefreshCcw size={14} className="animate-spin" /> : <Lock size={14} className="group-hover:text-red-500" />}
              {passwordLoading ? 'Rotating Keys...' : 'Update Credentials'}
            </button>
          </div>

          <div className="crt-card p-6 border-white/5 bg-white/[0.01]">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mb-4">Account Metadata</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">Status</span>
                <span className="text-[9px] font-black text-green-500 uppercase">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">Role</span>
                <span className="text-[9px] font-black text-white uppercase italic">{initialData?.role || 'User'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
