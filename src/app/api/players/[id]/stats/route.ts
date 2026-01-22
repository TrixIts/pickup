import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient();
    const { id } = await params;

    try {
        // Fetch player stats
        const { data: stats, error: statsError } = await supabase
            .from("player_stats")
            .select("*")
            .eq("profile_id", id)
            .single();

        if (statsError && statsError.code !== "PGRST116") {
            throw statsError;
        }

        // Fetch recent reviews for this player
        const { data: reviews, error: reviewsError } = await supabase
            .from("player_reviews")
            .select(`
                rating,
                tags,
                created_at,
                reviewer:profiles!player_reviews_reviewer_id_fkey(
                    first_name, avatar_url
                )
            `)
            .eq("reviewed_id", id)
            .order("created_at", { ascending: false })
            .limit(10);

        if (reviewsError) throw reviewsError;

        // Calculate tag frequencies
        const tagCounts: Record<string, number> = {};
        reviews?.forEach(review => {
            (review.tags as string[])?.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        // Calculate rating distribution
        const ratingDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        reviews?.forEach(review => {
            const r = review.rating as 1 | 2 | 3 | 4 | 5;
            if (r >= 1 && r <= 5) {
                ratingDist[r]++;
            }
        });

        return NextResponse.json({
            stats: stats || {
                profile_id: id,
                games_joined: 0,
                games_attended: 0,
                reliability_pct: 100,
                avg_vibe_rating: 4.0,
                total_reviews: 0
            },
            recent_reviews: reviews || [],
            tag_counts: tagCounts,
            rating_distribution: ratingDist
        });
    } catch (error) {
        console.error("Player stats fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch player stats" },
            { status: 500 }
        );
    }
}
