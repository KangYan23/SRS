"use client";

import { motion } from "framer-motion";

function FloatingPaths({
    position
}) {
    const total = 36;
    // Clinic-like palette: soft blues/teals/greens with muted tones
    const palette = [
        '#0f172a', // deep slate (anchor)
        '#0ea5a4', // teal
        '#60a5fa', // soft blue
        '#34d399', // mint green
        '#7dd3fc', // light sky
        '#93c5fd', // calm blue
    ];

    const paths = Array.from({ length: total }, (_, i) => {
        const colorBase = palette[i % palette.length];
        // Use randomness per-path for a lively, non-repeating background
        const r1 = Math.random();
        const r2 = Math.random();
        const r3 = Math.random();

        // Slightly vary opacity and width across the set
        const alpha = 0.08 + (r1 * 0.28); // ~0.08 -> 0.36

        // SVG canvas dims
        const width = 696;
        const height = 316;

        // Choose a random direction for this path to follow while keeping a "flow" rhythm
        const directions = [
            'leftToRight',
            'rightToLeft',
            'topToBottom',
            'bottomToTop',
            'diagTLBR',
            'diagBRTL',
        ];
        const dir = directions[Math.floor(r3 * directions.length)];

        // compute start/end based on chosen direction, with gentle jitter
        let startX, startY, endX, endY;
        const basePos = (i / (total - 1));
        const jitterY = (r1 - 0.5) * height * 0.25;
        const jitterX = (r2 - 0.5) * width * 0.2;

        if (dir === 'leftToRight') {
            startX = -200 + r1 * 40;
            startY = Math.max(0, Math.min(height, basePos * height + jitterY - position * 12));
            endX = width + 200 - r2 * 40;
            endY = Math.max(0, Math.min(height, basePos * height + jitterY * 0.6 + position * 12));
        } else if (dir === 'rightToLeft') {
            startX = width + 200 - r1 * 40;
            startY = Math.max(0, Math.min(height, basePos * height + jitterY - position * 12));
            endX = -200 + r2 * 40;
            endY = Math.max(0, Math.min(height, basePos * height + jitterY * 0.6 + position * 12));
        } else if (dir === 'topToBottom') {
            startX = Math.max(0, Math.min(width, basePos * width + jitterX));
            startY = -200 + r1 * 40;
            endX = Math.max(0, Math.min(width, basePos * width + jitterX * 0.6));
            endY = height + 200 - r2 * 40;
        } else if (dir === 'bottomToTop') {
            startX = Math.max(0, Math.min(width, basePos * width + jitterX));
            startY = height + 200 - r1 * 40;
            endX = Math.max(0, Math.min(width, basePos * width + jitterX * 0.6));
            endY = -200 + r2 * 40;
        } else if (dir === 'diagTLBR') {
            startX = -200 + r1 * 40;
            startY = Math.max(0, Math.min(height, basePos * height * 0.6 + jitterY - 20));
            endX = width + 200 - r2 * 40;
            endY = Math.max(0, Math.min(height, basePos * height * 1.1 + jitterY + 20));
        } else { // diagBRTL
            startX = width + 200 - r1 * 40;
            startY = Math.max(0, Math.min(height, basePos * height * 1.1 + jitterY + 20));
            endX = -200 + r2 * 40;
            endY = Math.max(0, Math.min(height, basePos * height * 0.6 + jitterY - 20));
        }

        // control points vary to keep the flowing rhythm but differ per path
        const cp1x = startX + (width * (0.2 + r2 * 0.25));
        const cp2x = endX - (width * (0.2 + r1 * 0.25));
        const cp1y = startY + (r3 - 0.5) * 80;
        const cp2y = endY + (r2 - 0.5) * 80;

        const d = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

        return {
            id: i,
            d,
            color: colorBase,
            width: 0.6 + r2 * 1.2,
            opacity: alpha,
            dir,
        };
    });

    return (
        <div className="absolute inset-0 pointer-events-none">
                <svg
                className="w-full h-full text-black"
                viewBox="0 0 696 316"
                preserveAspectRatio="none"
                fill="none">
                <title>Background Paths</title>
                {paths.map((path) => (
                    <motion.path
                        key={path.id}
                        d={path.d}
                        stroke={path.color}
                        strokeWidth={path.width}
                        strokeOpacity={path.opacity}
                        initial={{ pathLength: 0.3, opacity: 0.6 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.9, 0.3],
                            pathOffset: [0, 1, 0],
                        }}
                        transition={{
                            duration: 14 + Math.random() * 12,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }} />
                ))}
            </svg>
        </div>
    );
}

export function BackgroundPaths({ children }) {
    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-white">
            <div className="absolute inset-0">
                <FloatingPaths position={1} />
                <FloatingPaths position={-1} />
            </div>
            <div className="relative z-10 w-full">
                {children}
            </div>
        </div>
    );
}
