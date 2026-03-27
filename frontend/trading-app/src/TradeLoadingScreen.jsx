import React, { useState, useEffect } from 'react';
import './TradeLoadingScreen.css';

const TradeLoadingScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [statusText, setStatusText] = useState('INITIALIZING TERMINAL...');

  useEffect(() => {
    // 3 second load time
    const duration = 3000; 
    const intervalTime = 50;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setStatusText('CONNECTION ESTABLISHED');
          setTimeout(() => setIsFading(true), 200);
          setTimeout(onFinish, 800);
          return 100;
        }
        
        // Dynamic status updates based on progress, covering all asset classes
        if (prev > 20) setStatusText('SYNCING FX LIQUIDITY POOLS...');
        if (prev > 45) setStatusText('FETCHING CRYPTO ORDER BOOKS...');
        if (prev > 70) setStatusText('LOADING STOCK MARKET INDICES...');
        if (prev > 90) setStatusText('AUTHENTICATING WALLET SECURELY...');
        
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className={`trade-loading-container ${isFading ? 'fade-out' : ''}`}>
      {/* Background Grid Layer (Updated to Purple) */}
      <div className="grid-overlay"></div>

      <div className="header-section">
        <div className="terminal-tag">PRECISION ENGINE v4.1</div>
        {/* Updated Branding to EQUAL.PLATFORM */}
        <h1 className="trade-title">EQUAL<span className="text-purple-400">.</span>PLATFORM</h1>
      </div>

      <div className="visual-section">
        <div className="scanner-container">
          {/* Central Hex/EQ Node (Updated to Purple) */}
          <div className="center-node">
            {/* "EQ" logo for Multi-Asset platform */}
            <div className="inner-hex">EQ</div>
            <div className="pulse-ring"></div>
          </div>
          
          {/* Scanning Line (Updated to Purple) */}
          <div className="scan-line"></div>
          
          {/* Data Nodes (Updated to Purple) */}
          <div className="data-node n1"></div>
          <div className="data-node n2"></div>
          <div className="data-node n3"></div>
        </div>
      </div>

      <div className="footer-section">
        <p className="loading-status">{statusText}</p>
        <div className="progress-bar-shell">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress}%` }}
          >
            <div className="fill-glow"></div>
          </div>
        </div>
        <div className="loading-stats">
          <span className="bit-rate">256.4 KB/S</span>
          <span className="percentage-text">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
};

export default TradeLoadingScreen;