"use client";

import { useState, useEffect } from "react";
import { PickupMap } from "@/components/pickup/PickupMap";
import { PickupList } from "@/components/pickup/PickupList";
import { CreatePickupModal } from "@/components/pickup/CreatePickupModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Map as MapIcon, List as ListIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";

export default function PickupPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [highlightedGameId, setHighlightedGameId] = useState<string | null>(null);

    // Filtering State
    const [selectedSport, setSelectedSport] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<{ north: number, south: number, east: number, west: number } | null>(null);
    const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number, zoom: number } | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Check if profile is complete
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("age_range, latitude, longitude, commute_radius")
                    .eq("id", user.id)
                    .single();

                if (!profile?.age_range) {
                    router.push("/onboarding");
                    return;
                }

                if (profile.latitude && profile.longitude) {
                    const radius = profile.commute_radius || 10;
                    // Heuristic: Zoom 13 for ~3 miles, Zoom 11 for ~12 miles, Zoom 9 for ~50 miles
                    const zoom = Math.max(9, Math.min(14, Math.round(13 - Math.log2(radius / 2.5))));
                    setUserLocation({
                        latitude: profile.latitude,
                        longitude: profile.longitude,
                        zoom
                    });
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



    // Filter Logic
    // 1. Filter by Sport (Applied to both Map and List)
    const sportFilteredSessions = sessions.filter(session => {
        if (!selectedSport) return true;
        return session.sport?.name?.toLowerCase() === selectedSport.toLowerCase();
    });

    // 2. Filter by Map Bounds (Applied to List only)
    const listDisplayedSessions = sportFilteredSessions.filter(session => {
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
                    <p className="text-xs text-zinc-500 font-medium">Find games near Los Angeles, CA</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold gap-2 px-6"
                >
                    <Plus className="h-4 w-4" />
                    Create Game
                </Button>
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
                                sessions={sportFilteredSessions}
                                highlightedGameId={highlightedGameId}
                                onMapMove={setMapBounds}
                                userLocation={userLocation}
                            />
                        </TabsContent>
                        <TabsContent value="list" className="flex-1 m-0 p-0 overflow-y-auto bg-black">
                            <PickupList
                                sessions={listDisplayedSessions}
                                loading={loading}
                                onHoverGame={setHighlightedGameId}
                                selectedSport={selectedSport}
                                onSelectSport={setSelectedSport}
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
                        />
                    </div>
                    <div className="flex-1 relative">
                        <PickupMap
                            sessions={sportFilteredSessions}
                            highlightedGameId={highlightedGameId}
                            onMapMove={setMapBounds}
                            userLocation={userLocation}
                        />
                    </div>
                </div>
            </main>

            <CreatePickupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
