import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { sessionId, status } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        // Validate status
        const validStatuses = ["confirmed", "declined", "maybe", "pending"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ error: "Invalid status. Must be: confirmed, declined, maybe, or pending" }, { status: 400 });
        }

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Check if user is part of this session
        const { data: sessionPlayer } = await supabase
            .from("pickup_session_players")
            .select("id")
            .eq("session_id", sessionId)
            .eq("profile_id", user.id)
            .single();

        if (!sessionPlayer) {
            return NextResponse.json({ error: "You must join this session before confirming" }, { status: 403 });
        }

        // Update or create confirmation
        const { data: existingConfirmation } = await supabase
            .from("session_confirmations")
            .select("id")
            .eq("session_id", sessionId)
            .eq("profile_id", user.id)
            .single();

        const confirmationData = {
            status,
            confirmed_at: status === "confirmed" ? new Date().toISOString() : null,
        };

        if (existingConfirmation) {
            const { error: updateError } = await supabase
                .from("session_confirmations")
                .update(confirmationData)
                .eq("id", existingConfirmation.id);

            if (updateError) throw updateError;
        } else {
            const { error: insertError } = await supabase
                .from("session_confirmations")
                .insert({
                    session_id: sessionId,
                    profile_id: user.id,
                    ...confirmationData,
                });

            if (insertError) throw insertError;
        }

        return NextResponse.json({
            success: true,
            status,
            message: status === "confirmed"
                ? "Great! You're confirmed for this session."
                : status === "declined"
                    ? "No worries! We'll miss you this time."
                    : "Your attendance status has been updated."
        });

    } catch (error: any) {
        console.error("Confirmation error:", error);
        return NextResponse.json({ error: error.message || "Failed to update confirmation" }, { status: 500 });
    }
}

// GET endpoint to fetch current user's confirmation status for a session
export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(req.url);
        const sessionId = searchParams.get("sessionId");

        if (!sessionId) {
            return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
        }

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Get confirmation status
        const { data: confirmation } = await supabase
            .from("session_confirmations")
            .select("status, confirmed_at, reminder_sent_at")
            .eq("session_id", sessionId)
            .eq("profile_id", user.id)
            .single();

        return NextResponse.json({
            status: confirmation?.status || "pending",
            confirmedAt: confirmation?.confirmed_at,
            reminderSentAt: confirmation?.reminder_sent_at,
        });

    } catch (error: any) {
        console.error("Get confirmation error:", error);
        return NextResponse.json({ error: error.message || "Failed to get confirmation" }, { status: 500 });
    }
}
