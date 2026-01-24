"use client";

import { Onboarding } from "@/components/onboarding/Onboarding";
import { Trophy } from "lucide-react";
import { Suspense } from "react";

export default function OnboardingPage() {
    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden selection:bg-emerald-500/30">
            {/* Background Aesthetics */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600 rounded-full blur-[120px]" />
                <div className="absolute inset-0" style={{
                    backgroundImage: "radial-gradient(#ffffff05 1px, transparent 1px)",
                    backgroundSize: "40px 40px"
                }} />
            </div>

            <main className="relative z-10 container mx-auto px-4 py-12 flex flex-col items-center">
                <div className="flex items-center gap-3 mb-12 group cursor-default">
                    <div className="bg-emerald-500 p-2 rounded-xl transform group-hover:rotate-12 transition-transform duration-300">
                        <Trophy className="h-6 w-6 text-black" />
                    </div>
                    <span className="text-2xl font-black tracking-tighter">PICKUPLEAGUE</span>
                </div>

                <div className="w-full max-w-2xl bg-zinc-950/50 backdrop-blur-xl border border-zinc-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                    <Suspense fallback={<div className="text-center py-12 text-zinc-500">Loading...</div>}>
                        <Onboarding />
                    </Suspense>
                </div>

                <p className="mt-12 text-zinc-500 text-xs font-medium tracking-widest uppercase">
                    Join the community &bull; Level up your game
                </p>
            </main>
        </div>
    );
}
