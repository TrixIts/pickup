import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push-server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { sessionId, seriesId, content } = await req.json();

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // 1. Insert Message
        const { data: message, error: insertError } = await supabase
            .from("session_messages")
            .insert({
                session_id: sessionId,
                series_id: seriesId,
                profile_id: user.id,
                content
            })
            .select("*, profiles(first_name, last_name)")
            .single();

        if (insertError) throw insertError;

        // 2. Fetch Session Title & Participants
        const { data: session } = await supabase
            .from("pickup_sessions")
            .select("title")
            .eq("id", sessionId)
            .single();

        const { data: players } = await supabase
            .from("pickup_session_players")
            .select("profile_id")
            .eq("session_id", sessionId)
            .neq("profile_id", user.id);

        // 3. Send Push Notifications (Background)
        // We do this asynchronously but await it here for simplicity in this V1
        if (players && players.length > 0 && session) {
            const userIds = players.map(p => p.profile_id);
            const title = `New message in ${session.title}`;
            const userName = message.profiles?.first_name || "Someone";
            const notificationBody = `${userName}: ${content}`;

            await sendPushNotification(userIds, title, notificationBody, `/pickup/${sessionId}`);
        }

        return NextResponse.json(message);
    } catch (error: any) {
        console.error("Chat error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
