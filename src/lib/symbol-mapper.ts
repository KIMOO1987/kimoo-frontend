export interface SymbolMapEntry {
  tradingview: string;
  finnhub: string;
  oanda: string;
  forexcom: string;
  binance?: string;
  fcs?: string;
  goldapi?: string;
  eodhd?: string;
  alphavantage?: string;
  yahoo?: string;
}

export const SYMBOL_MAP: Record<string, SymbolMapEntry> = {
  // --- FOREX ---
  "EURUSD": { "tradingview": "FX:EURUSD", "finnhub": "OANDA:EUR_USD", "oanda": "EURUSD", "forexcom": "EURUSD", "binance": "EURUSDT", "fcs": "EUR/USD", "alphavantage": "EURUSD" },
  "GBPUSD": { "tradingview": "FX:GBPUSD", "finnhub": "OANDA:GBP_USD", "oanda": "GBPUSD", "forexcom": "GBPUSD", "binance": "GBPUSDT", "fcs": "GBP/USD", "alphavantage": "GBPUSD" },
  "USDJPY": { "tradingview": "FX:USDJPY", "finnhub": "OANDA:USD_JPY", "oanda": "USDJPY", "forexcom": "USDJPY", "fcs": "USD/JPY", "alphavantage": "USDJPY" },
  "GBPJPY": { "tradingview": "FX:GBPJPY", "finnhub": "OANDA:GBP_JPY", "oanda": "GBPJPY", "forexcom": "GBPJPY", "fcs": "GBP/JPY", "alphavantage": "GBPJPY" },
  "AUDUSD": { "tradingview": "FX:AUDUSD", "finnhub": "OANDA:AUD_USD", "oanda": "AUDUSD", "forexcom": "AUDUSD", "binance": "AUDUSDT", "fcs": "AUD/USD", "alphavantage": "AUDUSD" },
  "EURJPY": { "tradingview": "FX:EURJPY", "finnhub": "OANDA:EUR_JPY", "oanda": "EURJPY", "forexcom": "EURJPY", "fcs": "EUR/JPY", "alphavantage": "EURJPY" },
  "NZDUSD": { "tradingview": "FX:NZDUSD", "finnhub": "OANDA:NZD_USD", "oanda": "NZDUSD", "forexcom": "NZDUSD", "binance": "NZDUSDT", "fcs": "NZD/USD", "alphavantage": "NZDUSD" },
  "CHFJPY": { "tradingview": "FX:CHFJPY", "finnhub": "OANDA:CHF_JPY", "oanda": "CHFJPY", "forexcom": "CHFJPY", "fcs": "CHF/JPY", "alphavantage": "CHFJPY" },
  "USDCAD": { "tradingview": "FX:USDCAD", "finnhub": "OANDA:USD_CAD", "oanda": "USDCAD", "forexcom": "USDCAD", "fcs": "USD/CAD", "alphavantage": "USDCAD" },
  "USDCHF": { "tradingview": "FX:USDCHF", "finnhub": "OANDA:USD_CHF", "oanda": "USDCHF", "forexcom": "USDCHF", "fcs": "USD/CHF", "alphavantage": "USDCHF" },

  // --- INDICES ---
  "US100": { "tradingview": "NASDAQ:NDX", "finnhub": "^NDX", "oanda": "NAS100", "forexcom": "US100", "binance": "NDXUSDT", "eodhd": "NDX.INDX", "yahoo": "^IXIC" },
  "US500": { "tradingview": "SP:SPX", "finnhub": "^GSPC", "oanda": "US500", "forexcom": "US500", "binance": "SPXUSDT", "eodhd": "GSPC.INDX", "yahoo": "^GSPC" },
  "US30": { "tradingview": "TVC:DJI", "finnhub": "^DJI", "oanda": "US30", "forexcom": "US30", "binance": "DJIUSDT", "eodhd": "DJI.INDX", "yahoo": "^DJI" },

  // --- METALS ---
  "XAUUSD": { "tradingview": "XAUUSD", "finnhub": "OANDA:XAU_USD", "oanda": "XAUUSD", "forexcom": "XAUUSD", "binance": "XAUUSDT", "goldapi": "XAU", "alphavantage": "GOLD" },
  "XAGUSD": { "tradingview": "XAGUSD", "finnhub": "OANDA:XAG_USD", "oanda": "XAGUSD", "forexcom": "XAGUSD", "binance": "XAGUSDT", "goldapi": "XAG", "alphavantage": "SILVER" },
  "XPTUSD": { "tradingview": "XPTUSD", "finnhub": "OANDA:XPT_USD", "oanda": "XPTUSD", "forexcom": "XPTUSD", "goldapi": "XPT" },
  "XCUUSD": { "tradingview": "XCUUSD", "finnhub": "OANDA:XCU_USD", "oanda": "XCUUSD", "forexcom": "XCUUSD", "goldapi": "XCU" },

  // --- CRYPTO ---
  "BTCUSD": { "tradingview": "BINANCE:BTCUSDT", "finnhub": "BINANCE:BTCUSDT", "oanda": "BTCUSD", "forexcom": "BTCUSD", "binance": "BTCUSDT", "alphavantage": "BTC", "yahoo": "BTC-USD" },
  "ETHUSD": { "tradingview": "BINANCE:ETHUSDT", "finnhub": "BINANCE:ETHUSDT", "oanda": "ETHUSD", "forexcom": "ETHUSD", "binance": "ETHUSDT", "alphavantage": "ETH", "yahoo": "ETH-USD" },
  "SOLUSD": { "tradingview": "BINANCE:SOLUSDT", "finnhub": "BINANCE:SOLUSDT", "oanda": "SOLUSD", "forexcom": "SOLUSD", "binance": "SOLUSDT", "alphavantage": "SOL", "yahoo": "SOL-USD" },
  "XRPUSD": { "tradingview": "BINANCE:XRPUSDT", "finnhub": "BINANCE:XRPUSDT", "oanda": "XRPUSD", "forexcom": "XRPUSD", "binance": "XRPUSDT", "alphavantage": "XRP", "yahoo": "XRP-USD" },
  "BNBUSD": { "tradingview": "BINANCE:BNBUSDT", "finnhub": "BINANCE:BNBUSDT", "oanda": "BNBUSD", "forexcom": "BNBUSD", "binance": "BNBUSDT", "alphavantage": "BNB", "yahoo": "BNB-USD" },
  "TAOUSD": { "tradingview": "BINANCE:TAOUSDT", "finnhub": "BINANCE:TAOUSDT", "oanda": "TAOUSD", "forexcom": "TAOUSD", "binance": "TAOUSDT" },
  "ADAUSD": { "tradingview": "BINANCE:ADAUSDT", "finnhub": "BINANCE:ADAUSDT", "oanda": "ADAUSD", "forexcom": "ADAUSD", "binance": "ADAUSDT", "alphavantage": "ADA", "yahoo": "ADA-USD" },
  "DOGEUSD": { "tradingview": "BINANCE:DOGEUSDT", "finnhub": "BINANCE:DOGEUSDT", "oanda": "DOGEUSD", "forexcom": "DOGEUSD", "binance": "DOGEUSDT", "alphavantage": "DOGE", "yahoo": "DOGE-USD" },
  "AVAXUSD": { "tradingview": "BINANCE:AVAXUSDT", "finnhub": "BINANCE:AVAXUSDT", "oanda": "AVAXUSD", "forexcom": "AVAXUSD", "binance": "AVAXUSDT", "alphavantage": "AVAX", "yahoo": "AVAX-USD" },
  "DOTUSD": { "tradingview": "BINANCE:DOTUSDT", "finnhub": "BINANCE:DOTUSDT", "oanda": "DOTUSD", "forexcom": "DOTUSD", "binance": "DOTUSDT", "alphavantage": "DOT", "yahoo": "DOT-USD" },
  "NEARUSD": { "tradingview": "BINANCE:NEARUSDT", "finnhub": "BINANCE:NEARUSDT", "oanda": "NEARUSD", "forexcom": "NEARUSD", "binance": "NEARUSDT", "alphavantage": "NEAR", "yahoo": "NEAR-USD" },
  "LTCUSD": { "tradingview": "BINANCE:LTCUSDT", "finnhub": "BINANCE:LTCUSDT", "oanda": "LTCUSD", "forexcom": "LTCUSD", "binance": "LTCUSDT", "alphavantage": "LTC", "yahoo": "LTC-USD" },
  "TRXUSD": { "tradingview": "BINANCE:TRXUSDT", "finnhub": "BINANCE:TRXUSDT", "oanda": "TRXUSD", "forexcom": "TRXUSD", "binance": "TRXUSDT", "alphavantage": "TRX", "yahoo": "TRX-USD" },
  "LINKUSD": { "tradingview": "BINANCE:LINKUSDT", "finnhub": "BINANCE:LINKUSDT", "oanda": "LINKUSD", "forexcom": "LINKUSD", "binance": "LINKUSDT", "alphavantage": "LINK", "yahoo": "LINK-USD" },
  "BCHUSD": { "tradingview": "BINANCE:BCHUSDT", "finnhub": "BINANCE:BCHUSDT", "oanda": "BCHUSD", "forexcom": "BCHUSD", "binance": "BCHUSDT", "alphavantage": "BCH", "yahoo": "BCH-USD" },
  "ATOMUSD": { "tradingview": "BINANCE:ATOMUSDT", "finnhub": "BINANCE:ATOMUSDT", "oanda": "ATOMUSD", "forexcom": "ATOMUSD", "binance": "ATOMUSDT", "alphavantage": "ATOM", "yahoo": "ATOM-USD" },
  "UNIUSD": { "tradingview": "BINANCE:UNIUSDT", "finnhub": "BINANCE:UNIUSDT", "oanda": "UNIUSD", "forexcom": "UNIUSD", "binance": "UNIUSDT", "alphavantage": "UNI", "yahoo": "UNI-USD" },
  "APTUSD": { "tradingview": "BINANCE:APTUSDT", "finnhub": "BINANCE:APTUSDT", "oanda": "APTUSD", "forexcom": "APTUSD", "binance": "APTUSDT", "alphavantage": "APT", "yahoo": "APT-USD" },
  "INJUSD": { "tradingview": "BINANCE:INJUSDT", "finnhub": "BINANCE:INJUSDT", "oanda": "INJUSD", "forexcom": "INJUSD", "binance": "INJUSDT", "alphavantage": "INJ", "yahoo": "INJ-USD" },
  "OPUSD": { "tradingview": "BINANCE:OPUSDT", "finnhub": "BINANCE:OPUSDT", "oanda": "OPUSD", "forexcom": "OPUSD", "binance": "OPUSDT", "alphavantage": "OP", "yahoo": "OP-USD" }
};

/**
 * Normalizes any input symbol to the internal standard (e.g. BTCUSD, XAUUSD).
 */
export function normalizeSymbol(symbol: string): string {
  if (!symbol) return "";

  // Clean symbol: remove provider prefixes and special characters
  let clean = symbol.toUpperCase();
  if (clean.includes(':')) {
    clean = clean.split(':')[1];
  }

  // Strip common suffixes
  clean = clean.replace(/USDT$/, '');
  clean = clean.replace(/USD$/, '');
  clean = clean.replace(/[^A-Z0-9]/g, '');

  // Handle common aliases
  const aliasMap: Record<string, string> = {
    "NAS100": "US100",
    "USTEC": "US100",
    "NDX": "US100",
    "DJI": "US30",
    "WALLSTREET": "US30",
    "SPX": "US500",
    "SPX500": "US500",
    "GOLD": "XAUUSD",
    "SILVER": "XAGUSD",
    "XAU": "XAUUSD",
    "XAG": "XAGUSD",
    "BTC": "BTCUSD",
    "ETH": "ETHUSD"
  };

  const base = aliasMap[clean] || clean;

  // If it's a known pair in SYMBOL_MAP, return it
  if (SYMBOL_MAP[base]) return base;

  // Fallback for pairs that might have lost their 'USD'
  if (SYMBOL_MAP[base + "USD"]) return base + "USD";

  return base;
}

/**
 * Returns the mapped symbol for a specific provider.
 */
export function getMappedSymbol(symbol: string, target: keyof SymbolMapEntry): string {
  const normalized = normalizeSymbol(symbol);
  const entry = SYMBOL_MAP[normalized];

  if (entry) {
    return entry[target] || normalized;
  }

  // Fallback heuristic if not in map
  return normalized;
}

/**
 * Categorizes the symbol.
 */
export function getSymbolCategory(symbol: string) {
  const normalized = normalizeSymbol(symbol);

  const metals = ['XAUUSD', 'XAGUSD', 'XPTUSD', 'XCUUSD', 'GOLD', 'SILVER'];
  if (metals.some(m => normalized.startsWith(m.replace('USD', '')))) {
    return 'METALS';
  }

  const indices = ['US100', 'US30', 'US500', 'GER40', 'UK100', 'SPX500'];
  if (indices.includes(normalized)) {
    return 'INDICES';
  }

  const forexPairs = [
    'EURUSD', 'GBPUSD', 'USDJPY', 'GBPJPY', 'AUDUSD', 'EURJPY', 'NZDUSD', 'CHFJPY',
    'USDCAD', 'USDCHF', 'GBPAUD', 'EURAUD'
  ];
  if (forexPairs.includes(normalized)) {
    return 'FOREX';
  }

  return 'CRYPTO';
}

/**
 * Deduplicates signals based on normalized symbol, side, and "fuzzy" entry price.
 */
export function deduplicateSignals(signals: any[]) {
  if (!signals) return [];

  const sorted = [...signals].sort((a, b) =>
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const seen = new Set();
  return sorted.filter(s => {
    const normalized = normalizeSymbol(s.symbol);
    const price = Number(s.entry_price || 0);
    const fuzzyEntry = price > 100 ? Math.round(price) : Math.round(price * 10000) / 10000;

    const key = `${normalized}-${s.side}-${fuzzyEntry}`;

    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
