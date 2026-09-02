import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCw, RefreshCw, Maximize2, ZoomIn } from 'lucide-react';
import { getDefaultCorners, detectCardCorners } from '../utils/imageProcessing';

export default function CornerSelectorCanvas({
  imageObj,
  corners,
  onCornersChange,
  targetAspectRatio = 3.3 / 2.2
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [activeHandleIndex, setActiveHandleIndex] = useState(null);
  const [magnifier, setMagnifier] = useState(null); // { x, y, srcX, srcY }
  const [displayScale, setDisplayScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Local corners state for zero-latency 60FPS dragging - Declared at top!
  const [localCorners, setLocalCorners] = useState(corners);
  const throttleTimerRef = useRef(null);

  useEffect(() => {
    if (corners) setLocalCorners(corners);
  }, [corners]);

  // Initialize or fit canvas inside container
  const updateCanvas = useCallback(() => {
    if (!imageObj || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;

    const imgW = imageObj.naturalWidth || imageObj.width;
    const imgH = imageObj.naturalHeight || imageObj.height;

    // Available display dimensions
    const maxW = container.clientWidth - 32;
    const maxH = 520; // Max canvas height in edit view

    const scale = Math.min(maxW / imgW, maxH / imgH, 1);
    setDisplayScale(scale);

    const displayW = Math.round(imgW * scale);
    const displayH = Math.round(imgH * scale);

    canvas.width = displayW;
    canvas.height = displayH;

    // Clear canvas
    ctx.clearRect(0, 0, displayW, displayH);

    // Draw background image
    ctx.drawImage(imageObj, 0, 0, displayW, displayH);

    // Draw semi-transparent dark overlay outside the polygon
    const activeCorners = localCorners || corners;
    if (activeCorners && activeCorners.length === 4) {
      const displayCorners = activeCorners.map(c => ({
        x: c.x * scale,
        y: c.y * scale
      }));

      // Outer darkened mask
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(0, 0, displayW, displayH);

      // Clip out polygon
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(displayCorners[0].x, displayCorners[0].y);
      ctx.lineTo(displayCorners[1].x, displayCorners[1].y);
      ctx.lineTo(displayCorners[2].x, displayCorners[2].y);
      ctx.lineTo(displayCorners[3].x, displayCorners[3].y);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw bounding polygon line
      ctx.beginPath();
      ctx.moveTo(displayCorners[0].x, displayCorners[0].y);
      ctx.lineTo(displayCorners[1].x, displayCorners[1].y);
      ctx.lineTo(displayCorners[2].x, displayCorners[2].y);
      ctx.lineTo(displayCorners[3].x, displayCorners[3].y);
      ctx.closePath();
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Grid guide lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      // Thirds lines inside quad
      for (let t = 1; t <= 2; t++) {
        const frac = t / 3;
        // Vertical grid lines
        const top = {
          x: displayCorners[0].x * (1 - frac) + displayCorners[1].x * frac,
          y: displayCorners[0].y * (1 - frac) + displayCorners[1].y * frac
        };
        const bot = {
          x: displayCorners[3].x * (1 - frac) + displayCorners[2].x * frac,
          y: displayCorners[3].y * (1 - frac) + displayCorners[2].y * frac
        };
        ctx.beginPath();
        ctx.moveTo(top.x, top.y);
        ctx.lineTo(bot.x, bot.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw corner handles
      displayCorners.forEach((c, idx) => {
        const isActive = activeHandleIndex === idx;

        // Outer glow
        ctx.beginPath();
        ctx.arc(c.x, c.y, isActive ? 14 : 10, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? 'rgba(6, 182, 212, 0.4)' : 'rgba(99, 102, 241, 0.3)';
        ctx.fill();

        // Handle circle
        ctx.beginPath();
        ctx.arc(c.x, c.y, isActive ? 8 : 6, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#06b6d4' : '#6366f1';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }
  }, [imageObj, localCorners, corners, activeHandleIndex]);

  useEffect(() => {
    updateCanvas();
    window.addEventListener('resize', updateCanvas);
    return () => window.removeEventListener('resize', updateCanvas);
  }, [updateCanvas]);

  // Handle Dragging with Zero Lag
  const handlePointerDown = (e) => {
    if (!canvasRef.current || !localCorners || displayScale === 0) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check hit radius on corner handles (in display px)
    const hitRadius = 30;
    const hitIndex = localCorners.findIndex(c => {
      const dispX = c.x * displayScale;
      const dispY = c.y * displayScale;
      const dist = Math.hypot(mouseX - dispX, mouseY - dispY);
      return dist <= hitRadius;
    });

    if (hitIndex !== -1) {
      setActiveHandleIndex(hitIndex);
      updateMagnifier(mouseX, mouseY, localCorners[hitIndex]);
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (activeHandleIndex === null || !canvasRef.current || !localCorners) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const mouseY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

    // Convert display position to original image scale
    const realX = mouseX / displayScale;
    const realY = mouseY / displayScale;

    const newCorners = [...localCorners];
    newCorners[activeHandleIndex] = { x: realX, y: realY };
    setLocalCorners(newCorners);

    updateMagnifier(mouseX, mouseY, { x: realX, y: realY });

    // Smoothly throttle the parent image warp update
    if (!throttleTimerRef.current) {
      throttleTimerRef.current = setTimeout(() => {
        onCornersChange(newCorners);
        throttleTimerRef.current = null;
      }, 50);
    }
  };

  const handlePointerUp = (e) => {
    if (activeHandleIndex !== null) {
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
        throttleTimerRef.current = null;
      }
      // Immediate final commit
      if (localCorners) {
        onCornersChange(localCorners);
      }
      setActiveHandleIndex(null);
      setMagnifier(null);
      if (e.target.hasPointerCapture && e.target.hasPointerCapture(e.pointerId)) {
        e.target.releasePointerCapture(e.pointerId);
      }
    }
  };

  const updateMagnifier = (dispX, dispY, realCoord) => {
    setMagnifier({
      dispX,
      dispY,
      realX: realCoord.x,
      realY: realCoord.y
    });
  };

  const [isSnapping, setIsSnapping] = useState(false);

  const resetToAutoBounds = () => {
    if (!imageObj) return;
    setIsSnapping(true);
    const detected = detectCardCorners(imageObj);
    setLocalCorners(detected);
    onCornersChange(detected);
    setTimeout(() => setIsSnapping(false), 1200);
  };

  const resetToFullImage = () => {
    if (!imageObj) return;
    const imgW = imageObj.naturalWidth || imageObj.width;
    const imgH = imageObj.naturalHeight || imageObj.height;
    const full = [
      { x: 0, y: 0 },
      { x: imgW, y: 0 },
      { x: imgW, y: imgH },
      { x: 0, y: imgH }
    ];
    setLocalCorners(full);
    onCornersChange(full);
  };

  // Render Zoom Lens Loupe Canvas
  const renderLoupe = () => {
    if (!magnifier || !imageObj) return null;
    const loupeSize = 130;
    const zoomFactor = 2.5;

    // Create offscreen zoomed render
    const srcX = magnifier.realX;
    const srcY = magnifier.realY;

    const loupeCanvas = document.createElement('canvas');
    loupeCanvas.width = loupeSize;
    loupeCanvas.height = loupeSize;
    const ctx = loupeCanvas.getContext('2d');

    const sampleW = loupeSize / zoomFactor;
    const sampleH = loupeSize / zoomFactor;
    const sampleX = Math.max(0, Math.min(imageObj.width - sampleW, srcX - sampleW / 2));
    const sampleY = Math.max(0, Math.min(imageObj.height - sampleH, srcY - sampleH / 2));

    ctx.drawImage(
      imageObj,
      sampleX, sampleY, sampleW, sampleH,
      0, 0, loupeSize, loupeSize
    );

    // Center Crosshair
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(loupeSize / 2, 0);
    ctx.lineTo(loupeSize / 2, loupeSize);
    ctx.moveTo(0, loupeSize / 2);
    ctx.lineTo(loupeSize, loupeSize / 2);
    ctx.stroke();

    return (
      <div
        style={{
          position: 'absolute',
          left: Math.min(magnifier.dispX + 16, (containerRef.current?.clientWidth || 400) - 150),
          top: Math.max(10, magnifier.dispY - 140),
          width: `${loupeSize}px`,
          height: `${loupeSize}px`,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '3px solid #06b6d4',
          boxShadow: '0 8px 30px rgba(0,0,0,0.8), 0 0 15px rgba(6,182,212,0.6)',
          pointerEvents: 'none',
          zIndex: 50,
          background: '#000'
        }}
      >
        <img
          src={loupeCanvas.toDataURL()}
          alt="Loupe"
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className="glass-panel"
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div
        style={{
          position: 'relative',
          display: 'inline-block',
          background: 'rgba(0,0,0,0.3)',
          borderRadius: '12px',
          padding: '16px',
          overflow: 'hidden',
          border: '1px dashed var(--border-color)'
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            cursor: activeHandleIndex !== null ? 'grabbing' : 'crosshair',
            touchAction: 'none',
            borderRadius: '6px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
          }}
        />

        {renderLoupe()}
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <button
          className={`btn ${isSnapping ? 'btn-success' : 'btn-secondary'}`}
          onClick={resetToAutoBounds}
          style={{ transition: 'all 0.2s ease', minWidth: '180px' }}
        >
          <RefreshCw size={16} className={isSnapping ? 'animate-spin' : ''} />
          {isSnapping ? 'Card Edges Snapped!' : 'Auto Card Bounds'}
        </button>
        <button className="btn btn-secondary" onClick={resetToFullImage}>
          <Maximize2 size={16} /> Full Frame
        </button>
      </div>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
        <ZoomIn size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
        Drag corners to match the card edges. A magnifier will assist precise alignment.
      </p>
    </div>
  );
}
