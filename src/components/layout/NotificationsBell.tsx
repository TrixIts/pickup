"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bell } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { subscribeToPush } from "@/lib/push";

interface Notification {
    id: string;
    type: "CHAT" | "LOCATION_UPDATE" | "TIME_UPDATE" | "GAME_UPDATE";
    message: string;
    link: string;
    read: boolean;
    created_at: string;
}

export const NotificationsBell = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [open, setOpen] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleEnablePush = async () => {
        const supported = await subscribeToPush();
        if (supported) {
            alert("Push notifications enabled!");
        } else {
            alert("Push notifications not supported or permission denied.");
        }
    };

    useEffect(() => {
        let channel: any;

        const setup = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Fetch initial
            const { data } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(20);

            if (data) {
                setNotifications(data as Notification[]);
                setUnreadCount(data.filter((n: any) => !n.read).length);
            }

            // Realtime
            channel = supabase
                .channel(`notifications-${user.id}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${user.id}`
                    },
                    (payload) => {
                        const newNotif = payload.new as Notification;
                        setNotifications(prev => [newNotif, ...prev]);
                        setUnreadCount(prev => prev + 1);

                        // Optional: Play sound or show browser toast here
                    }
                )
                .subscribe();
        };

        setup();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, [supabase]);

    const handleMarkAsRead = async () => {
        if (unreadCount === 0) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Optimistic update
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));

        await supabase
            .from("notifications")
            .update({ read: true })
            .eq("user_id", user.id)
            .eq("read", false);

        router.refresh();
    };

    return (
        <DropdownMenu open={open} onOpenChange={(val) => {
            setOpen(val);
            if (val) handleMarkAsRead();
        }}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 border border-black animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 bg-zinc-950 border-zinc-800 text-white" align="end">
                <DropdownMenuLabel className="flex justify-between items-center">
                    <span>Notifications</span>
                    {unreadCount > 0 && <span className="text-xs bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full">{unreadCount} new</span>}
                </DropdownMenuLabel>
                <div className="px-2 py-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                        onClick={handleEnablePush}
                    >
                        Enable Push Notifications
                    </Button>
                </div>
                <DropdownMenuSeparator className="bg-zinc-800" />
                <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-zinc-500">
                            No notifications yet
                        </div>
                    ) : (
                        notifications.map((n) => (
                            <DropdownMenuItem key={n.id} asChild className="p-3 cursor-pointer focus:bg-zinc-900 focus:text-white">
                                <Link href={n.link} className="flex flex-col gap-1 items-start">
                                    <div className="flex justify-between w-full">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${n.type === 'CHAT' ? 'text-blue-500' :
                                            n.type === 'LOCATION_UPDATE' ? 'text-amber-500' :
                                                'text-emerald-500'
                                            }`}>
                                            {n.type.replace('_', ' ')}
                                        </span>
                                        <span className="text-[10px] text-zinc-600">
                                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${!n.read ? 'font-bold text-white' : 'text-zinc-400'}`}>
                                        {n.message}
                                    </p>
                                </Link>
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
