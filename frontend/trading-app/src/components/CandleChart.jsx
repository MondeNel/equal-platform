import React, { useRef, useEffect, useState, useCallback } from 'react';

// Helper: generate initial candles (demo data)
const generateCandles = (startPrice, count = 200) => {
  const candles = [];
  let price = startPrice || 18.25;
  for (let i = 0; i < count; i++) {
    const open = price;
    const close = price + (Math.random() - 0.5) * price * 0.006;
    const high = Math.max(open, close) + Math.random() * price * 0.004;
    const low = Math.min(open, close) - Math.random() * price * 0.004;
    candles.push({ open, high, low, close });
    price = close;
  }
  return candles;
};

export default function CandleChart({
  livePrice,
  entry,
  takeProfit,
  stopLoss,
  onEntryChange,
  onTPChange,
  onSLChange,
  isTradeActive = false,
  showControls = false,
  activeTool = 'cursor',
  onToolSelect,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const drawingCanvasRef = useRef(null);
  const [candles, setCandles] = useState(() => generateCandles(livePrice || 18.25, 200));
  const [zoomLevel, setZoomLevel] = useState(2.22); // Default 222% zoom
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [draggingLine, setDraggingLine] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 390, h: 420 });
  const [particles, setParticles] = useState([]);
  const [pulseIntensity, setPulseIntensity] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState([]);
  const [currentDrawing, setCurrentDrawing] = useState(null);
  const [textInput, setTextInput] = useState({ visible: false, x: 0, y: 0, value: '' });
  const [userScrolled, setUserScrolled] = useState(false);

  const totalCandles = candles.length;
  const visibleCount = Math.max(20, Math.floor(80 / zoomLevel));
  const maxOffset = Math.max(0, totalCandles - visibleCount);
  const startIdx = Math.min(maxOffset, offset);
  const visibleCandles = candles.slice(startIdx, startIdx + visibleCount);

  // ── Auto‑centre on latest candles when not manually scrolled ──────────────
  useEffect(() => {
    if (!userScrolled) {
      setOffset(maxOffset);
    }
  }, [maxOffset, userScrolled]);

  // Also centre on mount (in case maxOffset hasn't changed)
  useEffect(() => {
    setOffset(maxOffset);
  }, []); // runs once after first render

  // ── Responsive canvas sizing ───────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = showControls
        ? Math.max(150, window.innerHeight - 650)
        : Math.max(280, window.innerHeight - 310);
      setCanvasSize({ w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [showControls]);

  // Sync canvas element dimensions to measured size
  useEffect(() => {
    const canvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;
    if (!canvas || !drawingCanvas) return;
    canvas.width = canvasSize.w * window.devicePixelRatio;
    canvas.height = canvasSize.h * window.devicePixelRatio;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;
    
    drawingCanvas.width = canvasSize.w * window.devicePixelRatio;
    drawingCanvas.height = canvasSize.h * window.devicePixelRatio;
    drawingCanvas.style.width = `${canvasSize.w}px`;
    drawingCanvas.style.height = `${canvasSize.h}px`;
  }, [canvasSize]);

  // ── Pulse animation for live price ─────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIntensity(prev => (prev + 0.05) % 1);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // ── Particle generation on price change ────────────────────────────────────
  useEffect(() => {
    if (!livePrice) return;
    const newParticles = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvasSize.w,
      y: Math.random() * canvasSize.h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      life: 1,
      color: livePrice > (candles[candles.length - 1]?.close || 18) ? '#4ade80' : '#f87171',
    }));
    setParticles(prev => [...prev, ...newParticles].slice(-50));
  }, [livePrice, canvasSize.w, canvasSize.h, candles]);

  // ── Update particles ──────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => 
        prev
          .map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.02 }))
          .filter(p => p.life > 0)
      );
    }, 30);
    return () => clearInterval(interval);
  }, []);

  // ── Price helpers ──────────────────────────────────────────────────────────
  const getPriceRange = useCallback((candles, extras = []) => {
    const prices = [...candles.flatMap(c => [c.high, c.low]), ...extras.filter(Boolean)];
    if (prices.length === 0) return { yMin: 18, yMax: 19, yRange: 1 };
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    const range = maxP - minP || minP * 0.01;
    const pad = range * 0.12;
    const yMin = minP - pad;
    const yMax = maxP + pad;
    return { yMin, yMax, yRange: yMax - yMin };
  }, []);

  const toY = useCallback((price, yMin, yRange, h) => {
    return h - ((price - yMin) / yRange) * h;
  }, []);

  const getPriceFromY = useCallback((clientY, rect) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const h = canvasSize.h;
    const y = clientY - rect.top;
    if (y < 0 || y > h) return null;
    const { yMin, yRange } = getPriceRange(
      visibleCandles,
      [entry, takeProfit, stopLoss]
    );
    return yMin + (1 - y / h) * yRange;
  }, [canvasSize, visibleCandles, entry, takeProfit, stopLoss, getPriceRange]);

  // ── Live price update ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!livePrice) return;
    setCandles(prev => {
      const next = [...prev];
      const last = { ...next[next.length - 1] };
      last.close = livePrice;
      last.high = Math.max(last.high, livePrice);
      last.low = Math.min(last.low, livePrice);
      next[next.length - 1] = last;
      return next;
    });
  }, [livePrice]);

  // New candle every 10s
  useEffect(() => {
    const id = setInterval(() => {
      if (!livePrice) return;
      setCandles(prev => {
        const next = [...prev];
        next.push({ open: livePrice, high: livePrice, low: livePrice, close: livePrice });
        if (next.length > 300) next.shift();
        return next;
      });
    }, 10000);
    return () => clearInterval(id);
  }, [livePrice]);

  // ── Zoom with user scroll flag ────────────────────────────────────────────
  const zoom = (dir) => {
    setUserScrolled(true);
    setZoomLevel(prev => {
      const next = dir > 0
        ? Math.min(prev * 1.2, 5)
        : Math.max(prev / 1.2, 0.5);
      const center = startIdx + visibleCount / 2;
      const newVisible = Math.max(20, Math.floor(80 / next));
      const newOff = Math.max(0, Math.min(maxOffset, center - newVisible / 2));
      setOffset(Math.round(newOff));
      return next;
    });
  };

  const centerChart = () => {
    setUserScrolled(false);
    setOffset(maxOffset);
    setZoomLevel(2.22);
  };

  // ── Drawing handlers based on activeTool ──────────────────────────────────
  const startDrawing = (x, y) => {
    if (activeTool === 'cursor') return false;
    const newDrawing = {
      id: Date.now() + Math.random(),
      type: activeTool,
      start: { x, y },
      end: { x, y },
      color: getToolColor(activeTool),
    };
    setCurrentDrawing(newDrawing);
    setIsDrawing(true);
    return true;
  };

  const updateDrawing = (x, y) => {
    if (!isDrawing || !currentDrawing) return;
    setCurrentDrawing(prev => ({ ...prev, end: { x, y } }));
  };

  const finishDrawing = () => {
    if (!isDrawing || !currentDrawing) return;
    const distance = Math.hypot(
      currentDrawing.end.x - currentDrawing.start.x,
      currentDrawing.end.y - currentDrawing.start.y
    );
    if (distance > 5) {
      setDrawings(prev => [...prev, currentDrawing]);
    }
    setIsDrawing(false);
    setCurrentDrawing(null);
    if (onToolSelect && activeTool !== 'cursor') {
      onToolSelect('cursor');
    }
  };

  const getToolColor = (tool) => {
    switch (tool) {
      case 'trendline': return '#38bdf8';
      case 'hline': return '#facc15';
      case 'vline': return '#facc15';
      case 'rect': return '#f87171';
      case 'fib': return '#4ade80';
      case 'arc': return '#a78bfa';
      case 'ruler': return '#f97316';
      default: return '#ffffff';
    }
  };

  const handleTextInputSubmit = () => {
    if (textInput.value.trim()) {
      const newDrawing = {
        id: Date.now(),
        type: 'text',
        position: { x: textInput.x, y: textInput.y },
        text: textInput.value,
        color: '#ffffff',
      };
      setDrawings(prev => [...prev, newDrawing]);
    }
    setTextInput({ visible: false, x: 0, y: 0, value: '' });
    if (onToolSelect) onToolSelect('cursor');
  };

  // ── Pointer down on chart (main canvas) ───────────────────────────────────
  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x: cx, y: cy } = getClientXY(e);
    const localX = cx - rect.left;
    const localY = cy - rect.top;

    if (activeTool !== 'cursor') {
      if (activeTool === 'text') {
        setTextInput({ visible: true, x: localX, y: localY, value: '' });
        return;
      }
      startDrawing(localX, localY);
      return;
    }

    const { yMin, yRange } = getPriceRange(visibleCandles, [entry, takeProfit, stopLoss]);
    const h = canvasSize.h;

    if (!isTradeActive) {
      if (hitLine(entry, localY, yMin, yRange, h)) {
        setDraggingLine('entry'); return;
      }
      if (hitLine(takeProfit, localY, yMin, yRange, h)) {
        setDraggingLine('tp'); return;
      }
      if (hitLine(stopLoss, localY, yMin, yRange, h)) {
        setDraggingLine('sl'); return;
      }
    }

    setIsDragging(true);
    setUserScrolled(true);
    setDragStart({ x: cx, offset: startIdx });
  };

  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x: cx, y: cy } = getClientXY(e);
    const localX = cx - rect.left;
    const localY = cy - rect.top;

    if (isDrawing && currentDrawing && activeTool !== 'cursor') {
      updateDrawing(localX, localY);
      return;
    }

    if (draggingLine) {
      const price = getPriceFromY(cy, rect);
      if (price != null) {
        const dec = (livePrice || 18) > 100 ? 2 : 4;
        const p = parseFloat(price.toFixed(dec));
        if (draggingLine === 'entry') onEntryChange?.(p);
        if (draggingLine === 'tp') onTPChange?.(p);
        if (draggingLine === 'sl') onSLChange?.(p);
      }
      return;
    }

    if (isDragging) {
      const dx = cx - dragStart.x;
      const delta = Math.round(dx / (canvasSize.w / visibleCount));
      const newOff = Math.max(0, Math.min(maxOffset, dragStart.offset - delta));
      setOffset(newOff);
    }
  }, [isDrawing, currentDrawing, activeTool, draggingLine, isDragging, dragStart, maxOffset, visibleCount, canvasSize.w, livePrice, getPriceFromY, onEntryChange, onTPChange, onSLChange]);

  const handlePointerUp = useCallback(() => {
    if (isDrawing) {
      finishDrawing();
    }
    setIsDragging(false);
    setDraggingLine(null);
  }, [isDrawing, finishDrawing]);

  const getClientXY = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const hitLine = (price, mouseY, yMin, yRange, h, threshold = 14) => {
    if (price == null) return false;
    const lineY = toY(price, yMin, yRange, h);
    return Math.abs(lineY - mouseY) < threshold;
  };

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);
    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // ── Draw all drawings on drawing canvas ───────────────────────────────────
  useEffect(() => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    const w = canvasSize.w;
    const h = canvasSize.h;
    ctx.clearRect(0, 0, w * dpr, h * dpr);
    ctx.save();
    ctx.scale(dpr, dpr);
    
    drawings.forEach(drawing => {
      drawShape(ctx, drawing);
    });
    if (currentDrawing && !textInput.visible) {
      drawShape(ctx, currentDrawing);
    }
    ctx.restore();
  }, [drawings, currentDrawing, canvasSize, textInput.visible]);

  const drawShape = (ctx, drawing) => {
    const { type, start, end, position, text, color } = drawing;
    ctx.strokeStyle = color;
    ctx.fillStyle = color + '20';
    ctx.lineWidth = 2;
    ctx.font = '12px monospace';
    ctx.fillStyle = color;

    switch (type) {
      case 'trendline':
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        break;
      case 'hline':
        if (start && start.y) {
          ctx.beginPath();
          ctx.moveTo(0, start.y);
          ctx.lineTo(canvasSize.w, start.y);
          ctx.stroke();
        }
        break;
      case 'vline':
        if (start && start.x) {
          ctx.beginPath();
          ctx.moveTo(start.x, 0);
          ctx.lineTo(start.x, canvasSize.h);
          ctx.stroke();
        }
        break;
      case 'rect':
        const x = Math.min(start.x, end.x);
        const y = Math.min(start.y, end.y);
        const width = Math.abs(end.x - start.x);
        const height = Math.abs(end.y - start.y);
        ctx.fillRect(x, y, width, height);
        ctx.strokeRect(x, y, width, height);
        break;
      case 'fib':
        const startY = Math.min(start.y, end.y);
        const endY = Math.max(start.y, end.y);
        const fibHeight = endY - startY;
        const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
        const midX = (start.x + end.x) / 2;
        levels.forEach((level, i) => {
          const y = startY + fibHeight * level;
          ctx.beginPath();
          ctx.setLineDash([5, 5]);
          ctx.moveTo(Math.min(start.x, end.x), y);
          ctx.lineTo(Math.max(start.x, end.x), y);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = color;
          ctx.font = 'bold 8px monospace';
          ctx.fillText(`${(level * 100).toFixed(1)}%`, Math.max(start.x, end.x) + 5, y - 2);
        });
        break;
      case 'arc':
        const radius = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
        break;
      case 'ruler':
        const distance = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.fillStyle = color;
        ctx.font = '10px monospace';
        ctx.fillText(`${Math.round(distance)}px`, (start.x + end.x) / 2, (start.y + end.y) / 2);
        break;
      case 'text':
        if (position) {
          ctx.fillStyle = color;
          ctx.font = 'bold 12px monospace';
          ctx.fillText(text, position.x, position.y);
        }
        break;
    }
  };

  // ── Main chart drawing (candles, price lines, particles) ──────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleCandles.length === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    const w = canvasSize.w;
    const h = canvasSize.h;
    ctx.save();
    ctx.scale(dpr, dpr);
    // Background
    const gradient = ctx.createLinearGradient(0, 0, 0, h);
    gradient.addColorStop(0, '#0a0a1e');
    gradient.addColorStop(1, '#05050e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    const extras = [entry, takeProfit, stopLoss, livePrice].filter(Boolean);
    const { yMin, yMax, yRange } = getPriceRange(visibleCandles, extras);
    const toYc = (p) => toY(p, yMin, yRange, h);

    // Grid lines
    const gridRows = 6;
    for (let i = 0; i <= gridRows; i++) {
      const y = (i / gridRows) * h;
      ctx.strokeStyle = '#1a1a30';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    // Price labels
    ctx.fillStyle = '#404080';
    ctx.font = `${8}px monospace`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridRows; i++) {
      const price = yMin + (i / gridRows) * yRange;
      const y = toYc(price);
      ctx.fillText(price.toFixed(4), w - 4, y - 2);
    }
    ctx.textAlign = 'left';

    // Candles
    const totalW = w;
    const candleW = Math.max(2, (totalW / visibleCandles.length) * 0.7);
    const step = totalW / visibleCandles.length;
    visibleCandles.forEach((c, i) => {
      const x = i * step + step / 2;
      const openY = toYc(c.open);
      const closeY = toYc(c.close);
      const highY = toYc(c.high);
      const lowY = toYc(c.low);
      const bull = c.close >= c.open;
      const color = bull ? '#4ade80' : '#f87171';
      // Wick
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();
      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    });

    // Live price line with pulse
    if (livePrice && livePrice > 0) {
      const py = toYc(livePrice);
      const glowAlpha = 0.2 + 0.1 * Math.sin(pulseIntensity * Math.PI * 2);
      ctx.strokeStyle = `rgba(250, 204, 21, ${glowAlpha})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.setLineDash([]);
      // badge
      const label = livePrice.toFixed(4);
      const badgeW = 60;
      const badgeH = 16;
      const badgeX = w - badgeW - 2;
      const badgeY = py - badgeH / 2;
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
      ctx.fill();
      ctx.fillStyle = '#05050e';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, badgeX + badgeW / 2, badgeY + 11);
      ctx.textAlign = 'left';
    }

    // Entry, TP, SL lines
    const drawLevel = (price, color, label) => {
      if (!price) return;
      const py = toYc(price);
      ctx.strokeStyle = color + '30';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.setLineDash([5, 4]);
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.beginPath();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.setLineDash([]);
      if (!isTradeActive) {
        const hx = w - 22;
        ctx.beginPath();
        ctx.arc(hx, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = color + '40';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
      }
      const text = `${label}  ${price.toFixed(4)}`;
      const bW = ctx.measureText(text).width + 14;
      const bH = 15;
      const bX = w - bW - 28;
      const bY = py - bH / 2;
      ctx.fillStyle = color + '22';
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.roundRect(bX, bY, bW, bH, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = 'bold 8px monospace';
      ctx.fillText(text, bX + 7, bY + 10);
    };
    drawLevel(entry, '#38bdf8', 'ENTRY');
    drawLevel(takeProfit, '#4ade80', 'TP');
    drawLevel(stopLoss, '#f87171', 'SL');

    // Particles
    particles.forEach(p => {
      ctx.fillStyle = p.color + Math.round(p.life * 100).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2 * p.life, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }, [visibleCandles, livePrice, entry, takeProfit, stopLoss, isTradeActive, canvasSize, getPriceRange, toY, pulseIntensity, particles]);

  const isCentered = offset >= maxOffset - 1;
  const cursorStyle = activeTool !== 'cursor' 
    ? (activeTool === 'text' ? 'text' : 'crosshair')
    : (draggingLine ? 'ns-resize' : (isDragging ? 'grabbing' : 'grab'));

  return (
    <div ref={containerRef} className="relative w-full select-none overflow-hidden group" style={{ height: canvasSize.h }}>
      {/* Main chart canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: `${canvasSize.w}px`,
          height: `${canvasSize.h}px`,
          cursor: cursorStyle,
          touchAction: 'none',
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      />
      {/* Drawing overlay canvas */}
      <canvas
        ref={drawingCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${canvasSize.w}px`,
          height: `${canvasSize.h}px`,
          cursor: cursorStyle,
          touchAction: 'none',
          pointerEvents: 'none',
        }}
      />
      {/* Text input modal */}
      {textInput.visible && (
        <div
          className="absolute z-20"
          style={{ left: textInput.x, top: textInput.y - 20 }}
        >
          <input
            type="text"
            autoFocus
            className="bg-[#0a0a1e] border border-[#38bdf8] rounded px-2 py-1 text-white text-xs font-mono"
            placeholder="Enter text..."
            value={textInput.value}
            onChange={e => setTextInput(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && handleTextInputSubmit()}
            onBlur={handleTextInputSubmit}
          />
        </div>
      )}
      {/* Centre button */}
      {!isCentered && (
        <button
          onClick={centerChart}
          className="absolute top-2 right-2 px-3 py-1.5 bg-gradient-to-br from-[#2a2a50] to-[#1a1a30] border border-[#38bdf8] rounded-md text-[#38bdf8] text-[9px] font-mono hover:shadow-lg hover:shadow-[#38bdf8]/50 transition-all z-10 font-bold uppercase tracking-widest"
        >
          ⌖ CENTRE
        </button>
      )}
      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex gap-1 items-center z-10 bg-[#0a0a1e]/50 backdrop-blur-sm p-2 rounded-lg border border-[#2e2e58]">
        <button onClick={() => zoom(-1)} className="w-8 h-8 bg-gradient-to-br from-[#1a1a32] to-[#12122a] border border-[#3a5a8c] rounded-md text-[#38bdf8] font-bold hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all flex items-center justify-center text-sm">−</button>
        <div className="px-3 py-1 bg-[#0a0a1e] border border-[#2e2e58] rounded-md text-[#5858a0] text-[8px] min-w-[40px] text-center font-semibold">{Math.round(zoomLevel * 100)}%</div>
        <button onClick={() => zoom(1)} className="w-8 h-8 bg-gradient-to-br from-[#1a1a32] to-[#12122a] border border-[#3a5a8c] rounded-md text-[#38bdf8] font-bold hover:shadow-lg hover:shadow-[#38bdf8]/30 transition-all flex items-center justify-center text-sm">+</button>
      </div>
      {/* Clear drawings button */}
      {drawings.length > 0 && (
        <button
          onClick={() => setDrawings([])}
          className="absolute bottom-2 left-2 px-2 py-1 bg-[#0a0a1e]/50 border border-[#2e2e58] rounded-md text-[#8888c0] text-[8px] font-mono hover:bg-[#2a2a50] transition-all"
        >
          Clear {drawings.length} drawing{drawings.length !== 1 && 's'}
        </button>
      )}
    </div>
  );
}