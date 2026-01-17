import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { userId, subscription } = await req.json();

        if (!userId || !subscription || !subscription.endpoint) {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        // Upsert based on endpoint to avoid duplicates
        const { error } = await supabase
            .from("push_subscriptions")
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }, { onConflict: 'endpoint' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Subscription save error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
