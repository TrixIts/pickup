import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import webpush from "npm:web-push@3.6.7";

// Types
interface SessionReminder {
    session_id: string;
    session_title: string;
    start_time: string;
    location: string;
    sport_name: string;
    profile_id: string;
    first_name: string;
    email: string;
}

interface PushSubscription {
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
}

// Configure web-push with VAPID keys
const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY") || "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") || "";
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@pickup.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Optional: Resend for email notifications
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req: Request) => {
    try {
        // Verify this is an authorized request (from cron or admin)
        const authHeader = req.headers.get("Authorization");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        // Allow both service role key and anon key with special header for cron
        const cronSecret = req.headers.get("x-cron-secret");
        const expectedCronSecret = Deno.env.get("CRON_SECRET");

        if (!authHeader?.includes(serviceRoleKey || "") && cronSecret !== expectedCronSecret) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create Supabase client with service role for full access
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabase = createClient(supabaseUrl, serviceRoleKey!);

        // Get sessions happening in the next 24-48 hours
        const now = new Date();
        const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // Find sessions needing reminders
        // Query sessions between 24-48 hours from now, where players haven't received reminders yet
        const { data: sessionsToRemind, error: sessionsError } = await supabase
            .from("pickup_sessions")
            .select(`
        id,
        title,
        start_time,
        location,
        sport:sports(name),
        players:pickup_session_players!inner(
          profile_id,
          profiles(first_name, email)
        )
      `)
            .gte("start_time", in24Hours.toISOString())
            .lte("start_time", in48Hours.toISOString());

        if (sessionsError) {
            console.error("Error fetching sessions:", sessionsError);
            return new Response(JSON.stringify({ error: sessionsError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            });
        }

        console.log(`Found ${sessionsToRemind?.length || 0} sessions needing reminders`);

        // Process each session
        const results = {
            sessionsProcessed: 0,
            pushNotificationsSent: 0,
            emailsSent: 0,
            confirmationsUpdated: 0,
            errors: [] as string[],
        };

        for (const session of sessionsToRemind || []) {
            results.sessionsProcessed++;

            for (const player of session.players) {
                const profileId = player.profile_id;
                const profile = player.profiles as any;

                // Check if we already sent a reminder for this session+user
                const { data: existingConfirmation } = await supabase
                    .from("session_confirmations")
                    .select("id, reminder_sent_at")
                    .eq("session_id", session.id)
                    .eq("profile_id", profileId)
                    .single();

                if (existingConfirmation?.reminder_sent_at) {
                    // Already sent reminder, skip
                    continue;
                }

                // Format session time for display
                const sessionDate = new Date(session.start_time);
                const formattedDate = sessionDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "short",
                    day: "numeric",
                });
                const formattedTime = sessionDate.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                });

                // Send push notification
                try {
                    const { data: subscriptions } = await supabase
                        .from("push_subscriptions")
                        .select("*")
                        .eq("user_id", profileId);

                    for (const sub of subscriptions || []) {
                        try {
                            await webpush.sendNotification(
                                {
                                    endpoint: sub.endpoint,
                                    keys: {
                                        p256dh: sub.p256dh,
                                        auth: sub.auth,
                                    },
                                },
                                JSON.stringify({
                                    title: `Game Reminder: ${session.title}`,
                                    body: `Are you playing ${formattedDate} at ${formattedTime}? Tap to confirm.`,
                                    icon: "/icon-192x192.png",
                                    badge: "/badge-72x72.png",
                                    data: {
                                        url: `/pickup/${session.id}`,
                                        sessionId: session.id,
                                        action: "confirm_attendance",
                                    },
                                })
                            );
                            results.pushNotificationsSent++;
                        } catch (pushError: any) {
                            console.error("Push notification error:", pushError.message);
                            // If subscription is invalid, remove it
                            if (pushError.statusCode === 410 || pushError.statusCode === 404) {
                                await supabase
                                    .from("push_subscriptions")
                                    .delete()
                                    .eq("endpoint", sub.endpoint);
                            }
                        }
                    }
                } catch (error: any) {
                    results.errors.push(`Push error for ${profileId}: ${error.message}`);
                }

                // Send email notification (if Resend is configured)
                if (RESEND_API_KEY && profile?.email) {
                    try {
                        const emailResponse = await fetch("https://api.resend.com/emails", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                Authorization: `Bearer ${RESEND_API_KEY}`,
                            },
                            body: JSON.stringify({
                                from: "Pickup <noreply@pickup.app>",
                                to: profile.email,
                                subject: `🏆 Game Reminder: ${session.title} on ${formattedDate}`,
                                html: `
                  <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #10b981;">Hey ${profile.first_name || "there"}! 👋</h1>
                    <p style="font-size: 18px; color: #333;">
                      You have a game coming up:
                    </p>
                    <div style="background: #f4f4f5; border-left: 4px solid #10b981; padding: 16px; margin: 16px 0; border-radius: 4px;">
                      <h2 style="margin: 0 0 8px 0; color: #18181b;">${session.title}</h2>
                      <p style="margin: 4px 0; color: #52525b;">
                        📅 ${formattedDate} at ${formattedTime}
                      </p>
                      <p style="margin: 4px 0; color: #52525b;">
                        📍 ${session.location}
                      </p>
                      <p style="margin: 4px 0; color: #52525b;">
                        ⚽ ${(session.sport as any)?.name || "Sport"}
                      </p>
                    </div>
                    <p style="font-size: 16px; color: #333;">
                      <strong>Can you make it?</strong> Please confirm your attendance so the host knows who to expect.
                    </p>
                    <div style="margin: 24px 0;">
                      <a href="https://pickup.app/pickup/${session.id}?confirm=yes" 
                         style="background: #10b981; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-right: 8px;">
                        ✓ I'm Coming
                      </a>
                      <a href="https://pickup.app/pickup/${session.id}?confirm=no" 
                         style="background: #ef4444; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
                        ✗ Can't Make It
                      </a>
                    </div>
                    <p style="color: #71717a; font-size: 14px;">
                      See you on the field! 🏃‍♂️
                    </p>
                  </div>
                `,
                            }),
                        });

                        if (emailResponse.ok) {
                            results.emailsSent++;
                        } else {
                            const errorData = await emailResponse.json();
                            results.errors.push(`Email error: ${JSON.stringify(errorData)}`);
                        }
                    } catch (error: any) {
                        results.errors.push(`Email error for ${profileId}: ${error.message}`);
                    }
                }

                // Update confirmation record with reminder_sent_at
                if (existingConfirmation) {
                    await supabase
                        .from("session_confirmations")
                        .update({ reminder_sent_at: new Date().toISOString() })
                        .eq("id", existingConfirmation.id);
                } else {
                    // Create confirmation record if it doesn't exist
                    await supabase
                        .from("session_confirmations")
                        .insert({
                            session_id: session.id,
                            profile_id: profileId,
                            status: "pending",
                            reminder_sent_at: new Date().toISOString(),
                        });
                }
                results.confirmationsUpdated++;
            }
        }

        console.log("Reminder results:", results);

        return new Response(JSON.stringify({
            success: true,
            ...results,
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (error: any) {
        console.error("Edge function error:", error);
        return new Response(JSON.stringify({
            error: error.message,
            stack: error.stack,
        }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
});
