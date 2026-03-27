import React, { useState } from 'react';
import TradingDashboard from './pages/TradingDashboard';
import TradeLoadingScreen from './TradeLoadingScreen'; 
import './index.css';

function App() {
  // Directly manage the boot-up state
  const [isTerminalReady, setIsTerminalReady] = useState(false);

  return (
    <div className="App bg-black min-h-screen">
      {!isTerminalReady ? (
        /* 1. Show the Loading Sequence first */
        <TradeLoadingScreen onFinish={() => setIsTerminalReady(true)} />
      ) : (
        /* 2. Reveal the main Dashboard (Trade interface) */
        <div className="animate-fade-in">
          <TradingDashboard />
        </div>
      )}
    </div>
  );
}

export default App;