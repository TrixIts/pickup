"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    Calendar,
    Clock,
    MapPin,
    Users,
    ChevronLeft,
    Loader2,
    Trophy,
    UserPlus,
    CheckCircle2,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SessionChat } from "@/components/pickup/SessionChat";
import Link from "next/link";

export default function SessionDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [session, setSession] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [joining, setJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            const { data: userData } = await supabase.auth.getUser();
            setCurrentUser(userData.user);

            // Fetch session details
            const { data, error } = await supabase
                .from("pickup_sessions")
                .select(`
                    *,
                    sport:sports(*),
                    host:profiles(*),
                    players:pickup_session_players(role, profile_id, profiles(first_name, last_name, avatar_url))
                `)
                .eq("id", id)
                .single();

            if (data) {
                setSession(data);
                if (userData.user) {
                    setIsJoined(data.players.some((p: any) => p.profile_id === userData.user.id));
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [id, supabase]);

    const handleJoin = async () => {
        if (!currentUser) {
            router.push("/login");
            return;
        }

        setJoining(true);
        try {
            const res = await fetch("/api/pickup/join", {
                method: "POST",
                body: JSON.stringify({ sessionId: id }),
            });
            const data = await res.json();

            if (res.status === 403 && data.code === "ONBOARDING_REQUIRED") {
                router.push("/onboarding");
                return;
            }

            if (data.success || data.message === "Already joined") {
                setIsJoined(true);
                // Refresh players list
                const { data: players } = await supabase
                    .from("pickup_session_players")
                    .select("role, profile_id, profiles(first_name, last_name, avatar_url)")
                    .eq("session_id", id);
                if (players) {
                    setSession((prev: any) => ({ ...prev, players }));
                }
            } else {
                alert(data.error || "Failed to join");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4">
                <h1 className="text-2xl font-black">Session not found</h1>
                <Button asChild variant="outline">
                    <Link href="/pickup">Back to Discovery</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header / Background */}
            <div className="relative h-[300px] overflow-hidden">
                <div className="absolute inset-0 bg-zinc-900">
                    <div className="absolute inset-0 opacity-20" style={{
                        backgroundImage: "radial-gradient(#10b981 2px, transparent 2px)",
                        backgroundSize: "30px 30px"
                    }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                </div>

                <div className="absolute top-8 left-8">
                    <Button asChild variant="ghost" className="bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-black/60">
                        <Link href="/pickup">
                            <ChevronLeft className="h-4 w-4 mr-2" />
                            Back
                        </Link>
                    </Button>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                        <Badge className="bg-emerald-500 text-black font-black uppercase tracking-widest px-3 py-1">
                            {session.sport?.name}
                        </Badge>
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-500 font-bold bg-emerald-500/5">
                            {session.fee === 0 ? "Free To Play" : `$${session.fee} Entry`}
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                        {session.title}
                    </h1>
                </div>
            </div>

            <main className="container mx-auto px-4 md:px-8 -mt-8 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { icon: Calendar, label: "Date", value: new Date(session.start_time).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' }) },
                                { icon: Clock, label: "Time", value: new Date(session.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
                                { icon: MapPin, label: "Location", value: session.location },
                                { icon: Users, label: "Capacity", value: `${session.players?.length || 0} / ${session.player_limit || "∞"}` }
                            ].map((item, i) => (
                                <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 hover:border-zinc-800 transition-colors">
                                    <item.icon className="h-5 w-5 text-emerald-500 mb-3" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">{item.label}</p>
                                    <p className="font-bold text-sm truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Description */}
                        <section className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8 md:p-12">
                            <h2 className="text-2xl font-black mb-6 uppercase tracking-tight">Game Brief</h2>
                            <p className="text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                {session.description || "No specific details provided for this session yet."}
                            </p>
                        </section>

                        {/* Players */}
                        <section>
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Players Joined</h2>
                                <span className="text-emerald-500 font-bold bg-emerald-500/10 px-3 py-1 rounded-full text-xs">
                                    {session.players?.length || 0} Ready
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {session.players?.map((p: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                                            {p.profiles?.avatar_url ? (
                                                <img src={p.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Users className="h-5 w-5 text-zinc-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold truncate">
                                                {p.profiles?.first_name} {p.profiles?.last_name?.[0]}.
                                            </p>
                                            <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">
                                                {p.role === 'OWNER' ? <span className="text-emerald-500">Owner</span> : "Player"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                {(!session.players || session.players.length === 0) && (
                                    <div className="col-span-full py-12 text-center bg-zinc-950 border-2 border-dashed border-zinc-900 rounded-3xl text-zinc-600 font-medium">
                                        No players have joined yet. Be the first!
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Chat & Actions */}
                    <div className="space-y-6">
                        {/* Join Card */}
                        <div className="bg-emerald-500 rounded-[2rem] p-8 text-black shadow-[0_20px_50px_rgba(16,185,129,0.3)]">
                            <Trophy className="h-10 w-10 mb-6 drop-shadow-md" />
                            <h3 className="text-3xl font-black tracking-tighter leading-none mb-2 uppercase">
                                {isJoined ? "You're In!" : "Secure Your Spot"}
                            </h3>
                            <p className="text-black/70 text-sm font-medium mb-8">
                                {isJoined
                                    ? "You've successfully joined this session. See you on the field!"
                                    : `Limited spots available. Join now to claim one of the ${session.player_limit - (session.players?.length || 0)} gems left.`}
                            </p>

                            <Button
                                onClick={handleJoin}
                                disabled={joining || isJoined}
                                className={`w-full h-14 rounded-2xl font-black text-lg transition-all ${isJoined
                                    ? "bg-black text-emerald-500 opacity-100"
                                    : "bg-white text-black hover:bg-zinc-100 hover:scale-[1.02]"
                                    } shadow-xl`}
                            >
                                {joining ? (
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                ) : isJoined ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-6 w-6" />
                                        Joined
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-6 w-6" />
                                        Join Session
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Real-time Chat */}
                        <div className="h-[500px]">
                            {isJoined ? (
                                <SessionChat sessionId={id} seriesId={session.series_id} />
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center p-8 bg-zinc-950 border border-zinc-900 rounded-[2rem] text-center space-y-6 border-dashed opacity-50">
                                    <div className="w-16 h-16 rounded-full bg-zinc-900 flex items-center justify-center">
                                        <MessageSquare className="h-8 w-8 text-zinc-700" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-white">Locker Room Chat</h4>
                                        <p className="text-sm text-zinc-500 mt-2">Join the session to chat with other players and coordinate.</p>
                                    </div>
                                    <Button onClick={handleJoin} variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white">
                                        Join to unlocking chat
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
