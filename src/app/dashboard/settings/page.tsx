"use client";

import { useState } from 'react';
import { ShieldCheck, Server, Lock, User, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    accountId: '',
    password: '',
    server: '',
    platform: 'MT5' // Default
  });

  const handleConnect = async () => {
    setLoading(true);
    // Logic to send these details to your backend to "Deploy" the cloud instance
    console.log("Connecting Broker:", config);
    
    // Simulate API Delay
    setTimeout(() => {
      setLoading(false);
      alert("Broker Successfully Linked to KIMOO Cloud");
    }, 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-black tracking-tighter">Terminal Bridge</h1>
        <p className="text-zinc-500 text-xs uppercase tracking-[0.3em] mt-2">Connect your MT4/MT5 to the CRT Engine</p>
      </header>

      <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Account ID */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 ml-1">
              <User size={14} /> MT4/5 Account ID
            </label>
            <input 
              type="text" 
              placeholder="e.g. 7781290"
              value={config.accountId}
              onChange={(e) => setConfig({...config, accountId: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none transition-all font-mono"
            />
          </div>

          {/* Server */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 ml-1">
              <Server size={14} /> Broker Server
            </label>
            <input 
              type="text" 
              placeholder="e.g. IC Markets-SC"
              value={config.server}
              onChange={(e) => setConfig({...config, server: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none transition-all font-mono"
            />
          </div>

          {/* Password */}
          <div className="space-y-3 md:col-span-2">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-zinc-500 ml-1">
              <Lock size={14} /> Master/Investor Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••••••"
              value={config.password}
              onChange={(e) => setConfig({...config, password: e.target.value})}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-blue-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Platform Selector */}
        <div className="flex gap-4 mt-8">
          {['MT4', 'MT5'].map((p) => (
            <button 
              key={p}
              onClick={() => setConfig({...config, platform: p})}
              className={`flex-1 py-4 rounded-2xl border font-black text-xs transition-all ${config.platform === p ? 'bg-blue-600 border-blue-500 text-white' : 'border-white/5 text-zinc-600'}`}
            >
              {p} TERMINAL
            </button>
          ))}
        </div>

        <button 
          onClick={handleConnect}
          disabled={loading}
          className="w-full mt-10 bg-white text-black hover:bg-blue-600 hover:text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl"
        >
          {loading ? <RefreshCw className="animate-spin" size={18} /> : <ShieldCheck size={18} />}
          {loading ? 'Deploying Cloud Bridge...' : 'Connect Institutional Account'}
        </button>
      </div>

      <p className="text-center text-[9px] text-zinc-700 mt-8 uppercase tracking-widest leading-loose">
        By connecting, you authorize KIMOO CRT to execute trades based on your risk rules. <br/>
        Credentials are encrypted using AES-256 standard.
      </p>
    </div>
  );
}