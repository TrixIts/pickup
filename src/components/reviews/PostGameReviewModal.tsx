"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// Predefined tags for reviews
const POSITIVE_TAGS = [
    { id: "good_sport", label: "Good Sport", emoji: "🤝" },
    { id: "skilled", label: "Skilled", emoji: "⭐" },
    { id: "great_communicator", label: "Great Communicator", emoji: "💬" },
    { id: "beginner_friendly", label: "Beginner Friendly", emoji: "🌱" },
    { id: "high_energy", label: "High Energy", emoji: "⚡" },
];

const NEGATIVE_TAGS = [
    { id: "too_aggressive", label: "Too Aggressive", emoji: "😤" },
    { id: "poor_sportsmanship", label: "Poor Sportsmanship", emoji: "👎" },
    { id: "no_show", label: "No Show", emoji: "👻" },
];

interface PlayerToReview {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
}

interface PostGameReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    sessionId: string;
    playersToReview: PlayerToReview[];
    onComplete?: () => void;
}

export const PostGameReviewModal = ({
    isOpen,
    onClose,
    sessionId,
    playersToReview,
    onComplete
}: PostGameReviewModalProps) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const supabase = createClient();
    const currentPlayer = playersToReview[currentIndex];
    const isLastPlayer = currentIndex === playersToReview.length - 1;

    const handleTagToggle = (tagId: string) => {
        setSelectedTags(prev =>
            prev.includes(tagId)
                ? prev.filter(t => t !== tagId)
                : [...prev, tagId]
        );
    };

    const handleSubmitReview = async () => {
        if (rating === 0) return;

        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("player_reviews")
                .insert({
                    session_id: sessionId,
                    reviewer_id: user.id,
                    reviewed_id: currentPlayer.id,
                    rating,
                    tags: selectedTags
                });

            if (error) throw error;

            // Move to next player or close
            if (isLastPlayer) {
                onComplete?.();
                onClose();
            } else {
                setCurrentIndex(prev => prev + 1);
                setRating(0);
                setHoveredRating(0);
                setSelectedTags([]);
            }
        } catch (error) {
            console.error("Failed to submit review:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSkip = () => {
        if (isLastPlayer) {
            onComplete?.();
            onClose();
        } else {
            setCurrentIndex(prev => prev + 1);
            setRating(0);
            setHoveredRating(0);
            setSelectedTags([]);
        }
    };

    if (!currentPlayer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black tracking-tighter uppercase">
                        Rate Your Teammates
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        {currentIndex + 1} of {playersToReview.length} players
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-6">
                    {/* Player being reviewed */}
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 border-2 border-zinc-700">
                            <AvatarImage src={currentPlayer.avatar_url} />
                            <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold text-xl">
                                {currentPlayer.first_name?.[0]}{currentPlayer.last_name?.[0]}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="text-lg font-bold">
                                {currentPlayer.first_name} {currentPlayer.last_name?.[0]}.
                            </p>
                            <p className="text-sm text-zinc-500">How was playing with them?</p>
                        </div>
                    </div>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`h-10 w-10 transition-colors ${star <= (hoveredRating || rating)
                                            ? "text-amber-500 fill-amber-500"
                                            : "text-zinc-700"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Tags */}
                    {rating > 0 && (
                        <div className="space-y-3">
                            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
                                {rating >= 4 ? "What made them great?" : "What could improve?"}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(rating >= 4 ? POSITIVE_TAGS : NEGATIVE_TAGS).map((tag) => (
                                    <button
                                        key={tag.id}
                                        onClick={() => handleTagToggle(tag.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${selectedTags.includes(tag.id)
                                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                                                : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:border-zinc-700"
                                            }`}
                                    >
                                        {tag.emoji} {tag.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleSkip}
                        disabled={loading}
                        className="text-zinc-500 hover:text-white hover:bg-zinc-900"
                    >
                        Skip
                    </Button>
                    <Button
                        onClick={handleSubmitReview}
                        disabled={rating === 0 || loading}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : isLastPlayer ? (
                            "Submit & Finish"
                        ) : (
                            "Submit & Next"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
