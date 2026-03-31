"use client";

import { useKimoo } from '@/context/KimooContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Search } from 'lucide-react';

export default function WatchlistPage() {
  const { watchlist, setWatchlist } = useKimoo();
  const [newAsset, setNewAsset] = useState('');

  const addAsset = () => {
    if (newAsset && !watchlist.includes(newAsset.toUpperCase())) {
      setWatchlist([...watchlist, newAsset.toUpperCase()]);
      setNewAsset('');
    }
  };

  const removeAsset = (asset: string) => {
    setWatchlist(watchlist.filter((a: string) => a !== asset));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-12">
        <h1 className="text-3xl font-black tracking-tighter">Watchlist Manager</h1>
        <p className="text-zinc-500 text-xs uppercase tracking-widest mt-1">Control which assets hit your terminal</p>
      </header>

      {/* Input Section */}
      <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem] mb-8 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
          <input 
            type="text" 
            value={newAsset}
            onChange={(e) => setNewAsset(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addAsset()}
            placeholder="Search Asset (e.g. NAS100, XAUUSD)"
            className="w-full bg-black border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm focus:border-blue-500 outline-none transition-all"
          />
        </div>
        <button 
          onClick={addAsset}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
        >
          <Plus size={16} /> Add
        </button>
      </div>

      {/* List Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {watchlist.map((asset: string) => (
            <motion.div
              key={asset}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-blue-500/30 transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 font-black text-xs">
                  {asset.substring(0, 2)}
                </div>
                <span className="text-lg font-black tracking-tight">{asset}</span>
              </div>
              <button 
                onClick={() => removeAsset(asset)}
                className="p-2 text-zinc-700 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}