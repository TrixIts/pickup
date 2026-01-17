import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

// Init Web Push
// Note: In Next.js Edge Runtime this might not work standardly, but in Node runtime it's fine.
// Ensure route uses Node runtime if necessary.
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
}

export async function sendPushNotification(userIds: string[], title: string, message: string, link: string) {
    const supabase = await createClient();

    // 1. Fetch subscriptions for these users
    const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("*")
        .in("user_id", userIds);

    if (!subscriptions || subscriptions.length === 0) return;

    // 2. Send Notifications
    const payload = JSON.stringify({ title, message, link });

    // We process in parallel, but handle failures individually
    const promises = subscriptions.map(async (sub) => {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }, payload);
        } catch (error: any) {
            if (error.statusCode === 410 || error.statusCode === 404) {
                // Subscription is invalid, delete it
                await supabase.from("push_subscriptions").delete().eq("id", sub.id);
            } else {
                console.error("Error sending push:", error);
            }
        }
    });

    await Promise.all(promises);
}
