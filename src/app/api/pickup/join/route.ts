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
            .select("age_range")
            .eq("id", user.id)
            .single();

        if (profileError || !profile?.age_range) {
            return NextResponse.json({ error: "Profile onboarding required", code: "ONBOARDING_REQUIRED" }, { status: 403 });
        }

        // 3. Check if already joined
        const { data: existingPlayer } = await supabase
            .from("pickup_session_players")
            .select("id")
            .eq("session_id", sessionId)
            .eq("profile_id", user.id)
            .single();

        if (existingPlayer) {
            return NextResponse.json({ message: "Already joined" });
        }

        // 4. Check player limit
        const { data: session } = await supabase
            .from("pickup_sessions")
            .select("player_limit, players:pickup_session_players(count)")
            .eq("id", sessionId)
            .single();

        if (session && session.player_limit) {
            const playerCount = (session.players as any)?.[0]?.count ?? 0;
            if (playerCount >= session.player_limit) {
                return NextResponse.json({ error: "Session is full" }, { status: 400 });
            }
        }

        // 5. Join
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
