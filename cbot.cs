using System;
using System.Net.Http;
using System.Threading.Tasks;
using cAlgo.API;
using System.Net;
using System.Linq;
using System.Collections.Generic;

namespace cAlgo
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.FullAccess)]
    public class KimooGuardianBot : Robot
    {
        // --- BASIC SETTINGS ---
        [Parameter("Signal URL", DefaultValue = "https://your-website.com/api/signals?botId=YOUR_ID")]
        public string SignalUrl { get; set; }

        // --- RISK MANAGEMENT ---
        [Parameter("Risk % Per Trade", DefaultValue = 1.0, MinValue = 0.1, MaxValue = 5.0)]
        public double RiskPercentage { get; set; }

        [Parameter("Default SL (Pips) if not in Signal", DefaultValue = 20)]
        public double DefaultStopLossPips { get; set; }

        // --- DAILY SAFETY GUARD ---
        [Parameter("Max Daily Loss ($)", DefaultValue = 500)]
        public double MaxDailyLoss { get; set; }

        [Parameter("Max Daily Profit ($)", DefaultValue = 1000)]
        public double MaxDailyProfit { get; set; }

        // --- PAIR WATCHLIST ---
        [Parameter("Trade BTCUSD", DefaultValue = true)]
        public bool TradeBTC { get; set; }
        
        [Parameter("Trade EURUSD", DefaultValue = true)]
        public bool TradeEURUSD { get; set; }
        
        [Parameter("Trade GBPUSD", DefaultValue = true)]
        public bool TradeGBPUSD { get; set; }
        
        [Parameter("Trade XAUUSD (Gold)", DefaultValue = true)]
        public bool TradeGold { get; set; }
        
        [Parameter("Trade NAS100 / US100", DefaultValue = false)]
        public bool TradeNas { get; set; }

        private readonly HttpClient _client = new HttpClient();
        private string _lastProcessedSignal = "";
        private bool _isProcessing = false;
        private Dictionary<string, bool> _watchlist = new Dictionary<string, bool>();

        protected override void OnStart()
        {
            // Fix for connection security
            ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
            
            // Map the Watchlist
            _watchlist.Clear();
            _watchlist.Add("BTCUSD", TradeBTC);
            _watchlist.Add("EURUSD", TradeEURUSD);
            _watchlist.Add("GBPUSD", TradeGBPUSD);
            _watchlist.Add("XAUUSD", TradeGold);
            _watchlist.Add("GOLD", TradeGold); // Support both naming conventions
            _watchlist.Add("NAS100", TradeNas);
            _watchlist.Add("US100", TradeNas);

            Print("KIMOO PRO Guardian: System Online. Monitoring Watchlist...");
            Timer.Start(2); 
        }

        protected override void OnTimer()
        {
            if (IsDailyLimitHit()) return;
            if (_isProcessing) return;

            _isProcessing = true;
            Task.Run(async () => 
            {
                await ProcessRemoteSignals();
                _isProcessing = false;
            });
        }

        private bool IsDailyLimitHit()
        {
            double closedPnL = History.Where(t => t.ClosingTime >= DateTime.Today).Sum(t => t.NetProfit);
            double floatingPnL = Positions.Where(p => p.Label == "KIMOO_PRO").Sum(p => p.NetProfit);
            double totalPnL = closedPnL + floatingPnL;

            if (totalPnL <= -MaxDailyLoss)
            {
                Chart.DrawStaticText("KIMOO_STATUS", "LIMIT: DAILY LOSS REACHED", VerticalAlignment.Top, HorizontalAlignment.Right, Color.Red);
                return true;
            }
            if (totalPnL >= MaxDailyProfit)
            {
                Chart.DrawStaticText("KIMOO_STATUS", "GOAL: DAILY PROFIT REACHED", VerticalAlignment.Top, HorizontalAlignment.Right, Color.Gold);
                return true;
            }
            return false;
        }

        private async Task ProcessRemoteSignals()
        {
            try 
            {
                var response = await _client.GetStringAsync(SignalUrl);
                
                if (string.IsNullOrEmpty(response) || response.Contains("\"action\":\"none\"") || response == _lastProcessedSignal) 
                    return;

                _lastProcessedSignal = response; // Mark as read immediately
                
                BeginInvokeOnMainThread(() => {
                    ExecuteTradeWithRisk(response);
                });
            } 
            catch (Exception ex) { Print("Bridge Error: " + ex.Message); }
        }

        private void ExecuteTradeWithRisk(string json)
        {
            // 1. Identify Symbol
            string targetSymbolName = SymbolName;
            if (json.Contains("\"symbol\":\""))
            {
                targetSymbolName = json.Split(new[] { "\"symbol\":\"" }, StringSplitOptions.None)[1].Split('"')[0];
            }

            // 2. Check Watchlist Checkbox
            bool isAllowed = false;
            if (_watchlist.TryGetValue(targetSymbolName, out isAllowed))
            {
                if (!isAllowed)
                {
                    Print($"Signal for {targetSymbolName} Ignored: Unchecked in parameters.");
                    return;
                }
            }

            var symbol = Symbols.GetSymbol(targetSymbolName);
            if (symbol == null)
            {
                Print($"Error: Symbol {targetSymbolName} not found on this broker.");
                return;
            }

            TradeType type = json.Contains("buy") ? TradeType.Buy : TradeType.Sell;

            // 3. Dynamic Risk Calculation
            double riskAmount = Account.Balance * (RiskPercentage / 100);
            double slPips = DefaultStopLossPips; 
            
            // Formula: (Balance * Risk%) / (SL * PipValue)
            double volumeInUnits = symbol.QuantityToVolumeInUnits(riskAmount / (slPips * symbol.PipValue * symbol.LotSize)) * symbol.LotSize;
            volumeInUnits = symbol.NormalizeVolumeInUnits(volumeInUnits);

            var res = ExecuteMarketOrder(type, symbol.Name, volumeInUnits, "KIMOO_PRO", slPips, null);
            
            if (res.IsSuccessful) 
            {
                Chart.DrawStaticText("KIMOO_STATUS", $"ACTIVE: {type} {targetSymbolName}", VerticalAlignment.Top, HorizontalAlignment.Right, Color.Cyan);
                Print($"KIMOO SUCCESS: {type} {targetSymbolName} | Risk: {RiskPercentage}%");
            }
        }

        protected override void OnStop()
        {
            Timer.Stop();
            Print("KIMOO PRO Bridge: System Offline.");
        }
    }
}