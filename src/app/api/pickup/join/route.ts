import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { sessionId } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        // 1. Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // 2. Check if profile is complete
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, age_range")
            .eq("id", user.id)
            .single();

        if (profileError || !profile?.age_range) {
            return NextResponse.json({ error: "Profile onboarding required", code: "ONBOARDING_REQUIRED" }, { status: 403 });
        }

        // 3. Fetch Session Details (including Sport ID and Level)
        const { data: session } = await supabase
            .from("pickup_sessions")
            .select("sport_id, level, player_limit, players:pickup_session_players(count)")
            .eq("id", sessionId)
            .single();

        if (!session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        // 4. Check if already joined
        const { data: existingPlayer } = await supabase
            .from("pickup_session_players")
            .select("id")
            .eq("session_id", sessionId)
            .eq("profile_id", user.id)
            .single();

        if (existingPlayer) {
            return NextResponse.json({ message: "Already joined" });
        }

        // 5. Check player limit
        if (session.player_limit) {
            const playerCount = (session.players as any)?.[0]?.count ?? 0;
            if (playerCount >= session.player_limit) {
                return NextResponse.json({ error: "Session is full" }, { status: 400 });
            }
        }

        // 6. Check Skill Level
        // normalize session level
        const sessionLevel = session.level?.toLowerCase();

        // Define ordinal values
        const LEVEL_VALUES: Record<string, number> = {
            "beginner": 1,
            "intermediate": 2,
            "advanced": 3,
            "pro": 4
        };

        // If session has a specific level (not friendly/all), validate
        if (sessionLevel && sessionLevel !== "friendly" && sessionLevel !== "all levels") {
            const requiredLevelValue = LEVEL_VALUES[sessionLevel] || 0;

            if (requiredLevelValue > 0) {
                // Fetch user's skill for this sport
                const { data: userSkill } = await supabase
                    .from("sport_skills")
                    .select("level")
                    .eq("profile_id", user.id)
                    .eq("sport_id", session.sport_id)
                    .single();

                // If user has no skill listed for this sport, we might block or default to beginner.
                // Assuming safety first: if you haven't rated yourself, you might not be ready for "Advanced".
                // We'll treat missing skill as 'beginner' (1) or (0).

                const userLevelStr = userSkill?.level?.toLowerCase() || "beginner";
                const userLevelValue = LEVEL_VALUES[userLevelStr] || 1;

                if (userLevelValue < requiredLevelValue) {
                    return NextResponse.json({
                        error: `This session requires ${session.level} level or higher. Your profile lists you as ${userSkill?.level || "Beginner"}.`
                    }, { status: 403 });
                }
            }
        }

        // 7. Join
        const { error: joinError } = await supabase
            .from("pickup_session_players")
            .insert({
                session_id: sessionId,
                profile_id: user.id
            });

        if (joinError) throw joinError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Join error:", error);
        return NextResponse.json({ error: error.message || "Failed to join session" }, { status: 500 });
    }
}
