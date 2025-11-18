import React, { useEffect, useState } from "react";

// Lightweight client-only wrapper around <model-viewer>
// Looks for a GLB at the provided `src` path (example: `/3dd-model/model.glb`).
// Falls back to a plain image element if model-viewer isn't available.
export default function ModelViewer({ src = "/3d-model/stylizedhumanheart.glb", alt = "3D model", className = "", style = {}, rotationPerSecond = 2.5, interactiveOnHover = true }) {
  const [ready, setReady] = useState(false);
  const modelRef = React.useRef(null);

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

    return () => {};
  }, []);

  // When the model-viewer script is ready, update the web component attributes
  // via the element ref. This must be called as a top-level hook, not inside
  // conditional rendering, so we use a separate useEffect that depends on
  // `ready`, `src`, and `alt`.
  useEffect(() => {
    if (!ready) return;
    const el = modelRef.current;
    if (!el) return;
    // Set both attributes and properties to ensure the web component
    // recognizes the values regardless of how it was implemented.
    try {
      el.setAttribute("src", src);
      el.setAttribute("alt", alt);
      el.setAttribute("camera-controls", "");
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
        el.cameraControls = true;
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

    // Interactive behavior: enable camera controls on hover. We DO NOT pause
    // `auto-rotate` when the user drags; the model should continue rotating
    // while the user interacts.
    let onEnter, onLeave;
    if (typeof interactiveOnHover !== 'undefined' ? interactiveOnHover : true) {
      onEnter = () => {
        try { el.setAttribute('camera-controls', ''); el.cameraControls = true; } catch (e) {}
      };
      onLeave = () => {
        try { el.removeAttribute('camera-controls'); el.cameraControls = false; } catch (e) {}
      };

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
      // Add listeners on the element
      el.addEventListener('wheel', wheelHandler, { passive: false });
      el.addEventListener('touchstart', touchStartHandler, { passive: false });
      // Safari supports gesturestart/gesturechange for pinch; block those too
      el.addEventListener('gesturestart', gestureHandler);
      el.addEventListener('gesturechange', gestureHandler);

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
        try { el.removeEventListener('wheel', wheelHandler); } catch (_) {}
        try { el.removeEventListener('touchstart', touchStartHandler); } catch (_) {}
        try { el.removeEventListener('gesturestart', gestureHandler); } catch (_) {}
        try { el.removeEventListener('gesturechange', gestureHandler); } catch (_) {}
        try { window.removeEventListener('wheel', wheelHandler, { capture: true }); } catch (_) {}
        try { window.removeEventListener('touchstart', touchStartHandler, { capture: true }); } catch (_) {}
        try { window.removeEventListener('gesturestart', gestureHandler, { capture: true }); } catch (_) {}
        try { window.removeEventListener('gesturechange', gestureHandler, { capture: true }); } catch (_) {}
      } catch (_) {}
    };
  }, [ready, src, alt, rotationPerSecond, interactiveOnHover]);

  // Render model-viewer when ready, otherwise show a placeholder image if present
  if (ready) {
    return (
      // eslint-disable-next-line react/no-unknown-property
      // eslint-disable-next-line @next/next/no-img-element
      <model-viewer ref={modelRef} className={className} style={style} />
    );
  }

  // Fallback: try to show a static preview (assumes a JPG/PNG with same base name exists)
  const fallbackImage = src.replace(/\.gltf?$|\.glb$/i, ".jpg");
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={fallbackImage} alt={alt} className={className} style={style} />
  );
}
