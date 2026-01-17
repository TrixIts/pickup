import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: sessions, error } = await supabase
            .from('pickup_sessions')
            .select(`
                *,
                sport:sports(*),
                host:profiles(*),
                players:pickup_session_players(count)
            `)
            .order('start_time', { ascending: true });

        if (error) throw error;

        // Transform data to match expected frontend format if necessary
        const formattedSessions = sessions?.map(session => ({
            ...session,
            startTime: session.start_time, // map snake_case to camelCase for frontend compatibility if needed
            playerLimit: session.player_limit,
            _count: {
                players: session.players?.[0]?.count ?? 0
            }
        }));

        return NextResponse.json(formattedSessions);
    } catch (error) {
        console.error("Failed to fetch sessions:", error);
        // Return mock data for now if DB is not connected or empty
        return NextResponse.json([
            {
                id: "1",
                sport: { name: "Soccer" },
                title: "5v5 Competitive Turf (Mock)",
                location: "Silver Lake Meadow",
                startTime: new Date().toISOString(),
                players: [],
                _count: { players: 8 },
                playerLimit: 10,
                fee: "5.00",
                level: "Intermediate"
            }
        ]);
    }
}


// ... (previous imports)

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { title, sportId, hostId, location, startTime, playerLimit, fee, description, latitude, longitude, isRecurring } = body;

        // Lookup sport ID if a name is provided (naive check if it's not a UUID)
        let finalSportId = sportId;
        if (sportId && !sportId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            const { data: sport } = await supabase
                .from('sports')
                .select('id')
                .ilike('name', sportId)
                .single();
            if (sport) {
                finalSportId = sport.id;
            }
        }

        // Handle Host ID
        const { data: { user } } = await supabase.auth.getUser();
        let finalHostId = user?.id || hostId;

        // Recurrence Logic
        const seriesId = isRecurring ? crypto.randomUUID() : null;
        const sessionsToCreate = isRecurring ? 4 : 1;
        const createdSessions = [];

        let baseDate = new Date(startTime);

        for (let i = 0; i < sessionsToCreate; i++) {
            const currentStartTime = new Date(baseDate);
            currentStartTime.setDate(baseDate.getDate() + (i * 7));

            const { data: session, error } = await supabase
                .from('pickup_sessions')
                .insert({
                    title,
                    sport_id: finalSportId,
                    host_id: finalHostId === 'placeholder-user-id' ? null : finalHostId,
                    location,
                    start_time: currentStartTime.toISOString(),
                    player_limit: parseInt(playerLimit),
                    fee: parseFloat(fee),
                    description,
                    latitude,
                    longitude,
                    is_recurring: isRecurring,
                    series_id: seriesId
                })
                .select()
                .single();

            if (error) {
                console.error("Supabase insert error:", error);
                // If one fails, we stop? Or continue? For now, we'll return error.
                // In a real app we might want a transaction.
                return NextResponse.json({ error: error.message }, { status: 400 });
            }

            createdSessions.push(session);

            // Add Host as SessionPlayer with OWNER role for EACH session
            if (finalHostId && finalHostId !== 'placeholder-user-id') {
                await supabase.from('pickup_session_players').insert({
                    session_id: session.id,
                    profile_id: finalHostId,
                    role: 'OWNER'
                });
            }
        }

        return NextResponse.json(createdSessions[0]); // Return the first one for redirection
    } catch (error: any) {
        console.error("Failed to create session:", error);
        return NextResponse.json({ error: error.message || "Failed to create session" }, { status: 500 });
    }
}
