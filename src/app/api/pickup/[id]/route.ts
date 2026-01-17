import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push-server";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    // This is optional if we want to move fetching here, but for now we fetch in client or specialized route.
    // Leaving standard GET for completeness though usually we use client queries.
    return NextResponse.json({ message: "Not implemented yet, use client query" });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { location, latitude, longitude, startTime } = await req.json();

        // 1. Auth & Permission Check
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Fetch session to check host
        const { data: session, error: fetchError } = await supabase
            .from("pickup_sessions")
            .select("host_id, title")
            .eq("id", id)
            .single();

        if (fetchError || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (session.host_id !== user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        // 2. Prepare Update
        const updates: any = {};
        if (location) {
            updates.location = location;
            updates.latitude = latitude;
            updates.longitude = longitude;
        }
        if (startTime) {
            updates.start_time = startTime;
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ message: "No changes provided" });
        }

        // 3. Update Session
        const { error: updateError } = await supabase
            .from("pickup_sessions")
            .update(updates)
            .eq("id", id);

        if (updateError) throw updateError;

        // 4. Notify Players
        // Fetch all players except host
        const { data: players } = await supabase
            .from("pickup_session_players")
            .select("profile_id")
            .eq("session_id", id)
            .neq("profile_id", user.id);

        if (players && players.length > 0) {
            let message = `Details updated for ${session.title}`;
            let type = "GAME_UPDATE";

            if (location && startTime) message = `New Location & Time for ${session.title}`;
            else if (location) {
                message = `New Location for ${session.title}: ${location}`;
                type = "LOCATION_UPDATE";
            }
            else if (startTime) {
                const dateStr = new Date(startTime).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                message = `New Time for ${session.title}: ${dateStr}`;
                type = "TIME_UPDATE";
            }

            const notifications = players.map(p => ({
                user_id: p.profile_id,
                type,
                message,
                link: `/pickup/${id}`
            }));

            await supabase.from("notifications").insert(notifications);

            // Send Push Notifications
            const userIds = players.map(p => p.profile_id);
            await sendPushNotification(userIds, type.replace('_', ' '), message, `/pickup/${id}`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Update error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
