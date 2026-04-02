"use client";

import React from 'react';
import { Star, Clock, User, Shield } from 'lucide-react';

export default function ProfileClient({ userProfile, tier, expiryDate }: any) {
  
  const daysLeft = expiryDate 
    ? Math.max(0, Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) 
    : 0;

  return (
    <div className="p-4 md:p-10 space-y-6">
      {/* HEADER CARD */}
      <div className="bg-white/[0.02] border border-white/5 p-8 rounded-[2rem] backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <User size={40} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase text-white tracking-tighter">
              {userProfile?.full_name || 'TRADER'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-600 text-white uppercase italic">
                {userProfile?.role === 'admin' ? 'SYSTEM ADMIN' : 'CLIENT'}
              </span>
              <p className="text-zinc-600 font-mono text-xs italic">{userProfile?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* PLAN STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Star className="text-yellow-500" size={18} />
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Plan Type</span>
          </div>
          <p className="text-xl font-black italic text-white uppercase">
            {userProfile?.plan_type || (tier === 3 ? 'ULTIMATE' : 'BASIC')}
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="text-indigo-500" size={18} />
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Plan Validity</span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-black italic text-emerald-500 uppercase">ACTIVE</p>
            <span className="text-zinc-600 font-bold text-[10px]">({daysLeft} DAYS)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
