"use client";

import { useMemo, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import { MapPin, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PickupMapProps {
    sessions: any[];
    highlightedGameId?: string | null;
    onMapMove?: (bounds: { north: number, south: number, east: number, west: number }) => void;
}

// Los Angeles
const INITIAL_VIEW_STATE = {
    latitude: 34.0522,
    longitude: -118.2437,
    zoom: 11
};

export const PickupMap = ({ sessions, highlightedGameId, onMapMove }: PickupMapProps) => {
    const [popupInfo, setPopupInfo] = useState<any>(null);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // TODO: In a real app, games would have real lat/lng from the DB.
    // For now, we deterministically mock coordinates near LA based on the ID string.
    const gamesWithCoords = useMemo(() => {
        return sessions.map((game, i) => {
            // Use real coordinates if available
            if (game.latitude && game.longitude) {
                return {
                    ...game,
                    latitude: game.latitude,
                    longitude: game.longitude,
                };
            }

            // Fallback: Simple hash to get semi-random generic offset near LA
            const hash = game.id.split("").reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
            const latOffset = (hash % 100) / 1000 - 0.05; // +/- 0.05 degrees
            const lngOffset = ((hash * 13) % 100) / 1000 - 0.05;

            return {
                ...game,
                latitude: 34.0522 + latOffset,
                longitude: -118.2437 + lngOffset,
            };
        });
    }, [sessions]);

    if (!mapboxToken) {
        return (
            <div className="w-full h-full bg-zinc-950 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: "radial-gradient(#10b981 1px, transparent 1px)",
                    backgroundSize: "20px 20px"
                }}></div>
                <div className="z-10 text-center max-w-md p-6 bg-zinc-900/80 backdrop-blur-md rounded-2xl border border-zinc-800 shadow-2xl">
                    <div className="mx-auto bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <MapPin className="h-8 w-8 text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Mapbox Token Missing</h3>
                    <p className="text-zinc-400 text-sm mb-6">
                        To enable the interactive map, you need to add a Mapbox public token to your environment variables.
                    </p>
                    <div className="bg-black/50 p-3 rounded-lg border border-zinc-800 mb-6 text-left">
                        <code className="text-xs text-zinc-300 font-mono block">
                            NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ...
                        </code>
                    </div>
                    <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold">
                        <Link href="https://mapbox.com" target="_blank">Get a Free Token</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-zinc-900 relative">
            <Map
                initialViewState={INITIAL_VIEW_STATE}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={mapboxToken}
                onMoveEnd={(e) => {
                    const bounds = e.target.getBounds();
                    if (onMapMove && bounds) {
                        onMapMove({
                            north: bounds.getNorth(),
                            south: bounds.getSouth(),
                            east: bounds.getEast(),
                            west: bounds.getWest()
                        });
                    }
                }}
            >
                <NavigationControl position="top-right" />

                {gamesWithCoords.map((game) => (
                    <Marker
                        key={game.id}
                        latitude={game.latitude}
                        longitude={game.longitude}
                        anchor="bottom"
                        onClick={(e: any) => {
                            e.originalEvent.stopPropagation();
                            setPopupInfo(game);
                        }}
                    >
                        <div
                            className={`
                                cursor-pointer group transition-all duration-300 transform
                                ${highlightedGameId === game.id ? "scale-125 z-50" : "hover:scale-110 z-10"}
                            `}
                        >
                            <div className={`
                                flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 
                                ${highlightedGameId === game.id
                                    ? "bg-emerald-500 border-white text-black"
                                    : "bg-zinc-900 border-emerald-500 text-emerald-500"}
                            `}>
                                <MapPin className="h-4 w-4 fill-current" />
                            </div>

                            {/* Floating Label on Hover/Highlight */}
                            <div className={`
                                absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap px-2 py-1 
                                bg-black/90 text-white text-[10px] font-bold rounded-md border border-zinc-700
                                ${highlightedGameId === game.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                                transition-opacity pointer-events-none
                            `}>
                                {game.title}
                            </div>
                        </div>
                    </Marker>
                ))}

                {popupInfo && (
                    <Popup
                        anchor="top"
                        latitude={popupInfo.latitude}
                        longitude={popupInfo.longitude}
                        onClose={() => setPopupInfo(null)}
                        className="text-black"
                        maxWidth="300px"
                    >
                        <div className="p-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                                    {popupInfo.sport?.name || "Sport"}
                                </span>
                                <span className="text-xs text-zinc-500 font-bold">
                                    {new Date(popupInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <h3 className="font-bold text-sm mb-1">{popupInfo.title}</h3>
                            <p className="text-xs text-zinc-500 mb-3">{popupInfo.location}</p>
                            <Button size="sm" className="w-full h-8 bg-black text-white hover:bg-zinc-800">
                                Join Game
                            </Button>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};
