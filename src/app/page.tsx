import Link from "next/link";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { GetStartedButton } from "@/components/landing/GetStartedButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
      <nav className="fixed top-0 z-50 w-full border-b border-zinc-800/50 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-500" />
            <span className="text-xl font-black tracking-tighter">PICKUP.</span>
          </div>

          <div className="hidden items-center gap-8 text-sm font-medium text-zinc-400 md:flex">
            <Link href="/pickup" className="transition-colors hover:text-white">Find Games</Link>
            <Link href="/leagues" className="transition-colors hover:text-white">Leagues</Link>
            <Link href="/pricing" className="transition-colors hover:text-white">Pricing</Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white">Sign In</Link>
            <GetStartedButton />
          </div>
        </div>
      </nav>

      <main>
        <Hero />
        <Features />

        {/* Simple Footer */}
        <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="mb-6 flex items-center justify-center gap-2">
              <div className="h-6 w-6 rounded bg-emerald-500" />
              <span className="text-lg font-black tracking-tighter uppercase">Pickup.</span>
            </div>
            <p className="text-sm text-zinc-500">
              © 2026 Pickup League. All rights reserved. Built for the love of the game.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
