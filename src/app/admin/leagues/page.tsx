"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CreateLeagueModal } from "@/components/leagues/CreateLeagueModal";
import { LeagueCard } from "@/components/leagues/LeagueCard";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, LayoutDashboard } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar"; // Assuming reused navbar for now

export default function LeagueDashboardPage() {
    const [leagues, setLeagues] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data, error } = await supabase
                    .from("leagues")
                    .select("*")
                    .eq("owner_id", user.id)
                    .order("created_at", { ascending: false });

                if (data) setLeagues(data);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Navbar />

            <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase flex items-center gap-2">
                            <LayoutDashboard className="h-8 w-8 text-emerald-500" />
                            League Command Center
                        </h1>
                        <p className="text-zinc-500 mt-2">Manage your seasons, teams, and schedules.</p>
                    </div>
                    <Button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold h-10 px-6"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create League
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-zinc-500">Loading your leagues...</div>
                ) : leagues.length === 0 ? (
                    <div className="border border-zinc-800 rounded-2xl p-12 text-center bg-zinc-900/20 dashed">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="h-8 w-8 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Leagues Found</h3>
                        <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
                            You haven't created any leagues yet. Start your first season to manage teams and schedules.
                        </p>
                        <Button
                            onClick={() => setIsCreateModalOpen(true)}
                            variant="outline"
                            className="border-zinc-700 hover:bg-zinc-800"
                        >
                            Create Your First League
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {leagues.map(league => (
                            <LeagueCard key={league.id} league={league} />
                        ))}
                    </div>
                )}
            </main>

            <CreateLeagueModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
