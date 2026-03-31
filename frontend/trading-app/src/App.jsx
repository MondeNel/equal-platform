import React, { useState, useEffect } from 'react';
import TradingDashboard from './pages/TradingDashboard';
import LoadingScreen from './components/LoadingScreen';
import './index.css';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return <TradingDashboard />;
}

export default App;
