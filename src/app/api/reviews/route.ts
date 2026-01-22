import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { session_id, reviewed_id, rating, tags } = body;

        // Validation
        if (!session_id || !reviewed_id || !rating) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        if (rating < 1 || rating > 5) {
            return NextResponse.json(
                { error: "Rating must be between 1 and 5" },
                { status: 400 }
            );
        }

        if (user.id === reviewed_id) {
            return NextResponse.json(
                { error: "Cannot review yourself" },
                { status: 400 }
            );
        }

        // Insert review (RLS will validate session participation)
        const { data, error } = await supabase
            .from("player_reviews")
            .insert({
                session_id,
                reviewer_id: user.id,
                reviewed_id,
                rating,
                tags: tags || []
            })
            .select()
            .single();

        if (error) {
            console.error("Review insert error:", error);

            // Handle duplicate review
            if (error.code === "23505") {
                return NextResponse.json(
                    { error: "You have already reviewed this player for this session" },
                    { status: 409 }
                );
            }

            // Handle RLS violation (not in same session)
            if (error.code === "42501") {
                return NextResponse.json(
                    { error: "You can only review players from games you participated in" },
                    { status: 403 }
                );
            }

            return NextResponse.json(
                { error: "Failed to submit review" },
                { status: 500 }
            );
        }

        return NextResponse.json(data, { status: 201 });
    } catch (error) {
        console.error("Review API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const profileId = searchParams.get("profile_id");
    const sessionId = searchParams.get("session_id");

    try {
        let query = supabase
            .from("player_reviews")
            .select(`
                *,
                reviewer:profiles!player_reviews_reviewer_id_fkey(
                    id, first_name, last_name, avatar_url
                )
            `)
            .order("created_at", { ascending: false });

        if (profileId) {
            query = query.eq("reviewed_id", profileId);
        }

        if (sessionId) {
            query = query.eq("session_id", sessionId);
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error("Review fetch error:", error);
        return NextResponse.json(
            { error: "Failed to fetch reviews" },
            { status: 500 }
        );
    }
}
