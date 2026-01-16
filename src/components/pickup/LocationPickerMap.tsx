"use client";

import { useState, useCallback, useEffect } from "react";
import Map, { Marker, NavigationControl, MapLayerMouseEvent } from "react-map-gl";
import { MapPin } from "lucide-react";

interface LocationPickerMapProps {
    onLocationSelect: (lat: number, lng: number) => void;
    initialLatitude?: number | null;
    initialLongitude?: number | null;
    className?: string;
}

// Default to LA if no initial coords
const DEFAULT_VIEW_STATE = {
    latitude: 34.0522,
    longitude: -118.2437,
    zoom: 11
};

export const LocationPickerMap = ({
    onLocationSelect,
    initialLatitude,
    initialLongitude,
    className
}: LocationPickerMapProps) => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    const [viewState, setViewState] = useState(DEFAULT_VIEW_STATE);
    const [marker, setMarker] = useState<{ latitude: number, longitude: number } | null>(null);

    useEffect(() => {
        if (initialLatitude && initialLongitude) {
            setMarker({ latitude: initialLatitude, longitude: initialLongitude });
            setViewState(prev => ({
                ...prev,
                latitude: initialLatitude,
                longitude: initialLongitude,
                zoom: 13
            }));
        }
    }, [initialLatitude, initialLongitude]);

    const handleClick = useCallback((event: MapLayerMouseEvent) => {
        const { lng, lat } = event.lngLat;
        setMarker({ latitude: lat, longitude: lng });
        onLocationSelect(lat, lng);
    }, [onLocationSelect]);

    if (!mapboxToken) return <div className="p-4 text-red-500">Mapbox token missing</div>;

    return (
        <div className={`relative rounded-xl overflow-hidden border border-zinc-800 ${className}`}>
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
                                    Drag me!
                                </div>
                                <MapPin className="h-8 w-8 text-emerald-500 fill-emerald-500/20 drop-shadow-lg" />
                            </div>
                        </div>
                    </Marker>
                )}
            </Map>

            <div className="absolute top-2 left-2 right-2 p-2 bg-black/80 backdrop-blur text-xs text-zinc-300 rounded border border-zinc-800 text-center pointer-events-none">
                Tap anywhere to pin location
            </div>
        </div>
    );
};
