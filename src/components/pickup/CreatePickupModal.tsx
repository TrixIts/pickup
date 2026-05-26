"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
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
import { Loader2, Check, MapPin, ArrowLeft, ArrowRight, CalendarClock, Users, DollarSign } from "lucide-react";
import { LocationPickerMap } from "@/components/pickup/LocationPickerMap";
import { SPORTS, GAME_SKILL_LEVELS } from "@/lib/constants";
import { toast } from "sonner";

interface CreatePickupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreatePickupModal = ({ isOpen, onClose }: CreatePickupModalProps) => {
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"pin" | "details">("pin");
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

    const hasPinnedLocation = formData.latitude != null && formData.longitude != null;
    const coordinatesLabel = hasPinnedLocation
        ? `${formData.latitude?.toFixed(5)}, ${formData.longitude?.toFixed(5)}`
        : "No pin dropped yet";

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
        if (!hasPinnedLocation) {
            toast.error("Drop a pin for the game location first.");
            setStep("pin");
            return;
        }

        if (!formData.title.trim() || !formData.startTime) {
            toast.error("Add a title and start time before listing the game.");
            return;
        }

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
                toast.error(errorData.error || "Failed to create game");
            }
        } catch (error) {
            console.error(error);
            toast.error("An error occurred while creating the game.");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
            setStep("pin");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="!w-[calc(100vw-1rem)] !max-w-[980px] sm:!max-w-[980px] max-h-[100dvh] sm:max-h-[92vh] overflow-hidden flex flex-col bg-zinc-950 border-zinc-800 text-white p-0 gap-0">
                <div className="shrink-0 border-b border-zinc-800/70 px-5 py-4 sm:px-7 sm:py-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-400">
                                {step === "pin" ? "Step 1 of 2" : "Step 2 of 2"}
                            </p>
                            <h2 className="text-2xl font-black uppercase tracking-tight sm:text-3xl">
                                {step === "pin" ? "Drop the Game Pin" : "Game Details"}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
                                {step === "pin"
                                    ? "Start with the exact field, court, or meetup spot. Tap the map to drop a pin, then drag it into place."
                                    : "Now add the essentials players need before they join."}
                            </p>
                        </div>

                        <div className="flex rounded-full border border-zinc-800 bg-zinc-900 p-1 text-xs font-bold text-zinc-500">
                            <span className={`rounded-full px-3 py-2 ${step === "pin" ? "bg-emerald-500 text-black" : "text-zinc-300"}`}>
                                Pin
                            </span>
                            <span className={`rounded-full px-3 py-2 ${step === "details" ? "bg-emerald-500 text-black" : "text-zinc-300"}`}>
                                Details
                            </span>
                        </div>
                    </div>
                </div>

                {step === "pin" ? (
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                        <div className="grid min-h-[620px] gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                            <LocationPickerMap
                                className="min-h-[440px] h-[62vh] lg:h-auto w-full rounded-2xl"
                                initialLatitude={formData.latitude}
                                initialLongitude={formData.longitude}
                                onLocationSelect={handleMapLocationSelect}
                            />

                            <aside className="flex flex-col justify-between rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                                <div className="space-y-5">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-black">
                                        <MapPin className="h-7 w-7 fill-black/10" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-black uppercase tracking-tight">Pinpoint the meetup</h3>
                                        <p className="mt-2 text-sm leading-6 text-zinc-400">
                                            Fields and parks can have vague addresses. A dropped pin gives players a precise place to walk toward.
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-zinc-800 bg-black/40 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Selected spot</p>
                                        <p className="mt-2 break-words text-sm font-bold text-white">
                                            {formData.location || coordinatesLabel}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <Button
                                        type="button"
                                        onClick={() => setStep("details")}
                                        disabled={!hasPinnedLocation}
                                        className="h-12 w-full rounded-xl bg-emerald-500 font-black text-black hover:bg-emerald-400 disabled:opacity-40"
                                    >
                                        Continue
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={onClose}
                                        className="h-12 w-full rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </aside>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <div className="grid gap-5 lg:grid-cols-[300px_1fr]">
                                <aside className="space-y-4">
                                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Pinned location</p>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => setStep("pin")}
                                                className="h-9 rounded-lg px-2 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                        <div className="mb-3 h-48 overflow-hidden rounded-xl border border-zinc-800">
                                            <LocationPickerMap
                                                className="h-full w-full rounded-none border-0"
                                                initialLatitude={formData.latitude}
                                                initialLongitude={formData.longitude}
                                                onLocationSelect={handleMapLocationSelect}
                                            />
                                        </div>
                                        <p className="break-words text-sm font-bold text-white">
                                            {formData.location || coordinatesLabel}
                                        </p>
                                    </div>

                                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm leading-6 text-emerald-100">
                                        Players will see this exact pin on the map before they join.
                                    </div>
                                </aside>

                                <div className="space-y-5 rounded-2xl border border-zinc-800 bg-black/30 p-4 sm:p-5">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="sport" className="text-zinc-400">Sport</Label>
                                            <Select
                                                onValueChange={(v) => setFormData({ ...formData, sportId: v })}
                                                defaultValue={formData.sportId}
                                            >
                                                <SelectTrigger id="sport" className="h-12 w-full bg-zinc-900 border-zinc-800">
                                                    <SelectValue placeholder="Select sport" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    {SPORTS.map((sport) => (
                                                        <SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="level" className="text-zinc-400">Skill Level</Label>
                                            <Select
                                                onValueChange={(v) => setFormData({ ...formData, level: v })}
                                                defaultValue={formData.level}
                                            >
                                                <SelectTrigger id="level" className="h-12 w-full bg-zinc-900 border-zinc-800">
                                                    <SelectValue placeholder="Select level" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                                    {GAME_SKILL_LEVELS.map((level) => (
                                                        <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                                                    ))}
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
                                            placeholder="e.g. Sunday morning 5v5"
                                            className="h-12 bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                                        />
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-12">
                                        <div className="space-y-2 sm:col-span-6">
                                            <Label htmlFor="date" className="text-zinc-400">Date/Time</Label>
                                            <div className="relative">
                                                <CalendarClock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                                <Input
                                                    id="date"
                                                    type="datetime-local"
                                                    value={formData.startTime}
                                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                                    className="h-12 bg-zinc-900 border-zinc-800 pl-10 focus-visible:ring-emerald-500 [color-scheme:dark]"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 sm:col-span-3">
                                            <Label htmlFor="limit" className="text-zinc-400">Players</Label>
                                            <div className="relative">
                                                <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                                <Input
                                                    id="limit"
                                                    type="number"
                                                    value={formData.playerLimit}
                                                    onChange={(e) => setFormData({ ...formData, playerLimit: e.target.value })}
                                                    placeholder="10"
                                                    className="h-12 bg-zinc-900 border-zinc-800 pl-10 focus-visible:ring-emerald-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2 sm:col-span-3">
                                            <Label htmlFor="fee" className="text-zinc-400">Fee</Label>
                                            <div className="relative">
                                                <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                                                <Input
                                                    id="fee"
                                                    type="number"
                                                    min="0"
                                                    step="0.50"
                                                    value={formData.fee}
                                                    onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                                                    placeholder="0"
                                                    className="h-12 bg-zinc-900 border-zinc-800 pl-10 focus-visible:ring-emerald-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="desc" className="text-zinc-400">Notes</Label>
                                        <Textarea
                                            id="desc"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Bring light/dark shirts, water, parking notes, field number..."
                                            className="min-h-[112px] bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                                        />
                                    </div>

                                    <button
                                        type="button"
                                        className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 text-left transition-all hover:border-zinc-700"
                                        onClick={() => setFormData({ ...formData, isRecurring: !formData.isRecurring })}
                                    >
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${formData.isRecurring ? "bg-emerald-500 border-emerald-500" : "border-zinc-700"}`}>
                                            {formData.isRecurring && <Check className="h-4 w-4 text-black" />}
                                        </span>
                                        <span className="flex-1">
                                            <span className="block text-sm font-bold text-white">Make this a recurring weekly session</span>
                                            <span className="mt-1 block text-xs text-zinc-500">Creates upcoming weekly sessions with shared chat context.</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="shrink-0 border-t border-zinc-800 bg-zinc-950/90 px-4 py-4 backdrop-blur-sm sm:px-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-zinc-500 text-center sm:text-left">
                                    Est. fee per player: <span className="text-emerald-500 font-bold">${formData.fee || "0"}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setStep("pin")}
                                        disabled={loading}
                                        className="h-12 rounded-xl text-zinc-300 hover:bg-zinc-900"
                                    >
                                        <ArrowLeft className="mr-2 h-4 w-4" />
                                        Pin
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="h-12 rounded-xl bg-emerald-500 px-6 font-black text-black hover:bg-emerald-400"
                                    >
                                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "List Game"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
};
