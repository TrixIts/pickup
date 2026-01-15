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
        // Note: In a real app, strict RLS would require the authenticated user to matches hostId
        // or we just use the auth.uid() from the session. 
        // For now, if hostId is "placeholder-user-id" or similar, we might need a fallback or let it fail if not nullable.
        // However, we want to allow the "Demo" to work.
        // If we can't find a user, we might create a guest session if allowed, or we must require a valid UUID.
        // Let's assume for this "Basics" setup, the user might not be logged in. 
        // We will try to fetch the current user.
        const { data: { user } } = await supabase.auth.getUser();
        let finalHostId = user?.id || hostId;

        // If still placeholder/invalid, we cannot insert into a foreign key constrained column.
        // But for the sake of the setup not crashing on "Create Game" when not logged in (if that's the flow),
        // we should error out or handle it.
        // For now, we'll try to insert. If it fails, we catch the error.

        const { data: session, error } = await supabase
            .from('pickup_sessions')
            .insert({
                title,
                sport_id: finalSportId,
                host_id: finalHostId === 'placeholder-user-id' ? null : finalHostId, // Try null if placeholder, if schema allows. If not, it will error.
                location,
                start_time: new Date(startTime).toISOString(),
                player_limit: parseInt(playerLimit),
                fee: parseFloat(fee),
                description,
                latitude,
                longitude,
                is_recurring: isRecurring,
                series_id: isRecurring ? crypto.randomUUID() : null
            })
            .select()
            .single();

        if (error) {
            console.error("Supabase insert error:", error);
            return NextResponse.json({ error: error.message }, { status: 400 });
        }

        // Add Host as SessionPlayer with OWNER role
        if (finalHostId && finalHostId !== 'placeholder-user-id') {
            await supabase.from('pickup_session_players').insert({
                session_id: session.id,
                profile_id: finalHostId,
                role: 'OWNER'
            });
        }

        return NextResponse.json(session);
    } catch (error: any) {
        console.error("Failed to create session:", error);
        return NextResponse.json({ error: error.message || "Failed to create session" }, { status: 500 });
    }
}
