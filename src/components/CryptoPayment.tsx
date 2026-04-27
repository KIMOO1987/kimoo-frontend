"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Copy, Check, ShieldCheck, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

const WALLETS = [
  { network: 'USDT (ERC20)', address: '0xYourErc20WalletAddressHere' },
  { network: 'USDT (TRC20)', address: 'TYourTrc20WalletAddressHere' },
];

export default function CryptoPayment({ userId }: { userId: string }) {
  const [hash, setHash] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const copyToClipboard = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSubmit = async () => {
    if (!hash) return;
    setStatus('submitting');
    
    const { error } = await supabase
      .from('profiles')
      .update({ 
        pending_crypto_hash: hash,
        last_payment_method: 'CRYPTO'
      })
      .eq('id', userId);

    if (!error) setStatus('success');
  };

  return (
    <div className="bg-[#080808] border border-white/5 rounded-[2rem] p-8 space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-orange-500/10 rounded-lg">
          <Cpu size={20} className="text-orange-500" />
        </div>
        <div>
          <h3 className="text-zinc-900 dark:text-white font-black italic uppercase tracking-tighter">Crypto Settlement</h3>
          <p className="text-[10px] text-zinc-600 dark:text-zinc-500 font-bold uppercase tracking-widest">Manual Verification Protocol</p>
        </div>
      </div>

      <div className="grid gap-4">
        {WALLETS.map((w) => (
          <div key={w.network} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center group">
            <div>
              <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">{w.network}</p>
              <p className="text-[11px] font-mono text-zinc-900 dark:text-white truncate max-w-[180px] sm:max-w-none">{w.address}</p>
            </div>
            <button 
              onClick={() => copyToClipboard(w.address)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {copied === w.address ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-zinc-600" />}
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-2 px-1">Transaction Hash (TxID)</label>
          <input 
            type="text" 
            value={hash}
            onChange={(e) => setHash(e.target.value)}
            placeholder="Paste your transaction hash here..."
            className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-zinc-900 dark:text-white focus:border-orange-500/50 outline-none transition-all"
          />
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!hash || status !== 'idle'}
          className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all
            ${status === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white text-black hover:bg-orange-500 hover:text-white'}
          `}
        >
          {status === 'idle' && 'Submit for Validation'}
          {status === 'submitting' && 'Processing...'}
          {status === 'success' && 'Request Sent - Awaiting Admin'}
        </button>
      </div>

      <div className="flex items-center gap-2 px-2 opacity-50">
        <ShieldCheck size={12} className="text-zinc-600 dark:text-zinc-500" />
        <p className="text-[8px] text-zinc-600 dark:text-zinc-500 font-bold uppercase">Pro access granted within 1-12 hours of confirmation.</p>
      </div>
    </div>
  );
}