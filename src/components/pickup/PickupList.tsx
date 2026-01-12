"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Clock, Users, Loader2 } from "lucide-react";

interface PickupListProps {
    sessions: any[];
    loading: boolean;
    onHoverGame?: (id: string | null) => void;
    selectedSport: string | null;
    onSelectSport: (sport: string | null) => void;
}

export const PickupList = ({ sessions, loading, onHoverGame, selectedSport, onSelectSport }: PickupListProps) => {
    // Internal filtering state can stay here for now


    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-zinc-950">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Filters/Search */}
            <div className="p-4 space-y-4 shrink-0 border-b border-zinc-900 bg-black/40">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search sport or venue..."
                        className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-xl focus-visible:ring-emerald-500"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                    <Badge
                        variant="outline"
                        onClick={() => onSelectSport(null)}
                        className={`
                            border-none font-bold whitespace-nowrap px-3 py-1 cursor-pointer transition-colors
                            ${!selectedSport ? "bg-emerald-500 text-black" : "bg-zinc-900 text-zinc-400 hover:text-white"}
                        `}
                    >
                        All Sports
                    </Badge>
                    {["Soccer", "Basketball", "Tennis", "Volleyball"].map((s) => (
                        <Badge
                            key={s}
                            variant="outline"
                            onClick={() => onSelectSport(s)}
                            className={`
                                border-zinc-800 whitespace-nowrap px-3 py-1 cursor-pointer transition-colors
                                ${selectedSport === s
                                    ? "bg-emerald-500 text-black border-none font-bold"
                                    : "bg-zinc-900 text-zinc-400 hover:text-white"}
                            `}
                        >
                            {s}
                        </Badge>
                    ))}
                </div>
            </div>

            {/* Game List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sessions.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500">No games found near you.</div>
                ) : (
                    sessions.map((game) => (
                        <Card
                            key={game.id}
                            className="bg-zinc-900 border-zinc-800 p-4 hover:border-emerald-500/50 transition-all cursor-pointer group"
                            onMouseEnter={() => onHoverGame?.(game.id)}
                            onMouseLeave={() => onHoverGame?.(null)}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                                        {game.sport?.name || "Sport"}
                                    </span>
                                    <h3 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">
                                        {game.title}
                                    </h3>
                                </div>
                                <Badge className="bg-zinc-800 text-zinc-300 border-none">
                                    {game.fee === 0 || game.fee === "0" ? "Free" : `$${game.fee}`}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-zinc-400">
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-3 w-3 text-zinc-500" />
                                    <span className="truncate">{game.location}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3 w-3 text-zinc-500" />
                                    <span>{new Date(game.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3 w-3 text-zinc-500" />
                                    <span>{new Date(game.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-3 w-3 text-zinc-500" />
                                    <span>{game._count?.players || 0} / {game.playerLimit || "∞"} joined</span>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                                <span className="text-xs font-medium text-zinc-500">
                                    Skill: <span className="text-zinc-300">{game.level || "Any"}</span>
                                </span>
                                <button className="text-xs font-bold text-emerald-500 hover:text-emerald-400 group-hover:translate-x-1 transition-transform">
                                    View Game →
                                </button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
};
