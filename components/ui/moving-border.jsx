"use client";
import React, { useRef } from "react";
import { useAnimationFrame, useMotionValue } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Core moving-border: animates its child along a rectangle path (the element bounds)
 */
// Default duration increased so the particle moves more slowly by default.
// Added `trailCount` and `trailSpacing` to render faint trailing dots for a visible motion trail.
const MovingBorder = ({ children, duration = 6000, rx = 12, ry = 12, className = "", trailCount = 2, trailSpacing = 0.08, ...otherProps }) => {
  const pathRef = useRef(null);
  const progress = useMotionValue(0);
  const mainRef = useRef(null);
  const trailRefs = useRef([]);

  useAnimationFrame((time) => {
    const path = pathRef.current;
    const length = path?.getTotalLength?.();
    if (!path || !length) return;

    const pxPerMillisecond = length / duration;
    const val = (time * pxPerMillisecond) % length;
    progress.set(val);

    // main particle position
    try {
      const mainPt = path.getPointAtLength(val);
      if (mainRef.current) {
        mainRef.current.style.left = `${mainPt.x}px`;
        mainRef.current.style.top = `${mainPt.y}px`;
      }

      // trailing dots
      for (let i = 0; i < trailCount; i++) {
        const el = trailRefs.current[i];
        if (!el) continue;
        const offsetFraction = trailSpacing * (i + 1);
        const offsetPx = offsetFraction * length;
        let p = (val - offsetPx) % length;
        if (p < 0) p += length;
        const pt = path.getPointAtLength(p);
        el.style.left = `${pt.x}px`;
        el.style.top = `${pt.y}px`;
      }
    } catch (e) {
      // defensive: ignore transient errors during initial mount
    }
  });

  // We'll position the main particle and trail elements imperatively
  // in the animation frame loop to avoid dynamically creating hooks.

  return (
    <div className={className} style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none"
        width="100%"
        height="100%"
        {...otherProps}
      >
        <rect ref={pathRef} fill="none" width="100%" height="100%" rx={rx} ry={ry} />
      </svg>

      {/* render trailing faint dots (DOM refs updated in RAF) */}
      {Array.from({ length: trailCount }).map((_, idx) => (
        <div
          key={`trail-${idx}`}
          ref={(el) => (trailRefs.current[idx] = el)}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            width: 12 - idx * 2,
            height: 12 - idx * 2,
            borderRadius: 99,
            background: 'rgba(34,211,238,0.32)',
            filter: 'blur(10px)',
            opacity: Math.max(0.18, 0.6 - idx * 0.18),
            transform: 'translate(-50%,-50%)',
          }}
        />
      ))}

      {/* main particle (user-supplied children) */}
      <div ref={mainRef} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", transform: 'translate(-50%,-50%)' }}>
        {children}
      </div>
    </div>
  );
};

// alias for the effects file name
const MovingBorderEffects = MovingBorder;

/**
 * Small Button wrapper that demonstrates a border particle using MovingBorder.
 * Exported as `Button` for convenience.
 */
function Button({
  borderRadius = "1.75rem",
  children,
  as: Component = "button",
  containerClassName,
  borderClassName,
  duration = 2000,
  className,
  ...otherProps
}) {
  return (
    <Component
      className={cn("bg-transparent relative p-[1px] overflow-hidden", containerClassName)}
      style={{ borderRadius }}
      {...otherProps}
    >
      <div className="absolute inset-0" style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}>
        <MovingBorder duration={duration} rx="30%" ry="30%">
          <div className={cn("w-3 h-3 rounded-full bg-white/90 shadow-md", borderClassName)} />
        </MovingBorder>
      </div>

      <div
        className={cn(
          "relative bg-white/80 border border-slate-200 backdrop-blur text-slate-900 flex items-center justify-center w-full h-full text-sm",
          className
        )}
        style={{ borderRadius: `calc(${borderRadius} * 0.96)` }}
      >
        {children}
      </div>
    </Component>
  );
}

export default MovingBorder;
export { MovingBorder, MovingBorderEffects, Button };
