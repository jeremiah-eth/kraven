import Link from "next/link";
import { BotIcon } from "lucide-react";

export default function SiteHeader() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-border/40 bg-background/50 backdrop-blur-md">
            <div className="container flex h-16 max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-2">
                    <BotIcon className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold tracking-tight">KRAVEN</span>
                </div>
                <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
                    <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
                    <Link href="#contact" className="hover:text-foreground transition-colors">Contact</Link>
                    <Link
                        href="#waitlist"
                        className="hidden sm:inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        Join Waitlist
                    </Link>
                </nav>
            </div>
        </header>
    );
}
