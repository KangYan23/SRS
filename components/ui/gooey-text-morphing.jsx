"use client";;
import * as React from "react";
import { cn } from "@/lib/utils";

export function GooeyText({
  texts,
  // Increase defaults for a slower, smoother morph
  morphTime = 2.8,
  cooldownTime = 0.6,
  className,
  textClassName
}) {
  const text1Ref = React.useRef(null);
  const text2Ref = React.useRef(null);
  const indexRef = React.useRef(texts && texts.length ? texts.length - 1 : 0);
  const rafRef = React.useRef(null);

  React.useEffect(() => {
    // Ensure indexRef is valid if texts length changed
    if (!texts || texts.length === 0) return;
    if (indexRef.current >= texts.length) indexRef.current = texts.length - 1;

    let time = new Date();
    let morph = 0;
    let cooldown = cooldownTime;

    const setMorph = (fraction) => {
      if (!text1Ref.current || !text2Ref.current) return;
      const f = Math.max(0, Math.min(1, fraction));
      const blurMax = 8;
      const blur2 = (1 - f) * blurMax;
      const blur1 = f * blurMax;
      const op2 = Math.pow(f, 0.9);
      const op1 = Math.pow(1 - f, 0.9);

      text2Ref.current.style.filter = `blur(${blur2}px)`;
      text2Ref.current.style.opacity = `${Math.round(op2 * 100)}%`;

      text1Ref.current.style.filter = `blur(${blur1}px)`;
      text1Ref.current.style.opacity = `${Math.round(op1 * 100)}%`;
    };

    const doCooldown = () => {
      morph = 0;
      if (text1Ref.current && text2Ref.current) {
        text2Ref.current.style.filter = "";
        text2Ref.current.style.opacity = "100%";
        text1Ref.current.style.filter = "";
        text1Ref.current.style.opacity = "0%";
      }
    };

    const doMorph = () => {
      morph -= cooldown;
      cooldown = 0;
      let fraction = morph / morphTime;

      if (fraction > 1) {
        cooldown = cooldownTime;
        fraction = 1;
      }

      setMorph(fraction);
    };

    // Initialize text contents if empty (prevents visible reset on re-render)
    if (text1Ref.current && text2Ref.current) {
      if (!text1Ref.current.textContent) {
        text1Ref.current.textContent = texts[indexRef.current % texts.length];
      }
      if (!text2Ref.current.textContent) {
        text2Ref.current.textContent = texts[(indexRef.current + 1) % texts.length];
      }
    }

    function animate() {
      rafRef.current = requestAnimationFrame(animate);
      const newTime = new Date();
      const shouldIncrementIndex = cooldown > 0;
      const dt = (newTime.getTime() - time.getTime()) / 1000;
      time = newTime;

      cooldown -= dt;

      if (cooldown <= 0) {
        if (shouldIncrementIndex) {
          indexRef.current = (indexRef.current + 1) % texts.length;
          if (text1Ref.current && text2Ref.current) {
            text1Ref.current.textContent = texts[indexRef.current % texts.length];
            text2Ref.current.textContent = texts[(indexRef.current + 1) % texts.length];
          }
        }
        doMorph();
      } else {
        doCooldown();
      }
    }

    // Start the loop (cancel any previous frame to avoid duplicates)
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [texts, morphTime, cooldownTime]);

  return (
    <div className={cn("relative", className)}>
      <svg className="absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id="threshold">
            <feColorMatrix
              in="SourceGraphic"
              type="matrix"
              values="1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 255 -140" />
          </filter>
        </defs>
      </svg>
      <div
        className="flex items-center justify-center"
        style={{ filter: "url(#threshold)" }}>
        {/* Clinic-vibe gradient (teal -> soft blue). Use background-clip:text to fill text while keeping filter effects. */}
        <span
          ref={text1Ref}
          className={cn(
            "absolute inline-block select-none text-center text-6xl md:text-[60pt]",
            textClassName
          )}
          style={{
            background: "linear-gradient(90deg,#0ea5a4,#60a5fa)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        />
        <span
          ref={text2Ref}
          className={cn(
            "absolute inline-block select-none text-center text-6xl md:text-[60pt]",
            textClassName
          )}
          style={{
            background: "linear-gradient(90deg,#0ea5a4,#60a5fa)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
          }}
        />
      </div>
    </div>
  );
}