import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();

        // 1. Auth & Admin Check
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("is_admin")
            .eq("id", user.id)
            .single();

        if (!profile?.is_admin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // 2. Fetch Stats
        const [
            { count: totalUsers },
            { count: totalGames },
            { count: totalMessages },
            { count: totalPlayers }
        ] = await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase.from("pickup_sessions").select("*", { count: "exact", head: true }),
            supabase.from("session_messages").select("*", { count: "exact", head: true }),
            supabase.from("pickup_session_players").select("*", { count: "exact", head: true })
        ]);

        // 3. Signups over last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: signups } = await supabase
            .from("profiles")
            .select("created_at")
            .gte("created_at", thirtyDaysAgo.toISOString());

        // Group by day
        const signupsByDay: Record<string, number> = {};
        signups?.forEach(u => {
            const day = new Date(u.created_at).toISOString().split("T")[0];
            signupsByDay[day] = (signupsByDay[day] || 0) + 1;
        });

        // 4. Games created over last 30 days
        const { data: games } = await supabase
            .from("pickup_sessions")
            .select("created_at")
            .gte("created_at", thirtyDaysAgo.toISOString());

        const gamesByDay: Record<string, number> = {};
        games?.forEach(g => {
            const day = new Date(g.created_at).toISOString().split("T")[0];
            gamesByDay[day] = (gamesByDay[day] || 0) + 1;
        });

        // 5. Messages over last 30 days
        const { data: messages } = await supabase
            .from("session_messages")
            .select("created_at")
            .gte("created_at", thirtyDaysAgo.toISOString());

        const messagesByDay: Record<string, number> = {};
        messages?.forEach(m => {
            const day = new Date(m.created_at).toISOString().split("T")[0];
            messagesByDay[day] = (messagesByDay[day] || 0) + 1;
        });

        // 6. Sports Popularity
        const { data: sportCounts } = await supabase
            .from("pickup_sessions")
            .select("sport:sports(name)")
            .not("sport_id", "is", null);

        const sportPopularity: Record<string, number> = {};
        sportCounts?.forEach((s: any) => {
            const name = s.sport?.name || "Unknown";
            sportPopularity[name] = (sportPopularity[name] || 0) + 1;
        });

        // 7. Recent Activity (last 10 items)
        const { data: recentGames } = await supabase
            .from("pickup_sessions")
            .select("id, title, created_at, host:profiles(first_name, last_name)")
            .order("created_at", { ascending: false })
            .limit(5);

        const { data: recentSignups } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, created_at")
            .order("created_at", { ascending: false })
            .limit(5);

        // Build chart data (last 30 days)
        const chartData = [];
        for (let i = 29; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dayStr = date.toISOString().split("T")[0];
            chartData.push({
                date: dayStr,
                signups: signupsByDay[dayStr] || 0,
                games: gamesByDay[dayStr] || 0,
                messages: messagesByDay[dayStr] || 0
            });
        }

        return NextResponse.json({
            stats: {
                totalUsers: totalUsers || 0,
                totalGames: totalGames || 0,
                totalMessages: totalMessages || 0,
                totalPlayers: totalPlayers || 0
            },
            chartData,
            sportPopularity: Object.entries(sportPopularity).map(([name, count]) => ({ name, count })),
            recentActivity: {
                games: recentGames || [],
                signups: recentSignups || []
            }
        });
    } catch (error: any) {
        console.error("Admin stats error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
