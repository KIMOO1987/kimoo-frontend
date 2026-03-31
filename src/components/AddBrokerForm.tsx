"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AddBrokerForm = () => {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const accountData = {
      account_number: formData.get('account_number'),
      server_name: formData.get('server_name'),
      platform: formData.get('platform'),
      // Note: In a production app, we would call a backend API 
      // here to encrypt the password before saving. 
      // For this test, we are saving the raw input.
      encrypted_password: formData.get('password'), 
      is_active: true
    };

    const { error } = await supabase.from('broker_accounts').insert([accountData]);

    if (error) alert("Error: " + error.message);
    else alert("✅ Broker linked successfully!");

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-[#161616] rounded-2xl border border-white/5 space-y-4">
      <h3 className="text-xl font-bold mb-4">Link New Account</h3>
      <input name="account_number" placeholder="MT5 Account #" className="w-full p-3 bg-black rounded-lg border border-white/10" required />
      <input name="password" type="password" placeholder="Master Password" className="w-full p-3 bg-black rounded-lg border border-white/10" required />
      <input name="server_name" placeholder="Broker Server (e.g., ICMarkets-Demo)" className="w-full p-3 bg-black rounded-lg border border-white/10" required />
      <select name="platform" className="w-full p-3 bg-black rounded-lg border border-white/10">
        <option value="MT5">MetaTrader 5</option>
        <option value="CTRADER">cTrader</option>
      </select>
      <button type="submit" disabled={loading} className="w-full py-3 bg-blue-600 rounded-lg font-bold">
        {loading ? "Saving..." : "Connect Broker"}
      </button>
    </form>
  );
};

export default AddBrokerForm;