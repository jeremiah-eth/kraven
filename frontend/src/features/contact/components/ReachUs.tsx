"use client";

import { motion } from "framer-motion";
import { MailIcon, MessageCircleIcon } from "lucide-react";
import Link from "next/link";

export default function ReachUs() {
    return (
        <section id="contact" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 my-24 border border-border/30 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent">
            <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="flex-1 space-y-6 text-center md:text-left">
                    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                        Ready to secure your alpha?
                    </h2>
                    <p className="text-muted-foreground mb-4">Have questions or need assistance? Our team is here to help.</p>
                    <a href="mailto:hollakravenbot@gmail.com" className="text-primary font-medium hover:underline">
                        hollakravenbot@gmail.com
                    </a>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <Link
                        href="mailto:contact@kraven.bot"
                        className="group flex items-center justify-center gap-3 rounded-full bg-white/5 border border-white/10 px-8 py-4 text-base font-medium transition-all hover:bg-white/10 hover:border-white/20"
                    >
                        <MailIcon className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                        Email Us
                    </Link>
                    <Link
                        href="#"
                        className="group flex items-center justify-center gap-3 rounded-full bg-blue-500/10 border border-blue-500/20 px-8 py-4 text-base font-medium transition-all hover:bg-blue-500/20 hover:border-blue-500/30"
                    >
                        <MessageCircleIcon className="h-5 w-5 text-blue-400 transition-colors" />
                        Join Community
                    </Link>
                </div>
            </div>
        </section>
    );
}
