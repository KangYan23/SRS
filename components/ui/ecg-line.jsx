"use client";

import { motion } from "framer-motion";

export function ECGLine({ className = "" }) {
    // Path definition
    // We'll keep it within the 0-1200 range for simplicity, 
    // but the animation will handle the "entering" and "exiting".

    // 0-400: Flat
    // 400-800: ECG Complex
    // 800-1200: Flat

    const pathData = `
    M 0 50 
    L 450 50 
    L 460 50 L 470 45 L 480 50 L 490 50   
    L 500 50 L 505 52 L 510 20 L 515 90 L 520 50 L 530 50 
    L 540 50 L 550 42 L 570 55 L 590 50
    L 1200 50
  `;

    return (
        <div className={`w-full h-40 relative flex items-center justify-center overflow-hidden ${className}`}>
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 1200 100"
                preserveAspectRatio="none"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="overflow-visible"
            >
                {/* Background Track (Faint) */}
                <path
                    d={pathData}
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-gray-300 opacity-20"
                />

                {/* Traveling Pulse */}
                <motion.path
                    d={pathData}
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-gray-600 drop-shadow-md"
                    initial={{ pathLength: 0, pathOffset: 0, opacity: 0 }}
                    animate={{
                        pathLength: 0.15, // Length of the traveling segment (15% of total path)
                        pathOffset: [0, 1], // Move from start to end
                        opacity: [0, 1, 1, 0] // Fade in at start, fade out at end
                    }}
                    transition={{
                        duration: 4,
                        ease: "linear",
                        repeat: Infinity,
                        repeatDelay: 0
                    }}
                />
            </svg>

            {/* Vignette for smooth edges */}
            <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white opacity-90 pointer-events-none" />
        </div>
    );
}
