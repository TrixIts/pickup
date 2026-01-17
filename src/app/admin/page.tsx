"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
    Users,
    Gamepad2,
    MessageSquare,
    UserCheck,
    TrendingUp,
    Activity,
    Search,
    ChevronLeft,
    ChevronRight,
    Shield,
    Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";
import Link from "next/link";

interface Stats {
    totalUsers: number;
    totalGames: number;
    totalMessages: number;
    totalPlayers: number;
}

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    is_admin: boolean;
    created_at: string;
    age_range: string;
    gender: string;
    location: string;
}

export default function AdminPage() {
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [stats, setStats] = useState<Stats | null>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [sportData, setSportData] = useState<any[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [userSearch, setUserSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [usersLoading, setUsersLoading] = useState(false);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }

            const { data: profile } = await supabase
                .from("profiles")
                .select("is_admin")
                .eq("id", user.id)
                .single();

            if (!profile?.is_admin) {
                router.push("/dashboard");
                return;
            }

            setIsAdmin(true);
            fetchStats();
            fetchUsers();
        };

        checkAdmin();
    }, []);

    const fetchStats = async () => {
        const res = await fetch("/api/admin/stats");
        if (res.ok) {
            const data = await res.json();
            setStats(data.stats);
            setChartData(data.chartData);
            setSportData(data.sportPopularity);
        }
        setLoading(false);
    };

    const fetchUsers = async (search = "", page = 1) => {
        setUsersLoading(true);
        const res = await fetch(`/api/admin/users?search=${search}&page=${page}&limit=10`);
        if (res.ok) {
            const data = await res.json();
            setUsers(data.users);
            setTotalPages(data.totalPages);
            setCurrentPage(data.page);
        }
        setUsersLoading(false);
    };

    const toggleAdmin = async (userId: string, currentStatus: boolean) => {
        await fetch("/api/admin/users", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, updates: { is_admin: !currentStatus } })
        });
        fetchUsers(userSearch, currentPage);
    };

    if (loading || !isAdmin) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
        );
    }

    const statCards = [
        { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
        { label: "Games Created", value: stats?.totalGames || 0, icon: Gamepad2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Messages Sent", value: stats?.totalMessages || 0, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
        { label: "Players Joined", value: stats?.totalPlayers || 0, icon: UserCheck, color: "text-amber-500", bg: "bg-amber-500/10" }
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Header */}
            <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-xl">
                                <Shield className="h-6 w-6 text-red-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black tracking-tight">Admin Dashboard</h1>
                                <p className="text-xs text-zinc-500">Analytics & User Management</p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => (
                        <div key={i} className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 hover:border-zinc-800 transition-colors">
                            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <p className="text-3xl font-black">{card.value.toLocaleString()}</p>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">{card.label}</p>
                        </div>
                    ))}
                </div>

                {/* Charts */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Activity Over Time */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                            <h2 className="font-black text-lg">Activity (Last 30 Days)</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis dataKey="date" stroke="#71717a" fontSize={10} tickFormatter={(v) => v.slice(5)} />
                                <YAxis stroke="#71717a" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                                    labelStyle={{ color: "#a1a1aa" }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="signups" stroke="#3b82f6" strokeWidth={2} dot={false} name="Signups" />
                                <Line type="monotone" dataKey="games" stroke="#10b981" strokeWidth={2} dot={false} name="Games" />
                                <Line type="monotone" dataKey="messages" stroke="#a855f7" strokeWidth={2} dot={false} name="Messages" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Sports Popularity */}
                    <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Activity className="h-5 w-5 text-emerald-500" />
                            <h2 className="font-black text-lg">Sports Popularity</h2>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={sportData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                <XAxis type="number" stroke="#71717a" fontSize={10} />
                                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={80} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px" }}
                                />
                                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* User Management */}
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-emerald-500" />
                            <h2 className="font-black text-lg">User Management</h2>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => {
                                    setUserSearch(e.target.value);
                                    fetchUsers(e.target.value, 1);
                                }}
                                className="pl-10 bg-zinc-900 border-zinc-800 rounded-xl"
                            />
                        </div>
                    </div>

                    {usersLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-zinc-800 text-left">
                                            <th className="pb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">User</th>
                                            <th className="pb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                                            <th className="pb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider hidden lg:table-cell">Location</th>
                                            <th className="pb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</th>
                                            <th className="pb-3 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-900">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-zinc-900/50">
                                                <td className="py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                                                            {user.avatar_url ? (
                                                                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <Users className="h-5 w-5 text-zinc-600" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold">{user.first_name} {user.last_name}</p>
                                                            <p className="text-xs text-zinc-500 md:hidden">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-4 hidden md:table-cell">
                                                    <p className="text-sm text-zinc-400">{user.email}</p>
                                                </td>
                                                <td className="py-4 hidden lg:table-cell">
                                                    <p className="text-sm text-zinc-500 truncate max-w-[200px]">{user.location || "—"}</p>
                                                </td>
                                                <td className="py-4">
                                                    {user.is_admin ? (
                                                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Admin</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="border-zinc-700 text-zinc-400">Player</Badge>
                                                    )}
                                                </td>
                                                <td className="py-4 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleAdmin(user.id, user.is_admin)}
                                                        className={user.is_admin ? "text-red-500 hover:text-red-400" : "text-zinc-400 hover:text-white"}
                                                    >
                                                        {user.is_admin ? "Remove Admin" : "Make Admin"}
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-900">
                                <p className="text-sm text-zinc-500">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === 1}
                                        onClick={() => fetchUsers(userSearch, currentPage - 1)}
                                        className="border-zinc-800"
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={currentPage === totalPages}
                                        onClick={() => fetchUsers(userSearch, currentPage + 1)}
                                        className="border-zinc-800"
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
