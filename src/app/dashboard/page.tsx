"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, ArrowRight, Trophy, Users, Loader2, Repeat } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProfileSettings } from "@/components/profile/ProfileSettings";

export default function DashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingGames, setUpcomingGames] = useState<any[]>([]);
    const [pastGames, setPastGames] = useState<any[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const supabase = createClient();

    useEffect(() => {
        const loadData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return; // Middleware might handle redirect, but safe check
            setUser(user);

            const { data: playerSessions } = await supabase
                .from('pickup_session_players')
                .select(`
                    role,
                    session:pickup_sessions (
                        *,
                        sport:sports(*),
                        players:pickup_session_players(count)
                    )
                `)
                .eq('profile_id', user.id);

            if (playerSessions) {
                const now = new Date();
                const sessions = playerSessions.map((p: any) => ({
                    ...p.session,
                    userRole: p.role,
                    playerCount: p.session.players?.[0]?.count || 0
                }));

                const upcoming = sessions
                    .filter((s: any) => new Date(s.start_time) > now)
                    .sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

                const past = sessions
                    .filter((s: any) => new Date(s.start_time) <= now)
                    .sort((a: any, b: any) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

                setUpcomingGames(upcoming);
                setPastGames(past);
            }
            setLoading(false);
        };

        loadData();
    }, [supabase]);

    return (
        <div className="min-h-screen bg-black text-white selection:bg-emerald-500/30">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                <header className="mb-12 flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">My Dashboard</h1>
                        <p className="text-zinc-400">Manage your schedule and track your games.</p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setIsSettingsOpen(true)}
                        className="border-zinc-800 bg-transparent text-zinc-300 hover:bg-zinc-900 hover:text-white"
                    >
                        Settings
                    </Button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Stats/Profile Summary */}
                    <div className="space-y-6">
                        <Card className="bg-zinc-950 border-zinc-900 overflow-hidden">
                            <CardHeader className="bg-zinc-900/50 pb-4">
                                <CardTitle className="text-lg font-black uppercase text-white flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-emerald-500" /> Player Stats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <div>
                                        <p className="text-sm font-bold text-zinc-300">Games Played</p>
                                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">All time</p>
                                    </div>
                                    <span className="text-3xl font-black text-white">{pastGames.length}</span>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900 border border-zinc-800">
                                    <div>
                                        <p className="text-sm font-bold text-zinc-300">Upcoming</p>
                                        <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Scheduled</p>
                                    </div>
                                    <span className="text-3xl font-black text-emerald-500">{upcomingGames.length}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-black shadow-lg shadow-emerald-900/20">
                            <MapPin className="h-8 w-8 mb-4 text-black/80" />
                            <h3 className="font-black text-2xl mb-2 tracking-tight">Find More Games</h3>
                            <p className="text-black/70 font-medium mb-6 leading-relaxed">
                                Browse the map to find nearby sessions fitting your schedule.
                            </p>
                            <Button asChild className="w-full bg-black text-white hover:bg-zinc-900 border-0 h-12 rounded-xl font-bold">
                                <Link href="/pickup">Explore Map</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Right Column: Games List */}
                    <div className="lg:col-span-2">
                        <Tabs defaultValue="upcoming" className="w-full">
                            <TabsList className="w-full p-1 bg-zinc-900/50 border border-zinc-900 rounded-2xl h-14 mb-8 grid grid-cols-2">
                                <TabsTrigger
                                    value="upcoming"
                                    className="rounded-xl h-full font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-black data-[state=active]:shadow-lg transition-all"
                                >
                                    Upcoming Games
                                </TabsTrigger>
                                <TabsTrigger
                                    value="history"
                                    className="rounded-xl h-full font-bold data-[state=active]:bg-zinc-800 data-[state=active]:text-white transition-all text-zinc-500 hover:text-zinc-300"
                                >
                                    History
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="upcoming" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {loading ? (
                                    <div className="text-zinc-500 text-center py-12 flex flex-col items-center gap-4">
                                        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                                        <p>Loading schedule...</p>
                                    </div>
                                ) : upcomingGames.length > 0 ? (
                                    upcomingGames.map((game) => (
                                        <GameCard key={game.id} game={game} />
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-zinc-900 rounded-3xl bg-zinc-950/50">
                                        <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center mb-4">
                                            <Calendar className="h-8 w-8 text-zinc-700" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">No upcoming games</h3>
                                        <p className="text-zinc-500 mb-6 text-center max-w-xs">You haven't joined any upcoming sessions yet.</p>
                                        <Button asChild className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold">
                                            <Link href="/pickup">Find a Game</Link>
                                        </Button>
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {pastGames.length > 0 ? (
                                    pastGames.map((game) => (
                                        <GameCard key={game.id} game={game} isPast />
                                    ))
                                ) : (
                                    <div className="text-center py-16 border-2 border-dashed border-zinc-900 rounded-3xl">
                                        <p className="text-zinc-500 font-bold">No game history yet.</p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </main>

            <ProfileSettings isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
}

function GameCard({ game, isPast }: { game: any, isPast?: boolean }) {
    return (
        <div className={`group relative flex flex-col md:flex-row gap-6 p-6 rounded-3xl border border-zinc-900 bg-zinc-950 hover:border-zinc-800 transition-all ${isPast ? 'opacity-60 grayscale hover:grayscale-0 hover:opacity-100' : ''}`}>
            <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                    <Badge className="bg-emerald-500 text-black hover:bg-emerald-400">
                        {game.sport?.name}
                    </Badge>
                    {game.userRole === 'OWNER' && (
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-500">
                            Host
                        </Badge>
                    )}
                    <span className="text-xs font-bold text-zinc-400 flex items-center gap-1 ml-auto md:ml-0">
                        <Clock className="h-3 w-3 text-emerald-500" />
                        {new Date(game.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
                {game.is_recurring && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                        <Repeat className="h-3 w-3 text-emerald-500" />
                        <span>Recurring Series</span>
                    </div>
                )}

                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">{game.title}</h3>
                    <div className="flex items-center text-sm text-zinc-400 gap-4">
                        <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-zinc-600" />
                            {new Date(game.start_time).toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-emerald-500" />
                            <span className="text-zinc-300 font-medium">{game.location}</span>
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex md:flex-col items-center justify-between gap-4 border-t md:border-t-0 md:border-l border-zinc-900 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-white">
                        <Users className="h-4 w-4 text-emerald-500" />
                        <span className="font-bold text-lg">{game.playerCount}</span>
                        <span className="text-xs text-zinc-400"> / {game.player_limit}</span>
                    </div>
                    <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Players</p>
                </div>

                <Button asChild size="sm" className={isPast ? "w-full bg-zinc-800" : "w-full bg-emerald-500 text-black hover:bg-emerald-400"}>
                    <Link href={`/pickup/${game.id}`}>
                        {isPast ? "View Stats" : "Locker Room"} <ArrowRight className="h-3 w-3 ml-2" />
                    </Link>
                </Button>
            </div>
        </div >
    );
}
