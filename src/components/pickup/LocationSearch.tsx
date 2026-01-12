"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, MapPin, Loader2 } from "lucide-react";

interface LocationSearchProps {
    onSelectLocation: (location: string, lat: number, lng: number) => void;
    defaultValue?: string;
    className?: string;
}

interface Suggestion {
    id: string;
    place_name: string;
    center: [number, number]; // [lng, lat]
}

export const LocationSearch = ({ onSelectLocation, defaultValue = "", className }: LocationSearchProps) => {
    const [query, setQuery] = useState(defaultValue);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (query.length > 2 && showSuggestions && mapboxToken) {
                setLoading(true);
                try {
                    const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&types=place,address,poi&limit=5`;
                    const res = await fetch(endpoint);
                    const data = await res.json();

                    if (data.features) {
                        setSuggestions(data.features);
                    }
                } catch (error) {
                    console.error("Geocoding error:", error);
                } finally {
                    setLoading(false);
                }
            } else if (query.length < 3) {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, showSuggestions, mapboxToken]);

    const handleSelect = (suggestion: Suggestion) => {
        setQuery(suggestion.place_name);
        setSuggestions([]);
        setShowSuggestions(false);
        // Mapbox returns [lng, lat], but we usually pass (lat, lng) downstream or keep it explicit
        onSelectLocation(suggestion.place_name, suggestion.center[1], suggestion.center[0]);
    };

    return (
        <div className={`relative ${className}`}>
            <Label htmlFor="location-search" className="text-zinc-400 mb-2 block">Location</Label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                    id="location-search"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Search venue or address..."
                    className="pl-10 bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                    autoComplete="off"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    </div>
                )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((s) => (
                        <div
                            key={s.id}
                            className="flex items-center gap-3 p-3 hover:bg-zinc-800 cursor-pointer transition-colors"
                            onClick={() => handleSelect(s)}
                        >
                            <MapPin className="h-4 w-4 text-zinc-500 shrink-0" />
                            <span className="text-sm text-zinc-300 truncate">{s.place_name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
