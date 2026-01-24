"use client";

import { useEffect, useState, use } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, Users, Trophy, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function JoinGamePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [user, setUser] = useState<any>(null);
    const [joining, setJoining] = useState(false);
    const [joinStatus, setJoinStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMessage, setErrorMessage] = useState("");

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Fetch session details regardless of auth
            const { data, error } = await supabase
                .from("pickup_sessions")
                .select(`
                    *,
                    sport:sports(*),
                    host:profiles(first_name, last_name, avatar_url),
                    players:pickup_session_players(count)
                `)
                .eq("id", id)
                .single();

            if (data) {
                setSession(data);
            }
            setLoading(false);

            // If user is logged in, attempt auto-join
            if (user && data) {
                handleAutoJoin();
            }
        };

        init();
    }, [id, supabase]);

    const handleAutoJoin = async () => {
        setJoining(true);
        try {
            const res = await fetch("/api/pickup/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId: id }),
            });
            const data = await res.json();

            if (res.status === 403 && data.code === "ONBOARDING_REQUIRED") {
                // Redirect to onboarding with return URL
                router.push(`/onboarding?returnTo=/join/${id}`);
                return;
            }

            if (data.success || data.message === "Already joined") {
                setJoinStatus("success");
                // Redirect to session page after brief success state
                setTimeout(() => {
                    router.push(`/pickup/${id}`);
                }, 1500);
            } else {
                setJoinStatus("error");
                setErrorMessage(data.error || "Unable to join this game");
            }
        } catch (error: any) {
            setJoinStatus("error");
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setJoining(false);
        }
    };

    const handleLoginToJoin = () => {
        // Encode the return URL to come back here after login
        const returnUrl = encodeURIComponent(`/join/${id}`);
        router.push(`/login?returnTo=${returnUrl}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto" />
                    <p className="text-zinc-500 font-medium">Loading game details...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-zinc-900 flex items-center justify-center">
                        <Trophy className="h-10 w-10 text-zinc-700" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Game Not Found</h1>
                    <p className="text-zinc-500">
                        This game may have been cancelled or the link is invalid.
                    </p>
                    <Button asChild className="bg-emerald-500 text-black font-bold hover:bg-emerald-400">
                        <Link href="/pickup">Find Other Games</Link>
                    </Button>
                </div>
            </div>
        );
    }

    const playerCount = session.players?.[0]?.count || 0;
    const isFull = session.player_limit && playerCount >= session.player_limit;

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Hero Section */}
            <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-400">
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
                            backgroundSize: "24px 24px",
                        }}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge className="bg-black/30 backdrop-blur-md text-white font-bold border-0">
                                {session.sport?.name}
                            </Badge>
                            {session.fee === 0 ? (
                                <Badge className="bg-white/20 backdrop-blur-md text-white font-bold border-0">
                                    Free
                                </Badge>
                            ) : (
                                <Badge className="bg-white/20 backdrop-blur-md text-white font-bold border-0">
                                    ${session.fee} Entry
                                </Badge>
                            )}
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-tight text-black">
                            {session.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-2xl mx-auto px-6 py-8 -mt-4 relative z-10">
                {/* Game Details Card */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 mb-6 space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">When</p>
                            <p className="font-bold text-lg">
                                {new Date(session.start_time).toLocaleDateString([], {
                                    weekday: "long",
                                    month: "long",
                                    day: "numeric",
                                })}{" "}
                                at{" "}
                                {new Date(session.start_time).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <MapPin className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Where</p>
                            <p className="font-bold text-lg truncate">{session.location}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                            <Users className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600">Players</p>
                            <p className="font-bold text-lg">
                                {playerCount} / {session.player_limit || "∞"}{" "}
                                {isFull && <span className="text-red-500 text-sm">(Full)</span>}
                            </p>
                        </div>
                    </div>

                    {session.host && (
                        <div className="pt-4 border-t border-zinc-800 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                {session.host.avatar_url ? (
                                    <img
                                        src={session.host.avatar_url}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-sm font-bold text-zinc-500">
                                        {session.host.first_name?.[0]}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-zinc-500">Hosted by</p>
                                <p className="font-bold">
                                    {session.host.first_name} {session.host.last_name?.[0]}.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Section */}
                <div className="space-y-4">
                    {user ? (
                        // User is logged in
                        joinStatus === "success" ? (
                            <div className="bg-emerald-500 rounded-3xl p-6 text-center text-black">
                                <div className="w-16 h-16 mx-auto rounded-full bg-black/20 flex items-center justify-center mb-4">
                                    <Trophy className="h-8 w-8" />
                                </div>
                                <h2 className="text-2xl font-black mb-2">You're In!</h2>
                                <p className="text-black/70 font-medium">
                                    Taking you to the locker room...
                                </p>
                                <Loader2 className="h-5 w-5 animate-spin mx-auto mt-4" />
                            </div>
                        ) : joinStatus === "error" ? (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-6 text-center">
                                <h2 className="text-xl font-bold text-red-500 mb-2">
                                    Couldn't Join
                                </h2>
                                <p className="text-zinc-400 mb-4">{errorMessage}</p>
                                <Button
                                    onClick={() => router.push(`/pickup/${id}`)}
                                    variant="outline"
                                    className="border-zinc-700"
                                >
                                    View Game Details
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 text-center">
                                <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-4" />
                                <p className="text-zinc-400 font-medium">Joining game...</p>
                            </div>
                        )
                    ) : (
                        // User is not logged in - show login CTA
                        <div className="space-y-4">
                            <Button
                                onClick={handleLoginToJoin}
                                className="w-full h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-lg transition-all hover:scale-[1.02] shadow-lg shadow-emerald-500/20"
                            >
                                Sign Up to Join
                                <ChevronRight className="h-6 w-6 ml-2" />
                            </Button>
                            <p className="text-center text-sm text-zinc-500">
                                Already have an account?{" "}
                                <button
                                    onClick={handleLoginToJoin}
                                    className="text-emerald-500 font-bold hover:underline"
                                >
                                    Sign in
                                </button>
                            </p>
                        </div>
                    )}
                </div>

                {/* Description if available */}
                {session.description && (
                    <div className="mt-8 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl">
                        <h3 className="text-sm font-black uppercase tracking-widest text-zinc-500 mb-3">
                            About This Game
                        </h3>
                        <p className="text-zinc-400 whitespace-pre-wrap">{session.description}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
