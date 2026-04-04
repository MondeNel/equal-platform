import { useState, useEffect, useCallback } from "react";
import { Header } from "./components/arbitrage/header";
import { AccountBalances } from "./components/arbitrage/account-balances";
import { OpportunityAlert } from "./components/arbitrage/opportunity-alert";
import { MarketSelector } from "./components/arbitrage/market-selector";
import { ExchangePrices } from "./components/arbitrage/exchange-prices";
import { OrderTypeSelector } from "./components/arbitrage/order-type-selector";
import { AmountInput } from "./components/arbitrage/amount-input";
import { TransactionBreakdown } from "./components/arbitrage/transaction-breakdown";
import { ExecuteButton } from "./components/arbitrage/execute-button";
import { BottomNavigation } from "./components/arbitrage/bottom-navigation";
import { fetchPrices, fetchOpportunities, executeArbitrage, createLimitOrder } from "./lib/api";
import "./styles/globals.css";

function App() {
  const [aiScanningEnabled, setAiScanningEnabled] = useState(true);
  const [market, setMarket] = useState("crypto");
  const [symbol, setSymbol] = useState("BTC/ZAR");
  const [orderType, setOrderType] = useState("market");
  const [amount, setAmount] = useState(1000);
  const [limitPrice, setLimitPrice] = useState(null);
  
  const [prices, setPrices] = useState(null);
  const [opportunity, setOpportunity] = useState(null);
  const [balances, setBalances] = useState({
    account: 2450.00,
    current: 2612.40
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);

  const loadPrices = useCallback(async () => {
    try {
      setIsLoading(true);
      const [priceData, oppData] = await Promise.all([
        fetchPrices(symbol),
        fetchOpportunities(symbol, 0.1)
      ]);
      setPrices(priceData);
      if (oppData && oppData.length > 0) {
        setOpportunity(oppData[0]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 5000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  const calculateBreakdown = () => {
    if (!opportunity) {
      return {
        coins: 0,
        spreadValue: 0,
        fee: 0,
        estimatedProfit: 0
      };
    }
    
    const buyPrice = opportunity.buy_price || 0;
    const sellPrice = opportunity.sell_price || 0;
    const coins = buyPrice > 0 ? amount / buyPrice : 0;
    const spreadValue = coins * (sellPrice - buyPrice);
    const fee = amount * 0.015;
    const estimatedProfit = spreadValue - fee;
    
    return {
      coins: coins.toFixed(6),
      spreadValue: spreadValue.toFixed(0),
      fee: fee.toFixed(0),
      estimatedProfit: estimatedProfit.toFixed(0)
    };
  };

  const handleExecute = async () => {
    if (!opportunity) return;
    
    setIsExecuting(true);
    setError(null);
    
    try {
      if (orderType === "market") {
        await executeArbitrage({
          symbol,
          amount_zar: amount,
          buy_exchange: opportunity.buy_exchange,
          sell_exchange: opportunity.sell_exchange
        });
      } else {
        await createLimitOrder({
          symbol,
          amount_zar: amount,
          target_spread_percent: limitPrice || opportunity.spread_percent,
          buy_exchange: opportunity.buy_exchange,
          sell_exchange: opportunity.sell_exchange
        });
      }
      await loadPrices();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsExecuting(false);
    }
  };

  const breakdown = calculateBreakdown();

  return (
    <div className="app-container">
      <Header 
        aiScanningEnabled={aiScanningEnabled} 
        onToggleAiScanning={() => setAiScanningEnabled(!aiScanningEnabled)} 
      />
      
      <main className="px-4 pb-24 space-y-4">
        <AccountBalances 
          accountBalance={balances.account} 
          currentBalance={balances.current} 
        />
        
        {opportunity && aiScanningEnabled && (
          <OpportunityAlert opportunity={opportunity} />
        )}
        
        <MarketSelector 
          market={market}
          symbol={symbol}
          onMarketChange={setMarket}
          onSymbolChange={setSymbol}
        />
        
        <ExchangePrices 
          prices={prices}
          opportunity={opportunity}
          isLoading={isLoading}
        />
        
        <OrderTypeSelector 
          orderType={orderType}
          onOrderTypeChange={setOrderType}
          limitPrice={limitPrice}
          onLimitPriceChange={setLimitPrice}
        />
        
        <AmountInput 
          amount={amount}
          onAmountChange={setAmount}
          maxAmount={balances.account}
        />
        
        <TransactionBreakdown 
          breakdown={breakdown}
          opportunity={opportunity}
        />
        
        {error && (
          <div className="text-center p-2 border rounded" style={{ color: "var(--arb-red)", borderColor: "rgba(248,113,113,0.3)", background: "rgba(248,113,113,0.1)" }}>
            {error}
          </div>
        )}
        
        <ExecuteButton 
          onExecute={handleExecute}
          isExecuting={isExecuting}
          disabled={!opportunity || amount <= 0}
        />
      </main>
      
      <BottomNavigation />
    </div>
  );
}

export default App;
