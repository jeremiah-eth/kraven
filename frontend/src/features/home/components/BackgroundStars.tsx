"use client";

import { useEffect, useState } from "react";

export default function BackgroundStars() {
    const [stars, setStars] = useState<{ id: number; top: string; left: string; size: string; animationDuration: string }[]>([]);

    useEffect(() => {
        // Generate random stars only on the client to avoid hydration mismatch
        const newStars = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            size: `${Math.random() * 2 + 1}px`,
            animationDuration: `${Math.random() * 3 + 2}s`
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#070707]">
            {/* Subtle radial gradient pointing to the center */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]" />

            <div className="absolute inset-0">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white/40 shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        style={{
                            top: star.top,
                            left: star.left,
                            width: star.size,
                            height: star.size,
                            animation: `twinkle ${star.animationDuration} infinite ease-in-out alternate`
                        }}
                    />
                ))}
            </div>
            <style>{`
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(0.8); }
          100% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
        </div>
    );
}
