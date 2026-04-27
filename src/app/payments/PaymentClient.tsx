'use client';

import { useState } from 'react';
import { createCryptoPayment } from '@/lib/payments';
import { Loader2 } from 'lucide-react';

export default function PaymentClient({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCryptoPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await createCryptoPayment(userId, 50, 'CRT PRO Lifetime');
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        setError('Could not generate payment link. Please try again.');
      }
    } catch (err) {
      setError('Payment request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-8 rounded-[2rem] relative overflow-hidden preserve-3d transition-transform hover:rotate-x-2 hover:rotate-y-[-2deg]">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--glow-primary)] to-transparent opacity-10 pointer-events-none rounded-[2rem]" />
      
      <div className="relative z-10">
        <h3 className="text-xl font-black uppercase tracking-tighter">CRT PRO Lifetime</h3>
        <p className="text-4xl font-black mt-2 drop-shadow-md">$50 <span className="text-sm opacity-50 font-bold">USDT</span></p>

        {error && (
          <p className="mt-4 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 p-3 rounded-xl backdrop-blur-md">
            {error}
          </p>
        )}

        <button
          onClick={handleCryptoPayment}
          disabled={loading}
          className="btn-modern w-full mt-8 flex items-center justify-center gap-2 group preserve-3d"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <span className="relative z-10 uppercase tracking-widest text-xs font-black group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all">Pay with Crypto (USDT)</span>}
        </button>
      </div>
    </div>
  );
}
