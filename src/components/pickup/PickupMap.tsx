"use client";

import { useMemo, useState } from "react";
import Map, { Marker, Popup, NavigationControl } from "react-map-gl";
import { Crosshair, MapPin, Repeat } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

import type { FormattedSession, MapBounds, UserLocation } from "@/types";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";
import { formatTime } from "@/lib/utils";

interface PickupMapProps {
    sessions: FormattedSession[];
    highlightedGameId?: string | null;
    onMapMove?: (bounds: MapBounds) => void;
    userLocation?: UserLocation | null;
    isCreateMode?: boolean;
    onCreateLocationSelect?: (latitude: number, longitude: number) => void;
}

const INITIAL_VIEW_STATE = {
    ...DEFAULT_MAP_CENTER,
    zoom: DEFAULT_MAP_ZOOM,
};

export const PickupMap = ({
    sessions,
    highlightedGameId,
    onMapMove,
    userLocation,
    isCreateMode = false,
    onCreateLocationSelect
}: PickupMapProps) => {
    const [popupInfo, setPopupInfo] = useState<FormattedSession | null>(null);
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    // TODO: In a real app, games would have real lat/lng from the DB.
    // For now, we deterministically mock coordinates near LA based on the ID string.
    const gamesWithCoords = useMemo(() => {
        return sessions.map((game) => {
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
            const latOffset = (hash % 100) / 1000 - 0.05;
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
                key={userLocation ? `${userLocation.latitude}-${userLocation.longitude}` : "default-view"}
                initialViewState={userLocation || INITIAL_VIEW_STATE}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={mapboxToken}
                cursor={isCreateMode ? "crosshair" : "grab"}
                onClick={(event) => {
                    if (!isCreateMode) return;
                    onCreateLocationSelect?.(event.lngLat.lat, event.lngLat.lng);
                }}
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

                {isCreateMode && (
                    <div className="pointer-events-none absolute left-1/2 top-5 z-10 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-emerald-500/40 bg-black/85 p-4 text-center shadow-2xl backdrop-blur">
                        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-black">
                            <Crosshair className="h-5 w-5" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-tight text-white">Click the exact field or court</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                            Your next map click drops the game pin and opens the details form.
                        </p>
                    </div>
                )}

                {gamesWithCoords.map((game) => (
                    <Marker
                        key={game.id}
                        latitude={game.latitude}
                        longitude={game.longitude}
                        anchor="bottom"
                        onClick={(e) => {
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

                {popupInfo && popupInfo.latitude != null && popupInfo.longitude != null && (
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
                                    {formatTime(popupInfo.startTime)}
                                </span>
                            </div>
                            <h3 className="font-bold text-sm mb-1">{popupInfo.title}</h3>
                            {popupInfo.is_recurring && (
                                <div className="flex items-center gap-1 text-[10px] text-zinc-500 mb-1">
                                    <Repeat className="h-3 w-3" /> Recurring
                                </div>
                            )}
                            <p className="text-xs text-zinc-500 mb-3">{popupInfo.location}</p>
                            <Button asChild size="sm" className="w-full h-8 bg-black text-white hover:bg-zinc-800">
                                <Link href={`/pickup/${popupInfo.id}`}>
                                    View Game
                                </Link>
                            </Button>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};
