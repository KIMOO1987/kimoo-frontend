'use client';

import { useState } from 'react';
import { createCryptoPayment } from '@/lib/payments'; // The function we wrote earlier

export default function PaymentPage({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);

  const handleCryptoPayment = async () => {
    setLoading(true);
    try {
      // 1. Call your function to get the invoice from NOWPayments
      const data = await createCryptoPayment(userId, 50, 'CRT PRO Lifetime');

      // 2. Redirect the user to the NOWPayments checkout page
      if (data.invoice_url) {
        window.location.href = data.invoice_url;
      } else {
        console.error("Payment URL not found", data);
        alert("Could not generate payment link. Check console.");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-gray-900 rounded-lg border border-gray-800">
      <h3 className="text-xl font-bold">CRT PRO Lifetime</h3>
      <p className="text-2xl mt-2">$50</p>
      
      <button 
        onClick={handleCryptoPayment}
        disabled={loading}
        className="w-full mt-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-md transition-all"
      >
        {loading ? 'Generating Invoice...' : 'Pay with Crypto (USDT)'}
      </button>
    </div>
  );
}