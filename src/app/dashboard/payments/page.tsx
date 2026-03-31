"use client";

import { useState, useEffect } from 'react';
import { Check, Zap, Crown, Star, CreditCard, Bitcoin, Loader2, Copy, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

/** * 1. UPDATED REDIRECTION MAPPING
 * Changed 'ultimate' to match your new naming convention.
 */
const WHOP_LINKS: Record<string, string> = {
  alpha: "https://whop.com/kimoo-crtbot/kimoo-crtbot-monthly",
  pro: "https://whop.com/kimoo-crtbot/kimoo-crtbot-6-months", 
  ultimate: "https://whop.com/kimoo-crtbot/kimoo-crtbot-yearly",
};

const WALLETS = [
  { network: 'USDT (ERC20)', address: '0x79adb2f07fc055e2c858d6edf25a37dce43de00a' },
  { network: 'USDT (TRC20)', address: 'TMfFLoNrLm21YDRcA3oej8ZdksSbNKg8Sb' },
  { network: 'USDT (BEP20)', address: '0x79adb2f07fc055e2c858d6edf25a37dce43de00a' },
];

export default function PaymentsPage() {
  const [plans, setPlans] = useState<any[]>([]); 
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'WHOP' | 'CRYPTO'>('WHOP');
  const [cryptoHash, setCryptoHash] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [cryptoStatus, setCryptoStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  // --- FETCH DYNAMIC PLANS FROM SUPABASE ---
  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      
      if (!error && data) setPlans(data);
      setPageLoading(false);
    };
    fetchPlans();
  }, []);

  const renderIcon = (type: string) => {
    switch (type) {
      case 'zap': return <Zap size={24} className="text-zinc-500" />;
      case 'crown': return <Crown size={24} className="text-amber-500" />;
      default: return <Star size={24} className="text-blue-500" />;
    }
  };

  const handleWhopPayment = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    const checkoutUrl = WHOP_LINKS[selectedPlan.id];
    if (checkoutUrl) {
      setTimeout(() => { window.location.href = checkoutUrl; }, 800);
    } else {
      setLoading(false);
    }
  };

  const handleCryptoSubmit = async () => {
    if (!cryptoHash || !selectedPlan) return;
    setCryptoStatus('submitting');
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          pending_crypto_hash: cryptoHash,
          last_payment_method: 'CRYPTO',
          pending_plan_id: selectedPlan.id 
        })
        .eq('id', user.id);

      if (!error) {
        setCryptoStatus('success');
        setTimeout(() => {
          setSelectedPlan(null);
          setCryptoStatus('idle');
          setCryptoHash('');
        }, 3000);
      } else {
        alert("Error saving transaction: " + error.message);
        setCryptoStatus('idle');
      }
    } else {
      alert("Please login to submit payment.");
      setCryptoStatus('idle');
    }
  };

  const copyToClipboard = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopied(addr);
    setTimeout(() => setCopied(null), 2000);
  };

  if (pageLoading) return (
    <div className="h-screen bg-[#05070a] flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  return (
    <div className="p-8 lg:p-12 bg-[#05070a] min-h-screen text-white">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black tracking-tighter italic text-white uppercase">
          Upgrade to <span className="text-blue-500">Pro</span>
        </h1>
        <p className="text-[10px] uppercase tracking-[0.5em] text-zinc-600 font-bold mt-4">
          Institutional CRT License Selection
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <div 
            key={plan.id} 
            onClick={() => setSelectedPlan(plan)}
            className={`crt-card p-10 flex flex-col relative cursor-pointer transition-all duration-300 border rounded-[40px] ${
              selectedPlan?.id === plan.id 
              ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-500/[0.05]' 
              : plan.is_recommended ? 'border-white/10 bg-white/[0.01]' : 'border-white/5 bg-transparent'
            }`}
          >
            {plan.is_recommended && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                Best Value
              </div>
            )}
            
            <div className="mb-8">{renderIcon(plan.icon_type)}</div>
            <h3 className="text-lg font-black tracking-tight mb-1">{plan.name}</h3>
            <div className="flex items-baseline gap-1 mb-8">
              <span className="text-4xl font-black tracking-tighter">${plan.price}</span>
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{plan.duration_text}</span>
            </div>

            <div className="space-y-4 mb-10 flex-1">
              {plan.features.map((feature: string) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check size={14} className="text-blue-500" />
                  <span className="text-[11px] font-bold text-zinc-400">{feature}</span>
                </div>
              ))}
            </div>

            <button className={`py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedPlan?.id === plan.id ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]' : 'bg-white/5 text-zinc-400'
            }`}>
              {selectedPlan?.id === plan.id ? 'Plan Selected' : 'Select License'}
            </button>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="crt-card w-full max-w-xl p-8 bg-[#0a0c10] border border-blue-500/30 rounded-[40px] shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-xl font-black italic tracking-tighter uppercase">Checkout</h2>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                  Global License Provisioning
                </p>
              </div>
              <button onClick={() => { setSelectedPlan(null); setCryptoStatus('idle'); setCryptoHash(''); }} className="text-zinc-600 hover:text-white p-2">✕</button>
            </div>

            <div className="bg-white/[0.02] rounded-xl p-4 mb-6 border border-white/5 flex justify-between items-center">
                <span className="text-sm font-bold uppercase tracking-tight">{selectedPlan.name}</span>
                <span className="text-xl font-black text-blue-500">${selectedPlan.price}</span>
            </div>

            <div className="flex gap-2 mb-8 bg-black p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => setPaymentMethod('WHOP')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'WHOP' ? 'bg-zinc-800 text-white' : 'text-zinc-600'}`}
              >
                <CreditCard size={14} /> Card
              </button>
              <button 
                onClick={() => setPaymentMethod('CRYPTO')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'CRYPTO' ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-600'}`}
              >
                <Bitcoin size={14} /> Crypto
              </button>
            </div>

            {paymentMethod === 'WHOP' ? (
              <button 
                onClick={handleWhopPayment}
                disabled={loading}
                className="w-full flex items-center justify-center gap-4 px-6 py-5 bg-blue-600 rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.2)]"
              >
                {loading ? <Loader2 className="animate-spin" size={18}/> : <span className="text-[11px] font-black uppercase tracking-widest text-white">Pay with Whop Checkout</span>}
              </button>
            ) : (
              <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                <div className="grid gap-3">
                  {WALLETS.map((w) => (
                    <div key={w.network} className="bg-white/[0.02] border border-white/5 p-3 rounded-xl flex justify-between items-center group">
                      <div>
                        <p className="text-[8px] font-black text-zinc-600 uppercase mb-1">{w.network}</p>
                        <p className="text-[10px] font-mono text-white">{w.address}</p>
                      </div>
                      <button onClick={() => copyToClipboard(w.address)} className="p-2 hover:bg-white/5 rounded-lg">
                        {copied === w.address ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-zinc-600" />}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block px-1">Transaction Hash (TxID)</label>
                  <input 
                    type="text" 
                    value={cryptoHash}
                    onChange={(e) => setCryptoHash(e.target.value)}
                    placeholder="Paste your hash here..."
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-white focus:border-orange-500/50 outline-none transition-all"
                  />
                  <button 
                    onClick={handleCryptoSubmit}
                    disabled={!cryptoHash || cryptoStatus !== 'idle'}
                    className={`w-full py-5 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all
                      ${cryptoStatus === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-orange-600 text-white hover:bg-orange-500'}
                    `}
                  >
                    {cryptoStatus === 'idle' && 'Submit for Manual Validation'}
                    {cryptoStatus === 'submitting' && <Loader2 className="animate-spin mx-auto" size={18} />}
                    {cryptoStatus === 'success' && 'Request Sent - Awaiting Admin'}
                  </button>
                </div>

                <div className="flex items-center gap-2 px-2 opacity-50 justify-center">
                  <ShieldCheck size={12} className="text-zinc-500" />
                  <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Verified within 1-12 hours of confirmation.</p>
                </div>
              </div>
            )}

            <p className="text-[8px] text-zinc-600 text-center mt-8 uppercase font-bold tracking-widest leading-loose">
              Immediate license delivery for card payments.<br/>
              Institutional-grade payment verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}