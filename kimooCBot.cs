using System;
using System.Net.Http;
using cAlgo.API;

namespace cAlgo
{
    [Robot(TimeZone = TimeZones.UTC, AccessRights = AccessRights.FullAccess)]
    public class KimooExecutionBot : Robot
    {
        [Parameter("Signal URL", DefaultValue = "https://api.yourdomain.com/fetch?botId=YOUR_UNIQUE_ID")]
        public string SignalUrl { get; set; }

        private readonly HttpClient _client = new HttpClient();

        protected override void OnStart()
        {
            Timer.Start(2); // Check every 2 seconds
        }

        protected override void OnTimer()
        {
            ProcessRemoteSignals();
        }

        private async void ProcessRemoteSignals()
        {
            try {
                var response = await _client.GetStringAsync(SignalUrl);
                if (!string.IsNullOrEmpty(response)) {
                    // Parse JSON and Execute
                    // Example: ExecuteMarketOrder(TradeType.Buy, SymbolName, 1000);
                    Print("Signal Received: " + response);
                }
            } catch (Exception ex) {
                Print("API Connection Error: " + ex.Message);
            }
        }
    }
}