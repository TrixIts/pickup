"use client";

import { useState, useCallback } from "react";
import Map, { Marker, NavigationControl, MapLayerMouseEvent } from "react-map-gl";
import { Crosshair, MapPin } from "lucide-react";
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from "@/lib/constants";

interface LocationPickerMapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLatitude?: number | null;
    initialLongitude?: number | null;
    className?: string;
}

const DEFAULT_VIEW_STATE = {
    latitude: DEFAULT_MAP_CENTER.latitude as number,
    longitude: DEFAULT_MAP_CENTER.longitude as number,
    zoom: DEFAULT_MAP_ZOOM as number,
};

const getInitialMarker = (latitude?: number | null, longitude?: number | null) => {
    if (latitude == null || longitude == null) return null;
    return { latitude, longitude };
};

const getInitialViewState = (latitude?: number | null, longitude?: number | null) => {
    if (latitude == null || longitude == null) return DEFAULT_VIEW_STATE;
    return {
        ...DEFAULT_VIEW_STATE,
        latitude,
        longitude,
        zoom: 13,
    };
};

export const LocationPickerMap = ({
    onLocationSelect,
    initialLatitude,
    initialLongitude,
    className
}: LocationPickerMapProps) => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const [viewState, setViewState] = useState(() => getInitialViewState(initialLatitude, initialLongitude));
    const [marker, setMarker] = useState<{ latitude: number, longitude: number } | null>(() => getInitialMarker(initialLatitude, initialLongitude));

    const handleClick = useCallback((event: MapLayerMouseEvent) => {
        const { lng, lat } = event.lngLat;
        setMarker({ latitude: lat, longitude: lng });
        onLocationSelect(lat, lng);
    }, [onLocationSelect]);

    if (!mapboxToken) return <div className="p-4 text-red-500">Mapbox token missing</div>;

    return (
        <div className={`relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 ${className}`}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: "100%", height: "100%" }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                mapboxAccessToken={mapboxToken}
                onClick={handleClick}
                cursor="crosshair"
            >
                <NavigationControl position="bottom-right" />

                {marker && (
                    <Marker
                        latitude={marker.latitude}
                        longitude={marker.longitude}
                        anchor="bottom"
                        draggable
                        onDragEnd={evt => {
                            const { lng, lat } = evt.lngLat;
                            setMarker({ latitude: lat, longitude: lng });
                            onLocationSelect(lat, lng);
                        }}
                    >
                        <div className="relative group">
                            <div className="flex flex-col items-center">
                                <div className="bg-emerald-500 text-black px-2 py-1 rounded text-[10px] font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    Drag to adjust
                                </div>
                                <MapPin className="h-10 w-10 text-emerald-500 fill-emerald-500/20 drop-shadow-lg" />
                            </div>
                        </div>
                    </Marker>
                )}
            </Map>

            <div className="pointer-events-none absolute left-3 right-3 top-3 rounded-2xl border border-zinc-800 bg-black/80 p-3 text-sm text-zinc-200 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-center gap-2">
                    <Crosshair className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold">{marker ? "Drag the pin or tap a better spot" : "Tap the exact field, court, or meetup spot"}</span>
                </div>
            </div>
        </div>
    );
};
