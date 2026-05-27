import { useCallback, useId, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';

const SIZE = 220;
const STROKE = 10;
const R = (SIZE - STROKE) / 2;
const C = SIZE / 2;
const CIRC = 2 * Math.PI * R;

function clampRating(v) {
  return Math.min(10, Math.max(0, Math.round(v * 10) / 10));
}

function angleToRating(angleRad) {
  // 0 at top, clockwise → 0–10
  let a = angleRad + Math.PI / 2;
  if (a < 0) a += Math.PI * 2;
  return clampRating((a / (Math.PI * 2)) * 10);
}

function ratingToAngle(rating) {
  return (rating / 10) * Math.PI * 2 - Math.PI / 2;
}

function pointerToRating(clientX, clientY, rect) {
  const x = clientX - rect.left - C;
  const y = clientY - rect.top - C;
  return angleToRating(Math.atan2(y, x));
}

export default function CircularRatingDial({ value, onChange, defaultValue = 8 }) {
  const gradientId = useId();
  const dialRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [rating, setRating] = useState(() => clampRating(value ?? defaultValue));

  const display = useMotionValue(rating);
  const scale = useTransform(display, [0, 10], [0.92, 1.08]);

  const syncRating = useCallback(
    (next) => {
      const v = clampRating(next);
      setRating(v);
      onChange?.(v);
      animate(display, v, { duration: 0.12, ease: 'easeOut' });
    },
    [onChange, display]
  );

  const handlePointer = useCallback(
    (clientX, clientY) => {
      const rect = dialRef.current?.getBoundingClientRect();
      if (!rect) return;
      syncRating(pointerToRating(clientX, clientY, rect));
    },
    [syncRating]
  );

  const onPointerDown = (e) => {
    e.preventDefault();
    setDragging(true);
    dialRef.current?.setPointerCapture(e.pointerId);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e) => {
    setDragging(false);
    dialRef.current?.releasePointerCapture(e.pointerId);
  };

  const dashOffset = CIRC * (1 - rating / 10);
  const knobAngle = ratingToAngle(rating);
  const knobX = C + R * Math.cos(knobAngle);
  const knobY = C + R * Math.sin(knobAngle);

  return (
    <div className="flex flex-col items-center gap-3 select-none touch-none">
      <div
        ref={dialRef}
        className="relative cursor-grab active:cursor-grabbing"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={rating}
        aria-label="Drag around the circle to rate"
      >
        <svg width={SIZE} height={SIZE} className="rotate-0">
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          <circle
            cx={C}
            cy={C}
            r={R}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${C} ${C})`}
            className="transition-[stroke-dashoffset] duration-75"
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#12c956" />
              <stop offset="100%" stopColor="#43fe6d" />
            </linearGradient>
          </defs>
        </svg>

        <motion.div
          className="absolute w-5 h-5 rounded-full bg-accent-green border-2 border-bg-primary shadow-lg shadow-accent-green/40 pointer-events-none"
          style={{
            left: knobX - 10,
            top: knobY - 10,
            scale: dragging ? 1.2 : 1,
          }}
          layout
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.span
            style={{ scale }}
            className="font-mono text-5xl font-bold text-text-primary tracking-tighter tabular-nums"
          >
            {rating.toFixed(1)}
          </motion.span>
          <span className="text-metadata text-text-muted mt-1">out of 10</span>
        </div>
      </div>
      <p className="text-xs text-text-muted text-center max-w-[200px]">
        Drag the ring to set your score — no typing needed
      </p>
    </div>
  );
}
