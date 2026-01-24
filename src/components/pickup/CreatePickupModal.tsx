"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Search, MapPin as MapPinIcon } from "lucide-react";
import { LocationSearch } from "@/components/pickup/LocationSearch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LocationPickerMap } from "@/components/pickup/LocationPickerMap";

interface CreatePickupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreatePickupModal = ({ isOpen, onClose }: CreatePickupModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        sportId: "soccer",
        level: "intermediate",
        location: "",
        latitude: null as number | null,
        longitude: null as number | null,
        startTime: "",
        playerLimit: "10",
        fee: "0",
        description: "",
        isRecurring: false
    });
    const [activeTab, setActiveTab] = useState("search");

    // Use the Supabase client to get the current user
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
        };
        getUser();
    }, []);

    const handleMapLocationSelect = async (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
        }));

        // Reverse Geocode
        try {
            const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
            if (mapboxToken) {
                const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}&types=address,poi`);
                const data = await res.json();
                if (data.features && data.features.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        location: data.features[0].place_name,
                        latitude: lat,
                        longitude: lng
                    }));
                } else {
                    setFormData(prev => ({
                        ...prev,
                        location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, // Fallback
                        latitude: lat,
                        longitude: lng
                    }));
                }
            }
        } catch (e) {
            console.error("Reverse geocoding failed", e);
            setFormData(prev => ({
                ...prev,
                location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                latitude: lat,
                longitude: lng
            }));
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/pickup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    // Ensure the time is sent as a proper ISO string (UTC) derived from the user's local selection
                    startTime: new Date(formData.startTime).toISOString(),
                    hostId: userId || "placeholder-user-id"
                })
            });

            if (response.ok) {
                onClose();
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(`Failed to create game: ${errorData.error || "Unknown error"}`);
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter uppercase">Host a Game</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Fill out the details below to list your pickup session.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sport" className="text-zinc-400">Sport</Label>
                            <Select
                                onValueChange={(v) => setFormData({ ...formData, sportId: v })}
                                defaultValue={formData.sportId}
                            >
                                <SelectTrigger id="sport" className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Select sport" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="soccer">Soccer</SelectItem>
                                    <SelectItem value="basketball">Basketball</SelectItem>
                                    <SelectItem value="tennis">Tennis</SelectItem>
                                    <SelectItem value="volleyball">Volleyball</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="level" className="text-zinc-400">Skill Level</Label>
                            <Select
                                onValueChange={(v) => setFormData({ ...formData, level: v })}
                                defaultValue={formData.level}
                            >
                                <SelectTrigger id="level" className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="beginner">Beginner</SelectItem>
                                    <SelectItem value="intermediate">Intermediate</SelectItem>
                                    <SelectItem value="advanced">Advanced</SelectItem>
                                    <SelectItem value="pro">Pro</SelectItem>
                                    <SelectItem value="friendly">Friendly / All Levels</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title" className="text-zinc-400">Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g. Sunday Morning Friendly"
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-zinc-400">Location</Label>
                        <Tabs defaultValue="search" className="w-full" onValueChange={setActiveTab}>
                            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800 mb-2">
                                <TabsTrigger value="search" className="data-[state=active]:bg-zinc-800 gap-2 text-xs">
                                    <Search className="h-3 w-3" /> Search Address
                                </TabsTrigger>
                                <TabsTrigger value="map" className="data-[state=active]:bg-zinc-800 gap-2 text-xs">
                                    <MapPinIcon className="h-3 w-3" /> Pin on Map
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="search" className="mt-0">
                                <LocationSearch
                                    onSelectLocation={(location, lat, lng) => {
                                        setFormData({
                                            ...formData,
                                            location,
                                            latitude: lat,
                                            longitude: lng
                                        });
                                    }}
                                    defaultValue={formData.location}
                                />
                            </TabsContent>

                            <TabsContent value="map" className="mt-0">
                                <LocationPickerMap
                                    className="h-[200px] w-full"
                                    initialLatitude={formData.latitude}
                                    initialLongitude={formData.longitude}
                                    onLocationSelect={handleMapLocationSelect}
                                />
                                {formData.location && (
                                    <p className="mt-2 text-xs text-zinc-500 truncate">
                                        Selected: <span className="text-emerald-500">{formData.location}</span>
                                    </p>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date" className="text-zinc-400">Date/Time</Label>
                            <Input
                                id="date"
                                type="datetime-local"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500 [color-scheme:dark]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="limit" className="text-zinc-400">Player Limit</Label>
                            <Input
                                id="limit"
                                type="number"
                                value={formData.playerLimit}
                                onChange={(e) => setFormData({ ...formData, playerLimit: e.target.value })}
                                placeholder="10"
                                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Textarea
                            id="desc"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Bring light/dark shirts, water, etc."
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500 min-h-[80px]"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800 cursor-pointer hover:border-zinc-700 transition-all"
                        onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}>
                        <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${formData.isRecurring ? "bg-emerald-500 border-emerald-500" : "border-zinc-700"}`}>
                            {formData.isRecurring && <Check className="h-4 w-4 text-black" />}
                        </div>
                        <div className="flex-1">
                            <Label className="text-sm font-bold cursor-pointer">Make this a recurring weekly session</Label>
                            <p className="text-[10px] text-zinc-500">Enable persistent chat history across all future sessions in this series.</p>
                        </div>
                    </div>
                </div>

                <Separator className="bg-zinc-800" />

                <DialogFooter className="sm:justify-between items-center bg-zinc-950/50 -mx-6 -mb-6 p-6 rounded-b-lg">
                    <div className="text-sm text-zinc-500">
                        Est. Fee per player: <span className="text-emerald-500 font-bold">${formData.fee}.00</span>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-zinc-900">Cancel</Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold min-w-[100px]"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "List Game"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
