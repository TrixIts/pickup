"use client";

import { useState, useEffect } from "react";
import { PickupMap } from "@/components/pickup/PickupMap";
import { PickupList } from "@/components/pickup/PickupList";
import { CreatePickupModal } from "@/components/pickup/CreatePickupModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crosshair, LocateFixed, Map as MapIcon, List as ListIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import type { FormattedSession, MapBounds, UserLocation } from "@/types";
import { DEFAULT_MAP_CENTER, ROUTES } from "@/lib/constants";
import { getDistanceMiles, getZoomFromRadius } from "@/lib/utils";

type SortOption = "soonest" | "nearest";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

export default function PickupPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateMapMode, setIsCreateMapMode] = useState(false);
    const [createInitialLocation, setCreateInitialLocation] = useState<{
        latitude: number;
        longitude: number;
        location?: string;
    } | null>(null);
    const [sessions, setSessions] = useState<FormattedSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightedGameId, setHighlightedGameId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Filtering State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [radiusMiles, setRadiusMiles] = useState(100);
    const [sortBy, setSortBy] = useState<SortOption>("soonest");
    const [locationLabel, setLocationLabel] = useState("Los Angeles, CA");
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
    const [userLocation, setUserLocation] = useState<UserLocation>({
        ...DEFAULT_MAP_CENTER,
        zoom: getZoomFromRadius(100)
    });

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUserId(user?.id ?? null);
            if (user) {
                // Check if profile is complete
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("age_range, location, latitude, longitude, commute_radius")
                    .eq("id", user.id)
                    .single();

                if (!profile?.age_range || profile.age_range === "") {
                    router.push(ROUTES.ONBOARDING);
                    return;
                }

                if (profile.latitude && profile.longitude) {
                    const radius = profile.commute_radius || 10;
                    const zoom = getZoomFromRadius(radius);
                    setUserLocation({
                        latitude: profile.latitude,
                        longitude: profile.longitude,
                        zoom
                    });
                    setRadiusMiles(radius);
                    setLocationLabel(profile.location || "Your area");
                }
            }

            try {
                const res = await fetch("/api/pickup");
                const data = await res.json();
                setSessions(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

    init();
    }, [router, supabase]);

    const handleUseCurrentLocation = () => {
        if (!navigator.geolocation) {
            return;
        }

        navigator.geolocation.getCurrentPosition((position) => {
            setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                zoom: getZoomFromRadius(radiusMiles)
            });
            setLocationLabel("Your current location");
        });
    };

    const handleRadiusChange = (nextRadius: number) => {
        setRadiusMiles(nextRadius);
        setUserLocation((current) => ({
            ...current,
            zoom: getZoomFromRadius(nextRadius)
        }));
    };

    const handleCreateButtonClick = () => {
        if (!currentUserId) {
            router.push(`${ROUTES.LOGIN}?returnTo=${encodeURIComponent(ROUTES.PICKUP)}&signup=true`);
            return;
        }

        setIsCreateMapMode((current) => !current);
    };

    const handleCreateLocationSelect = (latitude: number, longitude: number) => {
        setCreateInitialLocation({ latitude, longitude });
        setIsCreateMapMode(false);
        setIsCreateModalOpen(true);
    };

    const distanceBySessionId = sessions.reduce<Record<string, number>>((acc, session) => {
        if (session.latitude == null || session.longitude == null) return acc;

        acc[session.id] = getDistanceMiles(userLocation, {
            latitude: session.latitude,
            longitude: session.longitude
        });
        return acc;
    }, {});


    // Filter Logic
    // 1. Filter by Sport (Applied to both Map and List)
    const sportFilteredSessions = sessions.filter(session => {
        if (!selectedSport) return true;
        return session.sport?.name?.toLowerCase() === selectedSport.toLowerCase();
    });

    const queryFilteredSessions = sportFilteredSessions.filter(session => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;

        return [
            session.title,
            session.location,
            session.sport?.name,
            session.level,
            session.description,
        ].some((value) => value?.toString().toLowerCase().includes(query));
    });

    const radiusFilteredSessions = queryFilteredSessions.filter(session => {
        const distance = distanceBySessionId[session.id];
        if (distance == null) return true;
        return distance <= radiusMiles;
    });

    const sortedSessions = [...radiusFilteredSessions].sort((a, b) => {
        if (sortBy === "nearest") {
            const distanceA = distanceBySessionId[a.id] ?? Number.POSITIVE_INFINITY;
            const distanceB = distanceBySessionId[b.id] ?? Number.POSITIVE_INFINITY;

            if (distanceA !== distanceB) return distanceA - distanceB;
        }

        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    // 2. Filter by Map Bounds (Applied to List only)
    const listDisplayedSessions = sortedSessions.filter(session => {
        if (!mapBounds) return true;
        // If session has no coords (e.g. legacy/mock), keep it or hide it? 
        // Let's keep it visible in list if it has no coords, unless strictly map focused.
        // Actually, if it has no coords, it won't be on the map, so maybe show it?
        // But for new logic where everything has coords:
        if (!session.latitude || !session.longitude) return true;

        const { latitude, longitude } = session;
        return (
            latitude <= mapBounds.north &&
            latitude >= mapBounds.south &&
            longitude <= mapBounds.east &&
            longitude >= mapBounds.west
        );
    });

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            <Navbar />

            {/* Action Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950 shrink-0">
                <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase">Pickup Discovery</h1>
                    <p className="text-xs text-zinc-500 font-medium">Find games within {radiusMiles} miles of {locationLabel}</p>
                </div>
                <div className="hidden items-center gap-3 md:flex">
                    <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Radius</span>
                        <select
                            value={radiusMiles}
                            onChange={(event) => handleRadiusChange(Number(event.target.value))}
                            className="bg-transparent text-sm font-bold text-white outline-none"
                            aria-label="Search radius"
                        >
                            {RADIUS_OPTIONS.map((radius) => (
                                <option key={radius} value={radius} className="bg-zinc-950">
                                    {radius} mi
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleUseCurrentLocation}
                        className="rounded-full border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white gap-2"
                    >
                        <LocateFixed className="h-4 w-4" />
                        Use My Location
                    </Button>
                    <Button
                        onClick={handleCreateButtonClick}
                        className={`rounded-full font-bold gap-2 px-6 ${
                            isCreateMapMode
                                ? "bg-zinc-800 text-white hover:bg-zinc-700"
                                : "bg-emerald-500 hover:bg-emerald-400 text-black"
                        }`}
                    >
                        {isCreateMapMode ? <X className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
                        {isCreateMapMode ? "Cancel Pin" : "Create Game"}
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden">
                {/* Mobile View: Tabs */}
                <div className="md:hidden flex flex-col h-full">
                    <Tabs defaultValue="map" className="flex-1 flex flex-col">
                        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950">
                            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
                                <TabsTrigger value="map" className="data-[state=active]:bg-zinc-800 gap-2">
                                    <MapIcon className="h-4 w-4" /> Map
                                </TabsTrigger>
                                <TabsTrigger value="list" className="data-[state=active]:bg-zinc-800 gap-2">
                                    <ListIcon className="h-4 w-4" /> List
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="map" className="flex-1 m-0 p-0 relative h-full">
                            <PickupMap
                                sessions={sortedSessions}
                                highlightedGameId={highlightedGameId}
                                onMapMove={setMapBounds}
                                userLocation={userLocation}
                                isCreateMode={isCreateMapMode}
                                onCreateLocationSelect={handleCreateLocationSelect}
                            />
                        </TabsContent>
                        <TabsContent value="list" className="flex-1 m-0 p-0 overflow-y-auto bg-black min-h-0">
                            <PickupList
                                sessions={listDisplayedSessions}
                                loading={loading}
                                onHoverGame={setHighlightedGameId}
                                selectedSport={selectedSport}
                                onSelectSport={setSelectedSport}
                                searchQuery={searchQuery}
                                onSearchQueryChange={setSearchQuery}
                                onClearFilters={() => {
                                    setSearchQuery("");
                                    setSelectedSport(null);
                                }}
                                resultCount={listDisplayedSessions.length}
                                totalCount={sessions.length}
                                sortBy={sortBy}
                                onSortByChange={setSortBy}
                                radiusMiles={radiusMiles}
                                onRadiusChange={handleRadiusChange}
                                locationLabel={locationLabel}
                                onUseCurrentLocation={handleUseCurrentLocation}
                                distanceBySessionId={distanceBySessionId}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Desktop View: Split Map/List */}
                <div className="hidden md:flex h-full">
                    <div className="w-1/3 border-r border-zinc-800 overflow-y-auto bg-zinc-950">
                        <PickupList
                            sessions={listDisplayedSessions}
                            loading={loading}
                            onHoverGame={setHighlightedGameId}
                            selectedSport={selectedSport}
                            onSelectSport={setSelectedSport}
                            searchQuery={searchQuery}
                            onSearchQueryChange={setSearchQuery}
                            onClearFilters={() => {
                                setSearchQuery("");
                                setSelectedSport(null);
                            }}
                            resultCount={listDisplayedSessions.length}
                            totalCount={sessions.length}
                            sortBy={sortBy}
                            onSortByChange={setSortBy}
                            radiusMiles={radiusMiles}
                            onRadiusChange={handleRadiusChange}
                            locationLabel={locationLabel}
                            onUseCurrentLocation={handleUseCurrentLocation}
                            distanceBySessionId={distanceBySessionId}
                        />
                    </div>
                    <div className="flex-1 relative">
                        <PickupMap
                            sessions={sortedSessions}
                            highlightedGameId={highlightedGameId}
                            onMapMove={setMapBounds}
                            userLocation={userLocation}
                            isCreateMode={isCreateMapMode}
                            onCreateLocationSelect={handleCreateLocationSelect}
                        />
                    </div>
                </div>
            </main>

            <CreatePickupModal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setCreateInitialLocation(null);
                }}
                initialLocation={createInitialLocation}
            />
        </div>
    );
}
