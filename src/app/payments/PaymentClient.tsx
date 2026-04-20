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
    <div className="p-6 bg-[#0a0a0a] rounded-[2rem] border border-white/5">
      <h3 className="text-xl font-black uppercase tracking-tighter text-white">CRT PRO Lifetime</h3>
      <p className="text-3xl font-black text-white mt-2">$50 <span className="text-sm text-zinc-500 font-bold">USDT</span></p>

      {error && (
        <p className="mt-4 text-red-400 text-[10px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
          {error}
        </p>
      )}

      <button
        onClick={handleCryptoPayment}
        disabled={loading}
        className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 text-white font-black rounded-2xl transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
      >
        {loading ? <Loader2 className="animate-spin" size={16} /> : 'Pay with Crypto (USDT)'}
      </button>
    </div>
  );
}
