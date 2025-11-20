import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import MovingBorder from "@/components/ui/moving-border";

// Lightweight client-only wrapper around <model-viewer>
// Looks for a GLB at the provided `src` path (example: `/3dd-model/model.glb`).
// Falls back to a plain image element if model-viewer isn't available.
export default function ModelViewer({ src = "/3d-model/stylizedhumanheart.glb", alt = "3D model", className = "", style = {}, rotationPerSecond = 2.5, interactiveOnHover = true, cameraControls = true, onUserInteract = null }) {
  const [ready, setReady] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const modelRef = React.useRef(null);
  const wrapperRef = React.useRef(null);

  // Ensure the viewer fills its parent by default; merge explicit styles
  const mergedStyle = Object.assign({ width: '100%', height: '100%', display: 'block', pointerEvents: 'auto' }, style || {});

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // If model-viewer script not present, inject it
    const existing = document.querySelector('script[src*="model-viewer"]');
    if (!existing) {
      const s = document.createElement("script");
      s.type = "module";
      s.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      s.onload = () => setReady(true);
      s.onerror = () => setReady(false);
      document.head.appendChild(s);
    } else {
      setReady(true);
    }

    // Preload the GLB and a fallback poster image to reduce first-load lag
    try {
      const fallbackImage = src.replace(/\.gltf?$|\.glb$/i, ".jpg");
      // preload model if not already present
      if (!document.querySelector(`link[rel="preload"][href="${src}"]`)) {
        const l = document.createElement('link');
        l.rel = 'preload';
        l.href = src;
        l.as = 'fetch';
        l.crossOrigin = 'anonymous';
        document.head.appendChild(l);
      }
      // preload poster image
      if (!document.querySelector(`link[rel="preload"][href="${fallbackImage}"]`)) {
        const lp = document.createElement('link');
        lp.rel = 'preload';
        lp.href = fallbackImage;
        lp.as = 'image';
        document.head.appendChild(lp);
      }
    } catch (_) {}

    return () => {};
  }, []);

  // Update the web component attributes/properties and attach listeners.
  // We run this effect immediately so attributes are present on the element
  // before the model-viewer script initializes; when the script defines the
  // element it will pick up those attributes and start rotating immediately.
  useEffect(() => {
    const el = modelRef.current;
    if (!el) return;
    // Set both attributes and properties to ensure the web component
    // recognizes the values regardless of how it was implemented.
    try {
      el.setAttribute("src", src);
      el.setAttribute("alt", alt);
      if (cameraControls) {
        // Ensure persistent camera controls when requested by the parent.
        try { el.setAttribute("camera-controls", ""); el.cameraControls = true; } catch(_) {}
      } else {
        try { el.removeAttribute('camera-controls'); el.cameraControls = false; } catch(_) {}
      }
      el.setAttribute("auto-rotate", "");
      el.setAttribute("rotation-per-second", String(rotationPerSecond));
      el.setAttribute("exposure", "1");
      el.setAttribute("shadow-intensity", "1");
      // Disable the built-in interaction hint/animation (hand/arrow prompt)
      el.setAttribute("interaction-prompt", "none");

      // Also set properties (camelCase) — many web components prefer properties.
      try {
        el.src = src;
        el.alt = alt;
        try { el.cameraControls = Boolean(cameraControls); } catch(_) {}
        el.autoRotate = true;
        el.rotationPerSecond = Number(rotationPerSecond);
        el.exposure = 1;
        el.shadowIntensity = 1;
        try { el.interactionPrompt = 'none'; } catch (_) {}
      } catch (propErr) {
        // ignore property set errors
      }
    } catch (e) {
      // ignore
    }

    // Interactive behavior: if the parent explicitly requests persistent
    // camera controls via `cameraControls`, keep them enabled. Otherwise,
    // if `interactiveOnHover` is true, enable camera controls only while
    // the pointer is over the element.
    let onEnter, onLeave;
    const wantHover = typeof interactiveOnHover !== 'undefined' ? interactiveOnHover : true;
    if (cameraControls) {
      try { el.setAttribute('camera-controls', ''); el.cameraControls = true; } catch(_) {}
    } else if (wantHover) {
      onEnter = () => { try { el.setAttribute('camera-controls', ''); el.cameraControls = true; } catch (e) {} };
      onLeave = () => { try { el.removeAttribute('camera-controls'); el.cameraControls = false; } catch (e) {} };
      el.addEventListener('pointerenter', onEnter);
      el.addEventListener('pointerleave', onLeave);
    }

    // Prevent zooming: block wheel zoom and multi-touch pinch gestures while
    // still allowing single-pointer rotation. We add non-passive listeners so
    // we can call preventDefault().
    const wheelHandler = (ev) => {
      try { ev.preventDefault(); ev.stopPropagation(); } catch (_) {}
    };
    const touchStartHandler = (ev) => {
      try {
        // If more than one touch is present, it's a pinch; prevent it.
        if (ev.touches && ev.touches.length > 1) {
          ev.preventDefault();
        }
      } catch (_) {}
    };
    const gestureHandler = (ev) => { try { ev.preventDefault(); } catch (_) {} };

    try {
      // model-viewer emits a 'load' event when the model finished loading
      let loadedHandler = null;
      loadedHandler = () => { try { setModelLoaded(true); } catch(_) {} };
      el.addEventListener('load', loadedHandler);
      // Add listeners on the element
      // Add listeners on the element in the capture phase to intercept
      // gestures before the web component's internal handlers run.
      el.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
      el.addEventListener('touchstart', touchStartHandler, { passive: false, capture: true });
      // Safari supports gesturestart/gesturechange for pinch; block those too
      el.addEventListener('gesturestart', gestureHandler, { capture: true });
      el.addEventListener('gesturechange', gestureHandler, { capture: true });

      // If a parent wants early notification of pointer interactions,
      // attach capture-phase pointer listeners directly to the element.
      // This helps the parent act before the web component internal handlers
      // and avoids potential race conditions that cause small nudges.
      let _pd = null;
      let _pu = null;
      if (onUserInteract && typeof onUserInteract === 'function') {
        _pd = (ev) => { try { onUserInteract({ type: 'pointerdown', originalEvent: ev }); } catch(_) {} };
        _pu = (ev) => { try { onUserInteract({ type: 'pointerup', originalEvent: ev }); } catch(_) {} };
        el.addEventListener('pointerdown', _pd, { capture: true });
        el.addEventListener('pointerup', _pu, { capture: true });
      }

      // Also add capture-phase listeners on window/document to block gestures
      // before other handlers (model-viewer may listen at a higher level).
      if (typeof window !== 'undefined') {
        window.addEventListener('wheel', wheelHandler, { passive: false, capture: true });
        window.addEventListener('touchstart', touchStartHandler, { passive: false, capture: true });
        window.addEventListener('gesturestart', gestureHandler, { capture: true });
        window.addEventListener('gesturechange', gestureHandler, { capture: true });
      }
    } catch (_) {}

    // Cleanup listeners when effect re-runs or component unmounts
    return () => {
      try {
        if (onEnter) el.removeEventListener('pointerenter', onEnter);
        if (onLeave) el.removeEventListener('pointerleave', onLeave);
        try { if (typeof loadedHandler === 'function') el.removeEventListener('load', loadedHandler); } catch(_) {}
        try { el.removeEventListener('wheel', wheelHandler, { capture: true }); } catch (_) {}
        try { el.removeEventListener('touchstart', touchStartHandler, { capture: true }); } catch (_) {}
        try { el.removeEventListener('gesturestart', gestureHandler, { capture: true }); } catch (_) {}
        try { el.removeEventListener('gesturechange', gestureHandler, { capture: true }); } catch (_) {}
        try { if (_pd) el.removeEventListener('pointerdown', _pd, { capture: true }); } catch (_) {}
        try { if (_pu) el.removeEventListener('pointerup', _pu, { capture: true }); } catch (_) {}
        try { window.removeEventListener('wheel', wheelHandler, { capture: true }); } catch (_) {}
        try { window.removeEventListener('touchstart', touchStartHandler, { capture: true }); } catch (_) {}
        try { window.removeEventListener('gesturestart', gestureHandler, { capture: true }); } catch (_) {}
        try { window.removeEventListener('gesturechange', gestureHandler, { capture: true }); } catch (_) {}
      } catch (_) {}
    };
  }, [src, alt, rotationPerSecond, interactiveOnHover, cameraControls, onUserInteract]);

  // While the real 3D mesh is still loading, animate the wrapper element
  // with a lightweight CSS transform loop so the user sees immediate motion.
  // Once `modelLoaded` is true we remove the transform and let the
  // web component's auto-rotate take over.
  React.useEffect(() => {
    let rafId = null;
    const ref = wrapperRef.current;
    let angle = 0;
    function loop() {
      angle = (angle + 1.8) % 360;
      if (ref && !modelLoaded) {
        try { ref.style.transform = `rotateY(${angle}deg)`; } catch (_) {}
        rafId = requestAnimationFrame(loop);
      }
    }
    if (!modelLoaded && ref) {
      rafId = requestAnimationFrame(loop);
    }
    if (modelLoaded && ref) {
      try { ref.style.transform = 'none'; } catch (_) {}
    }
    return () => { if (rafId) cancelAnimationFrame(rafId); };
  }, [modelLoaded]);

  // Always render the <model-viewer> element so attributes are present on first
  // paint; also render a small loading overlay until the model has been
  // reported loaded by the web component. We set a `poster` so a low-res image
  // appears while the GLB downloads, minimizing perceived lag.
  const fallbackImage = src.replace(/\.gltf?$|\.glb$/i, ".jpg");
  // Add a subtle lighter backdrop behind the model so the heart sits on a lighter panel
  const backdropStyle = {
    position: 'absolute',
    inset: 0,
    borderRadius: '12px',
    pointerEvents: 'none',
    zIndex: 12,
    background: 'radial-gradient(circle at 40% 40%, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0.00) 70%)'
  };
  // Frame style: thin rectangle lines that extend outside the nominal viewer
  // bounds so the 'view frame' appears larger and can be nudged up/left.
  const frameStyle = {
    position: 'absolute',
    // extend beyond by 40px on each side
    left: '-48px',
    top: '-48px',
    width: 'calc(100% + 96px)',
    height: 'calc(100% + 96px)',
    borderRadius: '10px',
    border: '2px solid rgba(10,10,10,0.92)',
    pointerEvents: 'none',
    zIndex: 11,
    boxSizing: 'border-box',
  };

  // ensure the model-viewer sits above the backdrop and other UI elements
  const modelStyle = Object.assign({}, mergedStyle, {
    // very high z-index to ensure the model is visually on top
    zIndex: 9999,
    position: 'relative',
    background: 'transparent',
    filter: 'drop-shadow(0 30px 60px rgba(2,6,23,0.35))',
    // Allow the model to render beyond its logical box and avoid
    // browser clipping; also improve 3D rendering hints.
    maxWidth: 'none',
    maxHeight: 'none',
    transformStyle: 'preserve-3d',
    willChange: 'transform',
  });

  // Bigger, layered particle: larger cyan halo, longer blur, and pulsing core
  const dotWrapperStyle = {
    width: 36,
    height: 36,
    position: 'relative',
    pointerEvents: 'none',
    transform: 'translateZ(0)',
  };
  const haloStyle = {
    position: 'absolute',
    inset: 0,
    borderRadius: 9999,
    background:
      'radial-gradient(circle at 50% 40%, rgba(34,211,238,0.9) 0%, rgba(34,211,238,0.45) 28%, rgba(6,182,212,0.12) 55%, transparent 80%)',
    filter: 'blur(12px)',
    opacity: 0.98,
    pointerEvents: 'none',
  };
  const coreStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 12,
    height: 12,
    transform: 'translate(-50%,-50%)',
    borderRadius: 9999,
    background: '#ecfeff',
    boxShadow: '0 8px 28px rgba(6,182,212,0.45)',
    pointerEvents: 'none',
  };

  return (
    // eslint-disable-next-line react/no-unknown-property
    // eslint-disable-next-line @next/next/no-img-element
    // Make the wrapper allow overflow so parts of the model that extend
    // outside the nominal viewer bounds are still visible instead of
    // being clipped. Center the viewer inside the wrapper and raise its
    // stacking context so it appears above nearby panels.
    <div style={{ width: mergedStyle.width, height: mergedStyle.height, position: 'relative', overflow: 'visible', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
      <div style={frameStyle} aria-hidden="true">
        <MovingBorder duration={7000} rx={10} ry={10}>
          <div style={dotWrapperStyle}>
            <div style={haloStyle} />
            <motion.div
              style={coreStyle}
              animate={{ scale: [1, 1.25, 1], opacity: [1, 0.85, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </MovingBorder>
      </div>
      <div style={backdropStyle} />
      <model-viewer
        ref={modelRef}
        className={className}
        style={modelStyle}
        src={src}
        alt={alt}
        poster={fallbackImage}
        auto-rotate
        rotation-per-second={String(rotationPerSecond)}
        interaction-prompt="none"
        exposure={1}
      />
      {!modelLoaded && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div style={{ width: 48, height: 48, borderRadius: 24, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(0,0,0,0.12)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v4" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 18v4" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 4.93l2.83 2.83" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.24 16.24l2.83 2.83" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 12h4" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M18 12h4" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M4.93 19.07l2.83-2.83" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M16.24 7.76l2.83-2.83" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
        </div>
      )}
    </div>
  );
}
