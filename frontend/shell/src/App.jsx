import React, { useState, useEffect } from 'react';
import './index.css';
import './App.css';
import BottomNav from './components/BottomNav';

// Live counter component with smooth animation
const LiveCounter = ({ base, min, max, step = 5, interval = 800 }) => {
  const [value, setValue] = useState(base);
  const [trend, setTrend] = useState('up');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setValue(prev => {
        const change = Math.floor(Math.random() * step * 2) - Math.floor(step * 0.7);
        let newValue = prev + change;
        newValue = Math.max(min, Math.min(max, newValue));
        if (newValue > prev) setTrend('up');
        else if (newValue < prev) setTrend('down');
        return newValue;
      });
    }, interval);
    return () => clearInterval(intervalId);
  }, [min, max, step, interval]);

  return (
    <span className="live-counter" data-trend={trend}>
      {value.toLocaleString()}
    </span>
  );
};

// Volume counter with full number display
const VolumeCounter = ({ base, min, max, step = 50000, interval = 1000 }) => {
  const [value, setValue] = useState(base);
  const [trend, setTrend] = useState('up');

  useEffect(() => {
    const intervalId = setInterval(() => {
      setValue(prev => {
        const change = Math.floor(Math.random() * step * 2) - Math.floor(step * 0.6);
        let newValue = prev + change;
        newValue = Math.max(min, Math.min(max, newValue));
        if (newValue > prev) setTrend('up');
        else if (newValue < prev) setTrend('down');
        return newValue;
      });
    }, interval);
    return () => clearInterval(intervalId);
  }, [min, max, step, interval]);

  // Format with spaces for thousands
  const formatValue = (val) => {
    return `R ${val.toLocaleString('en-ZA')}`;
  };

  return (
    <span className="volume-counter" data-trend={trend}>
      {formatValue(value)}
    </span>
  );
};

// Typing animation component
const TypingSlogan = () => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullText = "COMPLEXITY IS THE ENEMY OF EXECUTION";

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setIsTypingComplete(true);
      }
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="slogan-container">
      <p className="slogan-text">
        {displayedText}
        {!isTypingComplete && <span className="typing-cursor">|</span>}
      </p>
    </div>
  );
};

function App() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  
  if (tab === 'bet') {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#05050e',
        position: 'relative',
      }}>
        <iframe 
          src="http://localhost:5175" 
          style={{
            width: '100%',
            height: '100vh',
            border: 'none',
            background: '#05050e',
          }}
          title="OrbitBet"
        />
      </div>
    );
  }
  
  // Landing page - NO white backgrounds
  return (
    <div style={{
      minHeight: '100vh',
      background: '#05050e',
      fontFamily: "'Inter', 'Helvetica Neue', 'Courier New', monospace",
      position: 'relative',
    }}>
      {/* Content container - transparent background */}
      <div style={{
        width: '100%',
        maxWidth: 'min(480px, 100%)',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 'clamp(60px, 15vh, 72px)',
        position: 'relative',
        zIndex: 1,
        background: 'transparent', // No white background
      }}>
        
        {/* Hero Section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'clamp(24px, 8vw, 32px) clamp(16px, 5vw, 20px)',
          background: 'transparent', // No white background
        }}>
          {/* Uber-style Bold White Logo */}
          <div style={{ marginBottom: 'clamp(24px, 6vw, 32px)', textAlign: 'center' }}>
            <h1 style={{
              fontSize: 'clamp(48px, 12vw, 72px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: 0,
              lineHeight: 1,
              color: '#ffffff',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}>
              eQual
            </h1>
            <p style={{
              fontSize: 'clamp(10px, 2.5vw, 12px)',
              color: '#38bdf8',
              letterSpacing: '2px',
              marginTop: '8px',
              fontWeight: 500,
            }}>
              AFRICA'S TRADING PLATFORM
            </p>
          </div>

          {/* Typing Animation Slogan */}
          <TypingSlogan />

          {/* Live stats - semi-transparent background */}
          <div style={{
            width: '100%',
            background: 'rgba(13, 8, 32, 0.8)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(46, 46, 88, 0.5)',
            borderRadius: 'clamp(10px, 3vw, 12px)',
            padding: 'clamp(12px, 3vw, 16px)',
            marginBottom: 'clamp(16px, 5vw, 24px)',
            marginTop: 'clamp(16px, 4vw, 24px)',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 'clamp(4px, 2vw, 8px)',
              textAlign: 'center',
            }}>
              <div>
                <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 'bold', color: '#4ade80' }}>
                  <LiveCounter base={1247} min={1180} max={1320} step={8} interval={900} />
                </div>
                <div style={{ fontSize: 'clamp(7px, 2vw, 9px)', color: '#8080aa', letterSpacing: '1px', marginTop: '4px' }}>
                  ACTIVE TRADERS
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(12px, 3.5vw, 16px)', fontWeight: 'bold', color: '#facc15' }}>
                  <VolumeCounter base={16233476} min={14500000} max={18500000} step={85000} interval={1100} />
                </div>
                <div style={{ fontSize: 'clamp(7px, 2vw, 9px)', color: '#8080aa', letterSpacing: '1px', marginTop: '4px' }}>
                  TODAY'S VOLUME
                </div>
              </div>
              <div>
                <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 'bold', color: '#38bdf8' }}>#1</div>
                <div style={{ fontSize: 'clamp(7px, 2vw, 9px)', color: '#8080aa', letterSpacing: '1px', marginTop: '4px' }}>
                  SA PLATFORM
                </div>
              </div>
            </div>
          </div>

          {/* AI Alert card */}
          <div 
            style={{
              width: '100%',
              background: 'rgba(10, 8, 32, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              borderRadius: 'clamp(10px, 3vw, 12px)',
              padding: 'clamp(10px, 3vw, 12px) clamp(12px, 4vw, 16px)',
              display: 'flex',
              alignItems: 'center',
              gap: 'clamp(8px, 3vw, 12px)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onClick={() => window.location.href = "http://localhost:5175?tab=bet"}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(15, 10, 48, 0.9)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(10, 8, 32, 0.8)'}
          >
            <div style={{
              width: 'clamp(32px, 10vw, 36px)',
              height: 'clamp(32px, 10vw, 36px)',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b0764, #6d28d9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 'clamp(10px, 3vw, 12px)',
              fontWeight: 'bold',
              color: '#ddd6fe',
            }}>AI</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'clamp(8px, 2.5vw, 10px)', color: '#a78bfa', letterSpacing: '1px', marginBottom: '2px' }}>PETER · JUST NOW</div>
              <div style={{ fontSize: 'clamp(9px, 2.5vw, 11px)', color: '#c8c8ee', lineHeight: '1.4' }}>USD/ZAR breakout forming — 89 pip opportunity detected</div>
            </div>
            <div style={{ 
              width: 'clamp(6px, 2vw, 8px)', 
              height: 'clamp(6px, 2vw, 8px)', 
              borderRadius: '50%', 
              background: '#a78bfa',
              flexShrink: 0,
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav active="home" />
    </div>
  );
}

export default App;