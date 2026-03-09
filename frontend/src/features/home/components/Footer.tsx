import { BotIcon } from "lucide-react";
import Link from "next/link";

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full border-t border-white/5 bg-[#030303] py-12 text-sm text-muted-foreground">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <BotIcon className="h-5 w-5 text-primary" />
                            <span className="text-lg font-bold text-foreground tracking-tight">KRAVEN</span>
                        </Link>
                        <p className="max-w-sm">
                            The premium Telegram alert monitor built specifically for Clanker, Doppler, and Bankr token deployments. Connect faster.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Product</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="hover:text-primary transition-colors">Features</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Pricing</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Roadmap</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                        <ul className="space-y-3">
                            <li><Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-primary transition-colors">Disclaimer</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between border-t border-white/5 pt-8">
                    <p>© {currentYear} KRAVEN Bot. All rights reserved.</p>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <Link href="https://x.com" target="_blank" className="hover:text-foreground transition-colors">
                            X (Twitter)
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
