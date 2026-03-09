"use client";

import { motion } from "framer-motion";
import { ZapIcon, GlobeIcon, ShieldCheckIcon, SmartphoneIcon } from "lucide-react";

export default function RevolvingSection() {
    const features = [
        { icon: <ZapIcon className="h-6 w-6 text-primary" />, text: "Instant WebSocket Tracking" },
        { icon: <GlobeIcon className="h-6 w-6 text-blue-400" />, text: "Clanker & Doppler Factories" },
        { icon: <ShieldCheckIcon className="h-6 w-6 text-green-400" />, text: "Bankr Integration" },
        { icon: <SmartphoneIcon className="h-6 w-6 text-purple-400" />, text: "Direct Telegram Alerts" },
    ];

    // Duplicate for the infinite scroll effect
    const loopingFeatures = [...features, ...features, ...features];

    return (
        <section id="features" className="w-full py-16 border-y border-border/20 bg-background/40 backdrop-blur-sm overflow-hidden mb-24 hidden md:block">
            <div className="relative flex whitespace-nowrap">
                <motion.div
                    animate={{ x: ["0%", "-33.33%"] }}
                    transition={{ ease: "linear", duration: 20, repeat: Infinity }}
                    className="flex items-center gap-16 px-8"
                >
                    {loopingFeatures.map((feat, i) => (
                        <div key={i} className="flex items-center gap-4 text-xl font-medium tracking-tight text-foreground/80">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-inner">
                                {feat.icon}
                            </div>
                            {feat.text}
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
