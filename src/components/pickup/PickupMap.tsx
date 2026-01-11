"use client";

import { MapPin } from "lucide-react";

export const PickupMap = () => {
    return (
        <div className="w-full h-full bg-zinc-900 flex items-center justify-center relative">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
                {/* Placeholder for map texture */}
                <div className="grid grid-cols-10 grid-rows-10 h-full w-full border border-zinc-800">
                    {Array.from({ length: 100 }).map((_, i) => (
                        <div key={i} className="border border-zinc-800/30" />
                    ))}
                </div>
            </div>

            <div className="flex flex-col items-center gap-4 z-10 text-center px-6">
                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <MapPin className="h-8 w-8 animate-bounce" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">Interactive Map</h3>
                    <p className="text-zinc-500 max-w-xs mx-auto text-sm mt-1">
                        Map integration (Mapbox/Google Maps) will live here to show real-time game locations.
                    </p>
                </div>
            </div>

            {/* Sample Marker (Floating) */}
            <div className="absolute top-1/4 left-1/3 bg-emerald-500 text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/20 cursor-pointer hover:scale-110 transition-transform">
                SOCCER • 7:00 PM
            </div>

            <div className="absolute bottom-1/3 right-1/4 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-white/20 cursor-pointer hover:scale-110 transition-transform">
                BASKETBALL • 8:30 PM
            </div>
        </div>
    );
};
