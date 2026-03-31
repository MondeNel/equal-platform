import React, { useRef, useEffect, useState, useCallback } from 'react';

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
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [candles, setCandles] = useState(() => generateCandles(livePrice || 18.25, 200));
  const [zoomLevel, setZoomLevel] = useState(1);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, offset: 0 });
  const [draggingLine, setDraggingLine] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ w: 390, h: 420 });

  const totalCandles = candles.length;
  const visibleCount = Math.max(20, Math.floor(80 / zoomLevel));
  const maxOffset = Math.max(0, totalCandles - visibleCount);
  const startIdx = Math.min(maxOffset, offset);
  const visibleCandles = candles.slice(startIdx, startIdx + visibleCount);

  // ── Responsive canvas sizing ───────────────────────────────────────────────
  useEffect(() => {
    const measure = () => {
      const el = containerRef.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = showControls
        ? Math.max(150, window.innerHeight - 500)
        : Math.max(320, window.innerHeight - 210);
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
    if (!canvas) return;
    canvas.width = canvasSize.w * window.devicePixelRatio;
    canvas.height = canvasSize.h * window.devicePixelRatio;
    canvas.style.width = `${canvasSize.w}px`;
    canvas.style.height = `${canvasSize.h}px`;
  }, [canvasSize]);

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
    const dpr = window.devicePixelRatio || 1;
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

  // ── Zoom ───────────────────────────────────────────────────────────────────
  const zoom = (dir) => {
    setZoomLevel(prev => {
      const next = dir > 0
        ? Math.min(prev * 1.5, 5)
        : Math.max(prev / 1.5, 0.3);
      const center = startIdx + visibleCount / 2;
      const newVisible = Math.max(20, Math.floor(80 / next));
      const newOff = Math.max(0, Math.min(maxOffset, center - newVisible / 2));
      setOffset(Math.round(newOff));
      return next;
    });
  };

  const centerChart = () => { setOffset(maxOffset); setZoomLevel(1); };

  // ── Pointer helpers (unified mouse + touch) ────────────────────────────────
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

  // ── Pointer down ──────────────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x: cx, y: cy } = getClientXY(e);
    const localY = cy - rect.top;

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
    setDragStart({ x: cx, offset: startIdx });
  };

  // ── Pointer move ──────────────────────────────────────────────────────────
  const handlePointerMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { x: cx, y: cy } = getClientXY(e);

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
  }, [isDragging, draggingLine, dragStart, maxOffset, visibleCount, canvasSize.w, livePrice, getPriceFromY, onEntryChange, onTPChange, onSLChange]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    setDraggingLine(null);
  }, []);

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

  // ── Draw ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || visibleCandles.length === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;   // physical pixels
    const H = canvas.height;
    const w = canvasSize.w;   // css pixels (for label positioning)
    const h = canvasSize.h;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background — match parent container exactly, no visible gap
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(0, 0, w, h);

    // Price range
    const extras = [entry, takeProfit, stopLoss, livePrice].filter(Boolean);
    const { yMin, yMax, yRange } = getPriceRange(visibleCandles, extras);
    const toYc = (p) => toY(p, yMin, yRange, h);

    // Grid lines
    ctx.strokeStyle = '#1a1a30';
    ctx.lineWidth = 0.5;
    const gridRows = 6;
    for (let i = 0; i <= gridRows; i++) {
      const y = (i / gridRows) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Price axis labels (right side)
    ctx.fillStyle = '#404080';
    ctx.font = `${8 * (dpr > 1 ? 1 : 1)}px monospace`;
    ctx.textAlign = 'right';
    for (let i = 0; i <= gridRows; i++) {
      const price = yMin + (i / gridRows) * yRange;
      const y = toYc(price);
      ctx.fillText(price.toFixed(4), w - 4, y - 2);
    }
    ctx.textAlign = 'left';

    // Candle width
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
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.moveTo(x, highY);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(openY, closeY);
      const bodyH = Math.max(1.5, Math.abs(closeY - openY));
      ctx.fillStyle = color;
      ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
    });

    // ── Live price dashed line ─────────────────────────────────────────────
    if (livePrice && livePrice > 0) {
      const py = toYc(livePrice);
      ctx.beginPath();
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price badge
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

    // ── Draw level lines (entry / TP / SL) ────────────────────────────────
    const drawLevel = (price, color, label) => {
      if (!price) return;
      const py = toYc(price);

      // Line
      ctx.beginPath();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
      ctx.setLineDash([]);

      if (!isTradeActive) {
        // Drag handle
        const hx = w - 22;
        ctx.beginPath();
        ctx.arc(hx, py, 8, 0, Math.PI * 2);
        ctx.fillStyle = color + '30';
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

      // Badge label
      const text = `${label}  ${price.toFixed(4)}`;
      const bW = ctx.measureText(text).width + 14;
      const bH = 15;
      const bX = w - bW - 28;
      const bY = py - bH / 2;
      ctx.fillStyle = color + '22';
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
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

    ctx.restore();
  }, [visibleCandles, livePrice, entry, takeProfit, stopLoss, isTradeActive, canvasSize, getPriceRange, toY]);

  const isCentered = offset >= maxOffset - 1;
  const cursorStyle = draggingLine ? 'ns-resize' : isDragging ? 'grabbing' : 'grab';

  return (
    <div ref={containerRef} className="relative w-full select-none overflow-hidden" style={{ height: canvasSize.h }}>
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

      {/* Centre button */}
      {!isCentered && (
        <button
          onClick={centerChart}
          className="absolute top-2 right-2 px-2 py-1 bg-[#1a1a30] border border-[#3a3a60] rounded-md text-[#38bdf8] text-[9px] font-mono hover:bg-[#2a2a40] transition-all z-10"
        >
          ⌖ CENTRE
        </button>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex gap-1 items-center z-10">
        <button
          onClick={() => zoom(-1)}
          className="w-7 h-7 bg-[#12122a] border border-[#2e2e58] rounded-md text-[#8888c0] font-bold hover:bg-[#1a1a32] transition-all flex items-center justify-center text-sm"
        >−</button>
        <div className="px-2 py-0.5 bg-[#0a0a1e] border border-[#1e1e3a] rounded-md text-[#5858a0] text-[9px] min-w-[36px] text-center">
          {Math.round(zoomLevel * 100)}%
        </div>
        <button
          onClick={() => zoom(1)}
          className="w-7 h-7 bg-[#12122a] border border-[#2e2e58] rounded-md text-[#8888c0] font-bold hover:bg-[#1a1a32] transition-all flex items-center justify-center text-sm"
        >+</button>
      </div>
    </div>
  );
}