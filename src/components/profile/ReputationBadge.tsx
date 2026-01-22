"use client";

import { Star, CheckCircle } from "lucide-react";

interface ReputationBadgeProps {
    stats: {
        reliability_pct: number;
        avg_vibe_rating: number;
        total_reviews: number;
        games_attended: number;
        games_joined: number;
    } | null;
    size?: "sm" | "md" | "lg";
    showDetails?: boolean;
}

export const ReputationBadge = ({
    stats,
    size = "md",
    showDetails = false
}: ReputationBadgeProps) => {
    // Default stats for new players
    const reliabilityPct = stats?.reliability_pct ?? 100;
    const vibeRating = stats?.avg_vibe_rating ?? 4.0;
    const totalReviews = stats?.total_reviews ?? 0;
    const gamesAttended = stats?.games_attended ?? 0;

    // Determine reliability color
    const getReliabilityColor = (pct: number) => {
        if (pct >= 90) return "text-emerald-500";
        if (pct >= 75) return "text-yellow-500";
        return "text-red-500";
    };

    // Determine if player is "new" (less than 3 reviews)
    const isNewPlayer = totalReviews < 3;

    const sizeClasses = {
        sm: "text-xs gap-1",
        md: "text-sm gap-2",
        lg: "text-base gap-3"
    };

    const iconSize = {
        sm: "h-3 w-3",
        md: "h-4 w-4",
        lg: "h-5 w-5"
    };

    return (
        <div className={`flex items-center ${sizeClasses[size]} text-zinc-400`}>
            {/* Reliability Badge */}
            <div className="flex items-center gap-1">
                <CheckCircle className={`${iconSize[size]} ${getReliabilityColor(reliabilityPct)}`} />
                <span className={getReliabilityColor(reliabilityPct)}>
                    {Math.round(reliabilityPct)}%
                </span>
            </div>

            <span className="text-zinc-600">•</span>

            {/* Vibe Rating */}
            {isNewPlayer ? (
                <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 font-medium">
                    New Player
                </span>
            ) : (
                <div className="flex items-center gap-1">
                    <Star className={`${iconSize[size]} text-amber-500 fill-amber-500`} />
                    <span className="text-white font-medium">
                        {vibeRating.toFixed(1)}
                    </span>
                    {showDetails && (
                        <span className="text-zinc-500">
                            ({totalReviews})
                        </span>
                    )}
                </div>
            )}

            {/* Games count for detailed view */}
            {showDetails && gamesAttended > 0 && (
                <>
                    <span className="text-zinc-600">•</span>
                    <span className="text-zinc-500">
                        {gamesAttended} games
                    </span>
                </>
            )}
        </div>
    );
};
