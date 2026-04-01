"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { 
  Lock, 
  Mail, 
  Loader2, 
  UserPlus, 
  ArrowLeft, 
  ShieldCheck, 
  User, 
  Globe, 
  MapPin, 
  Calendar 
} from 'lucide-react';
import Link from 'next/link';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    country: '',
    address: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // 1. Validation: Password Match
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      setLoading(false);
      return;
    }

    // 2. Supabase Auth Sign Up with Metadata
    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        // These fields will be saved to auth.users.raw_user_meta_data
        // and can be synced to your 'profiles' table via a Supabase Trigger
        data: {
          full_name: formData.fullName,
          age: formData.age,
          country: formData.country,
          address: formData.address,
        },
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
      setLoading(false);
    } else {
      setMessage({ 
        type: 'success', 
        text: 'Identity Initialized. Please check your email to verify your clearance.' 
      });
      setTimeout(() => router.push('/login'), 5000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a] py-12 px-6">
      <div className="crt-card w-full max-w-xl p-10 relative overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/5 blur-[100px] pointer-events-none" />
        
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
            <UserPlus size={10} className="text-blue-500" />
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">New Operator Registration</span>
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-white">
            KIMOO CRT<span className="text-blue-500">(+Pro)</span>
          </h1>
        </div>

        <form onSubmit={handleSignUp} className="space-y-5">
          {message && (
            <div className={`p-3 rounded-xl border text-[10px] font-bold uppercase tracking-tight ${
              message.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-green-500/10 border-green-500/20 text-green-500'
            }`}>
              {message.text}
            </div>
          )}

          {/* Identity Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input name="fullName" type="text" required value={formData.fullName} onChange={handleChange} placeholder="John Doe" className="crt-input w-full pl-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Age</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input name="age" type="number" required value={formData.age} onChange={handleChange} placeholder="25" className="crt-input w-full pl-12" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Country</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input name="country" type="text" required value={formData.country} onChange={handleChange} placeholder="United Kingdom" className="crt-input w-full pl-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Billing Address</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input name="address" type="text" required value={formData.address} onChange={handleChange} placeholder="Street, City, Zip" className="crt-input w-full pl-12" />
              </div>
            </div>
          </div>

          {/* Authentication Block */}
          <div className="space-y-2 pt-2">
            <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
              <input name="email" type="email" required value={formData.email} onChange={handleChange} placeholder="name@company.com" className="crt-input w-full pl-12" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input name="password" type="password" required value={formData.password} onChange={handleChange} placeholder="••••••••" className="crt-input w-full pl-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-zinc-500 ml-1 tracking-widest">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="crt-input w-full pl-12" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="crt-btn-primary w-full flex items-center justify-center gap-2 py-4 mt-6 relative group overflow-hidden">
            {loading ? <Loader2 className="animate-spin" size={16} /> : (
              <>
                <span className="relative z-10 font-black uppercase text-xs tracking-widest">Initialize Account</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
              </>
            )}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-6">
          <Link href="/login" className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-all">
            <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest font-mono">Back to Authentication</span>
          </Link>
          <div className="flex items-center gap-2 opacity-30">
            <ShieldCheck size={12} className="text-zinc-500" />
            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-zinc-500">Security Protocol v4.0 Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
