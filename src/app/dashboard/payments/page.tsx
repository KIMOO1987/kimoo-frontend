"use client";

import { useState, useEffect, useMemo } from 'react';
import { Check, Zap, Crown, Star, CreditCard, Bitcoin, Loader2, Copy, ShieldCheck, X, CheckCircle2, Clock } from 'lucide-react';
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
    // 1. Optimistic Cache Load: Instantly show previous plans
    const cachedPlans = sessionStorage.getItem('payments_plans_cache');
    if (cachedPlans) {
      try {
        setPlans(JSON.parse(cachedPlans));
        setPageLoading(false); // Instantly hide loader
      } catch (e) {}
    }

    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      
      if (!error && data) {
        setPlans(data);
        sessionStorage.setItem('payments_plans_cache', JSON.stringify(data));
      }
      setPageLoading(false);
    };
    fetchPlans();
  }, []);

  // Determine the recommended plan (e.g., the middle one or a specific ID)
  const recommendedPlan = useMemo(() => {
    return plans.find(p => p.is_recommended) || plans[Math.floor(plans.length / 2)];
  }, [plans]);

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
    <div className="min-h-screen flex items-center justify-center bg-[#030407]">
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <Loader2 size={40} className="text-zinc-700 mb-4 animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-600">Loading Licenses...</p>
      </div>
    </div>
  );

  return (
    <div className="relative p-4 md:p-12 lg:p-16 lg:ml-72 bg-[#030407] min-h-screen text-white font-sans overflow-x-hidden">
      
      {/* Ambient Glowing Backgrounds */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen" />
      </div>

      <div className="max-w-[1700px] mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-20">
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter italic flex items-center justify-center gap-3 uppercase text-white">
            Upgrade to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Pro</span>
          </h1>
          <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-4 leading-none">
            • INSTITUTIONAL CRT LICENSE SELECTION •
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              onClick={() => setSelectedPlan(plan)}
              className={`relative p-8 md:p-10 flex flex-col cursor-pointer transition-all duration-500 group backdrop-blur-xl rounded-[2.5rem] border ${
                selectedPlan?.id === plan.id 
                ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_50px_rgba(59,130,246,0.2)] transform md:-translate-y-4 z-10' 
                : recommendedPlan?.id === plan.id 
                  ? 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/20 shadow-2xl hover:border-white/30' 
                  : 'bg-gradient-to-br from-white/[0.04] to-white/[0.01] border-white/[0.05] shadow-xl hover:border-white/10 hover:bg-white/[0.06]'
              }`}
            >
              {recommendedPlan?.id === plan.id && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] font-black px-4 py-1.5 rounded-b-xl uppercase tracking-widest shadow-lg">
                  Best Value
                </div>
              )}
              
              <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] w-fit shadow-lg group-hover:scale-110 transition-transform duration-300">
                {renderIcon(plan.icon_type)}
              </div>
              <h3 className="text-xl font-black italic tracking-tighter uppercase drop-shadow-md mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-8">
                <span className="text-5xl md:text-6xl font-black tracking-tighter">${plan.price}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{plan.duration_text}</span>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature: string) => (
                  <div key={feature} className="flex items-center gap-4">
                    <div className="p-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.2)]">
                      <Check size={12} strokeWidth={3} />
                    </div>
                    <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest leading-relaxed">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`py-4 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 mt-auto ${
                selectedPlan?.id === plan.id 
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)] border border-blue-500/50' 
                : 'bg-white/[0.02] border border-white/[0.05] text-zinc-400 group-hover:bg-white/[0.05] group-hover:text-white group-hover:border-white/20'
              }`}>
                {selectedPlan?.id === plan.id ? 'Plan Selected' : 'Select License'}
              </button>
            </div>
          ))}
        </div>

        {selectedPlan && (
          <div className="fixed inset-0 bg-[#030407]/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-xl p-8 md:p-10 bg-gradient-to-br from-[#0a0c10] to-[#030407] border border-white/[0.08] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto relative">
              <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-[100px] pointer-events-none" />
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8 border-b border-white/5 pb-6">
                  <div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase drop-shadow-md">Checkout</h2>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">
                      Global License Provisioning
                    </p>
                  </div>
                  <button onClick={() => { setSelectedPlan(null); setCryptoStatus('idle'); setCryptoHash(''); }} className="p-2.5 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.08] hover:text-white rounded-xl transition-all"><X size={20} className="text-zinc-500" /></button>
                </div>

                <div className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] rounded-2xl p-5 mb-8 border border-white/[0.05] flex justify-between items-center shadow-lg">
                    <span className="text-sm font-black uppercase tracking-widest text-white">{selectedPlan.name}</span>
                    <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 tracking-tighter">${selectedPlan.price}</span>
                </div>

                <div className="flex gap-2 mb-8 bg-white/[0.02] p-1.5 rounded-2xl border border-white/[0.05]">
                  <button 
                    onClick={() => setPaymentMethod('WHOP')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'WHOP' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <CreditCard size={14} /> Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('CRYPTO')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${paymentMethod === 'CRYPTO' ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'text-zinc-500 hover:text-white hover:bg-white/[0.02]'}`}
                  >
                    <Bitcoin size={14} /> Crypto
                  </button>
                </div>

                {paymentMethod === 'WHOP' ? (
                  <button 
                    onClick={handleWhopPayment}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 border border-blue-500/30 rounded-xl hover:from-blue-500 hover:to-indigo-500 transition-all duration-300 active:scale-95 shadow-[0_0_30px_rgba(59,130,246,0.3)] hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]"
                  >
                    {loading ? <Loader2 className="animate-spin text-blue-200" size={18}/> : <><CreditCard size={18} className="text-blue-200" /> <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">Pay with Whop Checkout</span></>}
                  </button>
                ) : (
                  <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center leading-relaxed">
                      Send exactly <span className="text-orange-400">${selectedPlan.price}</span> to one of the addresses below.
                      <br/>Then paste your transaction hash (TxID) for verification.
                    </p>
                    <div className="grid gap-3">
                      {WALLETS.map((w) => (
                        <div key={w.network} className="bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.05] p-4 rounded-2xl flex justify-between items-center group hover:bg-white/[0.06] transition-colors">
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">{w.network}</p>
                            <p className="text-xs font-mono font-bold text-zinc-300 tracking-tight">{w.address}</p>
                          </div>
                          <button onClick={() => copyToClipboard(w.address)} className="p-2.5 bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.1] rounded-xl transition-all shadow-lg">
                            {copied === w.address ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-zinc-400 group-hover:text-white" />}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block ml-1">Transaction Hash (TxID)</label>
                      <input 
                        type="text" 
                        value={cryptoHash}
                        onChange={(e) => setCryptoHash(e.target.value)}
                        placeholder="Paste your transaction hash (TxID) here..."
                        className="w-full bg-white/[0.02] border border-white/[0.08] rounded-xl px-4 py-4 text-xs font-mono text-white focus:border-orange-500/50 hover:border-white/20 outline-none transition-all"
                      />
                      <button 
                        onClick={handleCryptoSubmit}
                        disabled={!cryptoHash || cryptoStatus !== 'idle'}
                        className={`w-full py-5 rounded-xl font-black text-[11px] uppercase tracking-[0.2em] transition-all duration-300 active:scale-95 shadow-lg border flex items-center justify-center gap-3
                          ${cryptoStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.2)]' : 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-500/30 hover:from-orange-500 hover:to-red-500 shadow-[0_0_30px_rgba(249,115,22,0.3)] hover:shadow-[0_0_40px_rgba(249,115,22,0.5)]'}
                          ${cryptoStatus === 'submitting' ? 'opacity-70 cursor-not-allowed bg-none bg-white/[0.05] border-white/10 shadow-none text-zinc-500' : ''}`}
                      >
                        {cryptoStatus === 'idle' && <><ShieldCheck size={18} className="text-orange-200"/> Submit for Validation</>}
                        {cryptoStatus === 'submitting' && <Loader2 className="animate-spin text-zinc-400" size={18} />}
                        {cryptoStatus === 'success' && <><CheckCircle2 size={18}/> Request Sent - Awaiting Admin</>}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 px-2 opacity-50 justify-center">
                      <Clock size={12} className="text-zinc-500" />
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Verified within 1-12 hours of confirmation.</p>
                    </div>
                  </div>
                )}

                <p className="text-[9px] text-zinc-600 text-center mt-8 uppercase font-bold tracking-widest leading-loose">
                  Immediate license delivery for card payments.<br/>
                  Institutional-grade payment verification.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
