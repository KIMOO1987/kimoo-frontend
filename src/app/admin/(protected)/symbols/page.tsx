"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Search, Activity, ChevronRight, Loader2, Plus, Trash2, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SymbolManagement() {
  const [symbols, setSymbols] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [newTicker, setNewTicker] = useState('');
  const [newTimeframe, setNewTimeframe] = useState('15');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchSymbols();
  }, []);

  const fetchSymbols = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('monitored_symbols')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast.error('Failed to fetch symbols');
    } else {
      setSymbols(data || []);
    }
    setLoading(false);
  };

  const handleAddSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicker) return;

    setIsAdding(true);
    const { data, error } = await supabase
      .from('monitored_symbols')
      .insert([{ 
        ticker: newTicker.toUpperCase(), 
        timeframe: newTimeframe,
        is_active: true 
      }])
      .select();

    if (error) {
      toast.error('Error adding symbol: ' + error.message);
    } else {
      toast.success('Symbol added to Watchdog');
      setSymbols([data[0], ...symbols]);
      setNewTicker('');
    }
    setIsAdding(false);
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('monitored_symbols')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      setSymbols(symbols.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s));
    }
  };

  const handleDeleteSymbol = async (id: string) => {
    if (!confirm('Stop monitoring this symbol?')) return;

    const { error } = await supabase
      .from('monitored_symbols')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete symbol');
    } else {
      toast.success('Symbol removed');
      setSymbols(symbols.filter(s => s.id !== id));
    }
  };

  const filtered = symbols.filter(s => s.ticker.toLowerCase().includes(query.toLowerCase()));

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={40} className="text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="relative p-4 md:p-12 lg:p-16 min-h-screen text-white font-sans">
      <div className="max-w-[1700px] mx-auto relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tighter italic flex items-center gap-3 uppercase">
              Watchdog<span className="text-blue-500">Matrix</span>
            </h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-500 font-bold mt-3">
              • LIVE SIGNAL SOURCE MANAGEMENT •
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
            {/* Add Form */}
            <form onSubmit={handleAddSymbol} className="flex gap-2">
              <input 
                placeholder="EXCHANGE:SYMBOL (e.g. BINANCE:BTCUSDT)"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-mono outline-none focus:border-blue-500 transition-all w-full md:w-64"
                value={newTicker}
                onChange={(e) => setNewTicker(e.target.value)}
              />
              <select 
                className="bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-xs font-mono outline-none"
                value={newTimeframe}
                onChange={(e) => setNewTimeframe(e.target.value)}
              >
                <option value="1">1m</option>
                <option value="5">5m</option>
                <option value="15">15m</option>
                <option value="60">1h</option>
                <option value="240">4h</option>
              </select>
              <button 
                type="submit"
                disabled={isAdding}
                className="bg-blue-600 hover:bg-blue-500 p-2 rounded-xl transition-all disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              </button>
            </form>

            <div className="relative h-[42px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                placeholder="Filter matrix..." 
                className="w-full h-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs font-mono outline-none focus:border-blue-500 transition-all"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Symbol Grid */}
        <div className="grid gap-4 max-w-5xl mx-auto">
          {filtered.length === 0 && (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
              <Globe size={40} className="mx-auto text-zinc-600 mb-4 opacity-20" />
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No active monitors in the matrix</p>
            </div>
          )}

          {filtered.map(symbol => (
            <div key={symbol.id} className="relative overflow-hidden bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-all duration-300 group flex items-center justify-between">
              <div className="flex items-center gap-5">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg ${symbol.is_active ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-zinc-500/10 border-zinc-500/30 text-zinc-500'}`}>
                  <Activity size={20} className={symbol.is_active ? 'animate-pulse' : ''} />
                </div>
                <div>
                  <p className="text-base font-black italic tracking-tight">{symbol.ticker}</p>
                  <div className="flex gap-3 mt-1">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">TF: {symbol.timeframe}m</span>
                    <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded ${symbol.is_active ? 'text-green-400 bg-green-500/10' : 'text-zinc-500 bg-white/5'}`}>
                      {symbol.is_active ? 'ONLINE' : 'PAUSED'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleToggleActive(symbol.id, symbol.is_active)}
                  className="text-[9px] font-black uppercase tracking-widest border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
                >
                  {symbol.is_active ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => handleDeleteSymbol(symbol.id)}
                  className="text-red-400 hover:text-red-300 transition-all p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
