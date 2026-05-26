"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MapPin, CalendarDays, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { CreatePickupModal } from "@/components/pickup/CreatePickupModal";
import { createClient } from "@/lib/supabase/client";
import { ROUTES } from "@/lib/constants";

export const MobileNav = () => {
    const pathname = usePathname();
    const router = useRouter();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id ?? null);
        });
    }, []);

    const isActive = (path: string) => pathname === path || pathname?.startsWith(path + "/");
    const handleCreateClick = () => {
        if (!userId) {
            router.push(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.PICKUP)}&signup=true`);
            return;
        }
        setIsCreateModalOpen(true);
    };

    return (
        <>
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800 safe-area-bottom">
                <div className="flex items-stretch justify-around h-16 px-2">
                    {/* Find Games */}
                    <Link
                        href="/pickup"
                        className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${isActive("/pickup")
                                ? "text-emerald-500"
                                : "text-zinc-500 active:text-zinc-300"
                            }`}
                    >
                        <MapPin className={`h-5 w-5 ${isActive("/pickup") ? "stroke-[2.5]" : ""}`} />
                        <span className="text-[10px] font-bold tracking-tight">Find</span>
                    </Link>

                    {/* Create Game - Center FAB-like button */}
                    <button
                        onClick={handleCreateClick}
                        className="flex flex-col items-center justify-center flex-1 gap-1 relative"
                    >
                        <div className="absolute -top-5 w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
                            <Plus className="h-7 w-7 text-black stroke-[2.5]" />
                        </div>
                        <span className="text-[10px] font-bold tracking-tight text-zinc-500 mt-8">Create</span>
                    </button>

                    {/* Dashboard */}
                    <Link
                        href="/dashboard"
                        className={`flex flex-col items-center justify-center flex-1 gap-1 transition-colors ${isActive("/dashboard")
                                ? "text-emerald-500"
                                : "text-zinc-500 active:text-zinc-300"
                            }`}
                    >
                        <CalendarDays className={`h-5 w-5 ${isActive("/dashboard") ? "stroke-[2.5]" : ""}`} />
                        <span className="text-[10px] font-bold tracking-tight">Schedule</span>
                    </Link>
                </div>
            </nav>

            <CreatePickupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </>
    );
};
