import React, { useEffect, useRef } from 'react';

const LiveECGCanvas = ({ heartRate = 72, isAbnormal = false, width = 360, height = 90 }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let x = 0;
    const step = 2;
    const points = [];
    let phase = 0;

    // ECG P-QRS-T generator function
    const getECGValue = (p) => {
      p = p % 1.0;
      const baseline = height / 2;

      // P wave (at p ~ 0.15)
      if (p > 0.10 && p < 0.20) {
        return baseline - 6 * Math.sin(((p - 0.10) / 0.10) * Math.PI);
      }
      // Q dip (at p ~ 0.25)
      if (p > 0.24 && p < 0.27) {
        return baseline + 7 * Math.sin(((p - 0.24) / 0.03) * Math.PI);
      }
      // R peak (tall spike at p ~ 0.28)
      if (p >= 0.27 && p <= 0.33) {
        const spike = isAbnormal ? 42 : 32;
        return baseline - spike * Math.sin(((p - 0.27) / 0.06) * Math.PI);
      }
      // S dip (at p ~ 0.34)
      if (p > 0.33 && p < 0.38) {
        return baseline + 12 * Math.sin(((p - 0.33) / 0.05) * Math.PI);
      }
      // T wave (at p ~ 0.50)
      if (p > 0.45 && p < 0.60) {
        return baseline - 10 * Math.sin(((p - 0.45) / 0.15) * Math.PI);
      }
      // Isoelectric baseline with slight physiological noise
      return baseline + (Math.random() - 0.5) * 1.5;
    };

    const render = () => {
      // Semi-clear trail to produce glowing sweep line
      ctx.fillStyle = 'rgba(10, 20, 40, 0.15)';
      ctx.fillRect(0, 0, width, height);

      // Grid lines
      ctx.strokeStyle = 'rgba(50, 230, 224, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let gx = 0; gx < width; gx += 20) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      for (let gy = 0; gy < height; gy += 15) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      ctx.stroke();

      // Advance ECG phase based on live heart rate
      const beatsPerSec = heartRate / 60.0;
      phase += (beatsPerSec * 0.016);

      const y = getECGValue(phase);
      points.push({ x, y });
      if (points.length > width / step) {
        points.shift();
      }

      // Draw ECG curve
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isAbnormal ? '#FF526B' : '#32E6E0';
      ctx.shadowBlur = isAbnormal ? 10 : 8;
      ctx.shadowColor = isAbnormal ? '#FF526B' : '#32E6E0';

      for (let i = 0; i < points.length; i++) {
        const pt = points[i];
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Lead cursor head
      if (points.length > 0) {
        const lastPt = points[points.length - 1];
        ctx.beginPath();
        ctx.arc(lastPt.x, lastPt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#FFFFFF';
        ctx.fill();
      }

      x += step;
      if (x > width) {
        x = 0;
        points.length = 0; // wrap around
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [heartRate, isAbnormal, width, height]);

  return (
    <div className="relative bg-[#071124] rounded-lg border border-space-border/60 p-1.5 shadow-inner overflow-hidden">
      <div className="absolute top-2 left-3 flex items-center gap-2 z-10">
        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: isAbnormal ? '#FF526B' : '#32E6E0' }} />
        <span className="text-[10px] font-mono font-bold tracking-wider" style={{ color: isAbnormal ? '#FF526B' : '#32E6E0' }}>
          LEAD II • {heartRate} BPM {isAbnormal ? '• TACHYCARDIA' : '• NORMAL SINUS'}
        </span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-auto rounded block"
      />
    </div>
  );
};

export default LiveECGCanvas;
