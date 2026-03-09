"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { BotIcon, ChevronRightIcon, BellRingIcon } from "lucide-react";

export default function Hero() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const handleJoinWaitlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            toast.error("Please enter a valid email address.");
            return;
        }

        setLoading(true);

        try {
            // In a real application, you'd want to create this table first!
            const { error } = await supabase
                .from("waitlist")
                .insert([{ email }]);

            if (error) {
                if (error.code === "23505") {
                    toast.info("You're already on the waitlist!");
                } else {
                    throw error;
                }
            } else {
                toast.success("You've been added to the waitlist!");
                setEmail("");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to join waitlist. Try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="relative w-full flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 mt-16">

            {/* Badge container */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="mb-8"
            >
                <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary backdrop-blur-md">
                    <BellRingIcon className="h-4 w-4" />
                    <span>V1 Early Access — Limited Spots Available</span>
                </span>
            </motion.div>

            {/* Hero Headline */}
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
                className="max-w-4xl text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight text-foreground"
            >
                Never Miss an <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-500">
                    Alpha Deployment
                </span>
            </motion.h1>

            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
                className="mt-6 max-w-2xl text-lg sm:text-xl text-muted-foreground"
            >
                The premium 24/7 Telegram Alert Bot monitoring all Clanker and Doppler factory tokens on Base. Curate your watchlist and execute instantly.
            </motion.p>

            {/* Waitlist Form */}
            <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                onSubmit={handleJoinWaitlist}
                className="mt-10 flex w-full max-w-md flex-col sm:flex-row gap-3"
            >
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="flex-1 rounded-full border border-border bg-background/50 px-6 py-4 text-base shadow-sm backdrop-blur-md transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="group inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? "Joining..." : "Join Waitlist"}
                    {!loading && <ChevronRightIcon className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />}
                </button>
            </motion.form>

            {/* Mock Terminal/Snippet Visualizer using Framer Motion */}
            <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
                className="mt-16 w-full max-w-3xl overflow-hidden rounded-2xl border border-border/50 bg-[#0a0a0a]/80 shadow-2xl backdrop-blur-xl"
            >
                <div className="flex items-center border-b border-white/5 bg-white/[0.02] px-4 py-3">
                    <div className="flex gap-2">
                        <div className="h-3 w-3 rounded-full bg-red-500/80" />
                        <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                        <div className="h-3 w-3 rounded-full bg-green-500/80" />
                    </div>
                    <div className="ml-4 flex items-center text-xs font-mono text-muted-foreground">
                        <BotIcon className="mr-2 h-3 w-3" />
                        kraven-bot — mainnet
                    </div>
                </div>
                <div className="p-6 text-left font-mono text-sm leading-loose">
                    <p className="text-blue-400">🚨 Alpha Alert</p>
                    <br />
                    <p><span className="text-gray-500">💊 Token:</span> <span className="text-white">Degen Coin $DEGEN</span></p>
                    <p><span className="text-gray-500">📄 CA:</span> <span className="text-green-400 select-all">0x1234abcd5678efgh9012ijkl</span></p>
                    <p><span className="text-gray-500">🏭 Platform:</span> <span className="text-white">Bankr via Doppler</span></p>
                    <p><span className="text-gray-500">🐦 Deployer:</span> <span className="text-blue-400">@chad_based</span></p>
                    <br />
                    <p className="text-gray-500 italic">⚡ Match found in 1.2s</p>
                </div>
            </motion.div>

        </section>
    );
}
