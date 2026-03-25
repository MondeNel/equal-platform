import React, { useState, useEffect } from 'react';
import './OrbitLoadingScreen.css';

const OrbitLoadingScreen = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const duration = 3500; // 3.5 seconds total
    const intervalTime = 50; 
    const totalSteps = duration / intervalTime;
    const increment = 100 / totalSteps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Start the fade out effect
          setTimeout(() => setIsFading(true), 200); 
          // Finally remove the component
          setTimeout(onFinish, 800); 
          return 100;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className={`orbit-loading-container ${isFading ? 'fade-out' : ''}`}>
      <div className="header-section">
        <h1 className="game-title">ORBIT BET</h1>
      </div>

      <div className="visual-section">
        <div className="saturn-container">
          <div className="saturn-planet"></div>
          <div className="saturn-rings"></div>
          <div className="orbit-path">
            <div className="orbiting-dot"></div>
          </div>
        </div>
      </div>

      <div className="footer-section">
        <p className="slogan">Predict the Gravity. Master the Market.</p>
        <div className="progress-container">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="percentage">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default OrbitLoadingScreen;