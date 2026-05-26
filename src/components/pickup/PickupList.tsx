"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Calendar, Clock, Users, ChevronRight, Repeat, LocateFixed, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { FormattedSession } from "@/types";
import { SPORT_NAMES } from "@/lib/constants";
import { formatTime, formatShortDate } from "@/lib/utils";
import { ContentSpinner } from "@/components/ui/spinner";

type SortOption = "soonest" | "nearest";

const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

interface PickupListProps {
    sessions: FormattedSession[];
    loading: boolean;
    onHoverGame?: (id: string | null) => void;
    selectedSport: string | null;
    onSelectSport: (sport: string | null) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    onClearFilters: () => void;
    resultCount: number;
    totalCount: number;
    sortBy: SortOption;
    onSortByChange: (sortBy: SortOption) => void;
    radiusMiles: number;
    onRadiusChange: (radius: number) => void;
    locationLabel: string;
    onUseCurrentLocation: () => void;
    distanceBySessionId: Record<string, number>;
}

export const PickupList = ({
    sessions,
    loading,
    onHoverGame,
    selectedSport,
    onSelectSport,
    searchQuery,
    onSearchQueryChange,
    onClearFilters,
    resultCount,
    totalCount,
    sortBy,
    onSortByChange,
    radiusMiles,
    onRadiusChange,
    locationLabel,
    onUseCurrentLocation,
    distanceBySessionId
}: PickupListProps) => {
    // Internal filtering state can stay here for now

    const hasFilters = searchQuery.trim().length > 0 || selectedSport !== null;

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-zinc-950">
                <ContentSpinner />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Filters/Search */}
            <div className="p-4 space-y-4 shrink-0 border-b border-zinc-900 bg-black/40">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Showing</p>
                        <p className="text-sm font-bold text-white">
                            {resultCount} of {totalCount} games
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-right text-xs text-zinc-500">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        <span className="line-clamp-2 max-w-[170px]">
                            Within {radiusMiles} mi of {locationLabel}
                        </span>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search games, venues, sports..."
                        value={searchQuery}
                        onChange={(event) => onSearchQueryChange(event.target.value)}
                        className="h-12 pl-10 pr-10 bg-zinc-900 border-zinc-800 text-white rounded-xl focus-visible:ring-emerald-500"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => onSearchQueryChange("")}
                            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 hover:text-white"
                            aria-label="Clear search"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <label className="flex h-12 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3">
                        <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
                        <span className="sr-only">Sort games</span>
                        <select
                            value={sortBy}
                            onChange={(event) => onSortByChange(event.target.value as SortOption)}
                            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none"
                        >
                            <option value="soonest" className="bg-zinc-950">Soonest first</option>
                            <option value="nearest" className="bg-zinc-950">Nearest first</option>
                        </select>
                    </label>
                    <label className="flex h-12 items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3">
                        <LocateFixed className="h-4 w-4 text-zinc-500" />
                        <span className="sr-only">Search radius</span>
                        <select
                            value={radiusMiles}
                            onChange={(event) => onRadiusChange(Number(event.target.value))}
                            className="min-w-0 flex-1 bg-transparent text-sm font-bold text-white outline-none"
                        >
                            {RADIUS_OPTIONS.map((radius) => (
                                <option key={radius} value={radius} className="bg-zinc-950">
                                    {radius} miles
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <Button
                    type="button"
                    variant="outline"
                    onClick={onUseCurrentLocation}
                    className="h-11 w-full rounded-xl border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 hover:text-white"
                >
                    <LocateFixed className="mr-2 h-4 w-4" />
                    Use My Location
                </Button>

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
                    {SPORT_NAMES.map((s) => (
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {sessions.length === 0 ? (
                    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 px-6 py-10 text-center">
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                            <Search className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-white">No games match this view</h3>
                        <p className="mt-2 max-w-[260px] text-sm leading-6 text-zinc-500">
                            Try a wider radius, clear the sport/search filters, or use your current location.
                        </p>
                        <div className="mt-6 flex w-full max-w-[280px] flex-col gap-2">
                            <Button
                                type="button"
                                onClick={() => onRadiusChange(100)}
                                className="h-11 rounded-xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
                            >
                                Expand to 100 miles
                            </Button>
                            {hasFilters && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClearFilters}
                                    className="h-11 rounded-xl border-zinc-800 bg-zinc-950 text-zinc-200 hover:bg-zinc-900 hover:text-white"
                                >
                                    Clear filters
                                </Button>
                            )}
                        </div>
                    </div>
                ) : (
                    sessions.map((game) => (
                        <div
                            key={game.id}
                            className={`relative ${game.is_recurring ? 'mb-2' : ''}`}
                        >
                            {/* Stacked borders for recurring games */}
                            {game.is_recurring && (
                                <>
                                    {/* Third layer (furthest back) */}
                                    <div
                                        className="absolute inset-0 bg-zinc-900/80 border border-zinc-800/30 rounded-lg pointer-events-none"
                                        style={{ transform: 'translate(4px, 4px)', zIndex: 1 }}
                                    />
                                    {/* Second layer (middle) */}
                                    <div
                                        className="absolute inset-0 bg-zinc-900/90 border border-zinc-800/50 rounded-lg pointer-events-none"
                                        style={{ transform: 'translate(2px, 2px)', zIndex: 2 }}
                                    />
                                </>
                            )}

                            <Card
                                className="bg-zinc-900 border-zinc-800 p-4 hover:border-emerald-500/50 transition-all cursor-pointer group relative"
                                onMouseEnter={() => onHoverGame?.(game.id)}
                                onMouseLeave={() => onHoverGame?.(null)}
                                style={{ zIndex: 3 }}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold tracking-widest text-emerald-500 uppercase">
                                            {game.sport?.name || "Sport"}
                                        </span>
                                        <h3 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">
                                            {game.title}
                                        </h3>
                                        {game.is_recurring && (
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-400/80 mt-1">
                                                <Repeat className="h-3 w-3" /> Every week on {game.recurringDay || 'this day'}
                                            </div>
                                        )}
                                    </div>
                                    <Badge className="bg-zinc-800 text-zinc-300 border-none">
                                        {game.fee === 0 || game.fee === "0" ? "Free" : `$${game.fee}`}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-zinc-400">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-3 w-3 text-zinc-500" />
                                        <span className="truncate">{game.location}</span>
                                        {distanceBySessionId[game.id] != null && (
                                            <span className="shrink-0 text-[11px] text-emerald-400">
                                                {distanceBySessionId[game.id].toFixed(1)} mi
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-3 w-3 text-zinc-500" />
                                        <span>{formatTime(game.startTime)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-zinc-500" />
                                        <span>
                                            {game.is_recurring && <span className="text-zinc-500">Next: </span>}
                                            {formatShortDate(game.startTime)}
                                        </span>
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
                                    <Link
                                        href={`/pickup/${game.id}`}
                                        className="text-xs font-bold text-emerald-500 hover:text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1"
                                    >
                                        View Game <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </Card>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
