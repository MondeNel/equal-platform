import React, { useState, useEffect, useRef } from 'react';

const EqualGlobalSync = ({ onFinish }) => {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  // ─── Globe animation ────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 280, H = 280, cx = W / 2, cy = H / 2, R = 110;

    const rand = (a, b) => a + Math.random() * (b - a);

    function inNorthAmerica(lon, lat) {
      if (lat > 60) return lon > -170 && lon < -60 && lat < 75;
      if (lat > 45) return lon > -135 && lon < -55;
      if (lat > 30) return lon > -120 && lon < -65;
      if (lat > 20) return lon > -118 && lon < -80;
      return false;
    }
    function inSouthAmerica(lon, lat) {
      if (lat > 0)   return lon > -82 && lon < -50;
      if (lat > -20) return lon > -82 && lon < -35;
      if (lat > -40) return lon > -75 && lon < -40;
      if (lat > -56) return lon > -76 && lon < -42;
      return false;
    }
    function inAfrica(lon, lat) {
      if (lat > 15)  return lon > -18 && lon < 37;
      if (lat > 0)   return lon > -18 && lon < 42;
      if (lat > -20) return lon > 10  && lon < 42;
      if (lat > -35) return lon > 15  && lon < 35;
      return false;
    }
    function inAustralia(lon, lat) {
      if (lat > -20) return lon > 113 && lon < 140;
      if (lat > -30) return lon > 113 && lon < 154;
      if (lat > -40) return lon > 115 && lon < 148;
      return false;
    }

    const regions = [
      [-170, -60,  25,  75, 1.0, 'na'],
      [ -90, -75,   7,  25, 0.6, 'rect'],
      [ -82, -34, -56,  12, 1.0, 'sa'],
      [ -10,  40,  35,  70, 0.9, 'eu'],
      [ -18,  52, -35,  37, 1.0, 'af'],
      [  26,  90,  10,  75, 1.0, 'rect'],
      [  90, 145,  18,  75, 0.9, 'rect'],
      [  95, 140,   0,  25, 0.6, 'rect'],
      [ 113, 154, -40, -10, 0.8, 'au'],
      [ -55, -17,  60,  84, 0.5, 'rect'],
      [ 128, 145,  30,  46, 0.5, 'rect'],
      [ -25,   2,  50,  67, 0.4, 'rect'],
      [-180, 180, -80, -65, 0.3, 'rect'],
    ];

    const continentDots = [];
    regions.forEach(([minLon, maxLon, minLat, maxLat, density, shape]) => {
      const count = Math.floor((maxLon - minLon) * (maxLat - minLat) * 0.012 * density);
      for (let i = 0; i < count; i++) {
        const lon = rand(minLon, maxLon);
        const lat = rand(minLat, maxLat);
        let keep = true;
        if (shape === 'na') keep = inNorthAmerica(lon, lat);
        else if (shape === 'sa') keep = inSouthAmerica(lon, lat);
        else if (shape === 'af') keep = inAfrica(lon, lat);
        else if (shape === 'eu') keep = (lon > -10 && lon < 40 && lat > 35 && lat < 60) || (lon > -5 && lon < 30 && lat > 55 && lat < 70);
        else if (shape === 'au') keep = inAustralia(lon, lat);
        if (keep) {
          continentDots.push({
            lon: lon * (Math.PI / 180),
            lat: lat * (Math.PI / 180),
            r: Math.random() * 1.1 + 0.3,
            bright: Math.random(),
          });
        }
      }
    });

    const oceanDots = [];
    for (let i = 0; i < 200; i++) {
      oceanDots.push({
        lon: rand(-Math.PI, Math.PI),
        lat: rand(-Math.PI / 2, Math.PI / 2),
        r: 0.35,
        bright: Math.random() * 0.4,
      });
    }

    const ringPts = Array.from({ length: 120 }, (_, i) => ({
      angle: (i / 120) * Math.PI * 2,
      speed: 0.003 + Math.random() * 0.002,
      r: Math.random() * 1.2 + 0.5,
      bright: Math.random(),
    }));

    let arcT = 0;
    const ARC_SPEED = 0.006;
    const arcStart = { lon: -1.5, lat: 0.7 };
    const arcEnd   = { lon:  2.0, lat: -0.3 };
    let rot = 0;

    function project(lon, lat) {
      const x = Math.cos(lat) * Math.cos(lon + rot);
      const y = Math.sin(lat);
      const z = Math.cos(lat) * Math.sin(lon + rot);
      return { sx: cx + x * R, sy: cy - y * R, z, visible: z > 0 };
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
      bg.addColorStop(0, '#020818');
      bg.addColorStop(1, '#000000');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      const sphereGlow = ctx.createRadialGradient(cx, cy, R * 0.3, cx, cy, R);
      sphereGlow.addColorStop(0, 'rgba(0,60,140,0.15)');
      sphereGlow.addColorStop(0.7, 'rgba(0,30,80,0.08)');
      sphereGlow.addColorStop(1, 'rgba(0,10,40,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = sphereGlow;
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      const allDots = [...continentDots, ...oceanDots]
        .map(d => ({ ...d, ...project(d.lon, d.lat) }))
        .filter(d => d.visible)
        .sort((a, b) => a.z - b.z);

      allDots.forEach(d => {
        const depth = d.z;
        const isCont = d.r > 0.35;
        const alpha = isCont
          ? (0.4 + depth * 0.6) * (0.6 + d.bright * 0.4)
          : (0.05 + depth * 0.15) * d.bright;
        const size = d.r * (0.4 + depth * 0.8);

        if (isCont) {
          const grd = ctx.createRadialGradient(d.sx, d.sy, 0, d.sx, d.sy, size * 3);
          grd.addColorStop(0, `rgba(80,160,255,${alpha * 0.5})`);
          grd.addColorStop(1, 'rgba(0,80,200,0)');
          ctx.beginPath();
          ctx.arc(d.sx, d.sy, size * 3, 0, Math.PI * 2);
          ctx.fillStyle = grd;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(d.sx, d.sy, size, 0, Math.PI * 2);
          ctx.fillStyle = depth > 0.7
            ? `rgba(180,220,255,${alpha})`
            : `rgba(60,140,255,${alpha})`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(d.sx, d.sy, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(40,100,200,${alpha})`;
          ctx.fill();
        }
      });

      ctx.restore();

      // Orbital ring
      const ringRx = R * 1.22, ringRy = R * 0.28;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.38);
      ctx.beginPath();
      ctx.ellipse(0, 0, ringRx, ringRy, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(0,150,255,0.10)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ringPts.forEach(p => {
        p.angle += p.speed;
        const rx = Math.cos(p.angle) * ringRx;
        const ry = Math.sin(p.angle) * ringRy;
        const depth2 = (Math.sin(p.angle) + 1) / 2;
        const alpha2 = (0.3 + depth2 * 0.7) * p.bright;
        const grd2 = ctx.createRadialGradient(rx, ry, 0, rx, ry, p.r * 3);
        grd2.addColorStop(0, `rgba(100,200,255,${alpha2})`);
        grd2.addColorStop(1, 'rgba(0,100,255,0)');
        ctx.beginPath();
        ctx.arc(rx, ry, p.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = grd2;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(rx, ry, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,235,255,${alpha2})`;
        ctx.fill();
      });
      ctx.restore();

      // Shooting arc
      arcT = (arcT + ARC_SPEED) % 1;
      const interp = (t, s, e) => ({
        lon: s.lon + (e.lon - s.lon) * t,
        lat: s.lat + (e.lat - s.lat) * t,
      });
      for (let i = 0; i < 40; i++) {
        const t1 = arcT - (i / 40) * 0.18;
        const t2 = arcT - ((i + 1) / 40) * 0.18;
        if (t1 < 0 || t2 < 0) continue;
        const p1 = project(interp(t1, arcStart, arcEnd).lon, interp(t1, arcStart, arcEnd).lat);
        const p2 = project(interp(t2, arcStart, arcEnd).lon, interp(t2, arcStart, arcEnd).lat);
        if (!p1.visible || !p2.visible) continue;
        const fade = (1 - i / 40) * 0.9 * (p1.z + 0.2);
        ctx.beginPath();
        ctx.moveTo(p1.sx, p1.sy);
        ctx.lineTo(p2.sx, p2.sy);
        ctx.strokeStyle = `rgba(180,230,255,${fade})`;
        ctx.lineWidth = i < 2 ? 2.5 : 1.2;
        ctx.stroke();
      }
      const head = project(
        arcStart.lon + (arcEnd.lon - arcStart.lon) * arcT,
        arcStart.lat + (arcEnd.lat - arcStart.lat) * arcT,
      );
      if (head.visible) {
        const hg = ctx.createRadialGradient(head.sx, head.sy, 0, head.sx, head.sy, 8);
        hg.addColorStop(0, 'rgba(255,255,255,0.9)');
        hg.addColorStop(1, 'rgba(100,200,255,0)');
        ctx.beginPath();
        ctx.arc(head.sx, head.sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = hg;
        ctx.fill();
      }

      // Atmosphere rim
      const atm = ctx.createRadialGradient(cx, cy, R - 4, cx, cy, R + 16);
      atm.addColorStop(0, 'rgba(0,120,255,0.0)');
      atm.addColorStop(0.5, 'rgba(0,100,255,0.12)');
      atm.addColorStop(1, 'rgba(0,80,200,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, R + 12, 0, Math.PI * 2);
      ctx.fillStyle = atm;
      ctx.fill();

      // Bottom horizon glow
      const hGlow = ctx.createRadialGradient(cx, cy + R, 0, cx, cy + R, 60);
      hGlow.addColorStop(0, 'rgba(0,150,255,0.35)');
      hGlow.addColorStop(1, 'rgba(0,100,255,0)');
      ctx.beginPath();
      ctx.ellipse(cx, cy + R - 5, 60, 18, 0, 0, Math.PI * 2);
      ctx.fillStyle = hGlow;
      ctx.fill();

      // Night-side shadow
      const shadow = ctx.createRadialGradient(cx + R * 0.5, cy, R * 0.1, cx + R * 0.8, cy, R * 1.2);
      shadow.addColorStop(0, 'rgba(0,0,0,0)');
      shadow.addColorStop(0.4, 'rgba(0,0,0,0)');
      shadow.addColorStop(0.7, 'rgba(0,0,0,0.45)');
      shadow.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = shadow;
      ctx.fill();
    }

    function loop() {
      rot += 0.003;
      draw();
      animRef.current = requestAnimationFrame(loop);
    }
    animRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // ─── Progress bar ────────────────────────────────────────────────────────────
  useEffect(() => {
    const duration = 3500;
    const intervalTime = 30;
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress(prev => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          setIsComplete(true);
          setTimeout(() => setIsFading(true), 800);
          setTimeout(onFinish, 1400);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className={`sync-root ${isFading ? 'exit' : ''}`}>
      <div className="main-content">

        <canvas ref={canvasRef} width={280} height={280} className="globe-canvas" />

        <div className="status-wrap">
          <div className="status-label">
            {isComplete ? 'COMPLETED' : 'LOADING'}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="percentage-val">
            {Math.round(progress)} %
          </div>
        </div>

        <div className="brand-caption">eQual Trading App</div>
      </div>

      <style>{`
        .sync-root {
          position: fixed;
          inset: 0;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          color: white;
          font-family: 'Courier New', monospace;
          transition: opacity 0.6s ease;
        }
        .exit { opacity: 0; }

        .main-content {
          width: 100%;
          max-width: 300px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 32px;
        }

        .globe-canvas {
          display: block;
          border-radius: 50%;
        }

        .status-wrap {
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .status-label {
          font-size: 9px;
          letter-spacing: 5px;
          font-weight: 700;
          color: rgba(100,180,255,0.75);
        }

        .progress-track {
          width: 200px;
          height: 2px;
          background: rgba(255,255,255,0.08);
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #1a6fff, #00cfff);
          transition: width 0.08s linear;
        }

        .percentage-val {
          font-size: 9px;
          color: rgba(100,180,255,0.55);
          letter-spacing: 3px;
        }

        .brand-caption {
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 3px;
          color: #4fc3f7;
          opacity: 0.8;
          font-style: italic;
        }

        @media (max-width: 480px) {
          .globe-canvas { width: 220px; height: 220px; }
          .progress-track { width: 160px; }
        }
      `}</style>
    </div>
  );
};

export default EqualGlobalSync;