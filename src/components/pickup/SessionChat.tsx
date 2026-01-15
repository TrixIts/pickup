"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Message {
    id: string;
    content: string;
    created_at: string;
    profile_id: string;
    profiles: {
        first_name: string;
        last_name: string;
        avatar_url: string | null;
    } | null;
}

interface SessionChatProps {
    sessionId: string;
    seriesId: string | null;
}

export const SessionChat = ({ sessionId, seriesId }: SessionChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    useEffect(() => {
        const fetchMessages = async () => {
            const { data: userData } = await supabase.auth.getUser();
            setCurrentUser(userData.user);

            // Fetch history: If seriesId exists, fetch for the series. Otherwise, fetch for sessionId.
            const query = seriesId
                ? supabase.from("session_messages").select("*, profiles(first_name, last_name, avatar_url)").eq("series_id", seriesId)
                : supabase.from("session_messages").select("*, profiles(first_name, last_name, avatar_url)").eq("session_id", sessionId);

            const { data, error } = await query.order("created_at", { ascending: true });

            if (data) setMessages(data as any);
            setLoading(false);
        };

        fetchMessages();

        // Subscribe to real-time updates
        const channel = supabase
            .channel(`session-${sessionId}`)
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "session_messages",
                    filter: seriesId ? `series_id=eq.${seriesId}` : `session_id=eq.${sessionId}`
                },
                async (payload) => {
                    // Fetch profile info for the new message
                    const { data: profile } = await supabase
                        .from("profiles")
                        .select("first_name, last_name, avatar_url")
                        .eq("id", payload.new.profile_id)
                        .single();

                    const messageWithProfile = {
                        ...payload.new,
                        profiles: profile
                    } as Message;

                    setMessages(prev => [...prev, messageWithProfile]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [sessionId, seriesId, supabase]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !currentUser) return;

        const content = newMessage.trim();
        setNewMessage("");

        const { error } = await supabase.from("session_messages").insert({
            session_id: sessionId,
            series_id: seriesId,
            profile_id: currentUser.id,
            content
        });

        if (error) {
            console.error("Error sending message:", error);
        }
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-zinc-950/50 border border-zinc-900 rounded-3xl overflow-hidden backdrop-blur-md">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-900 bg-black/50 flex items-center justify-between">
                <h3 className="font-black text-sm uppercase tracking-widest text-emerald-500">Session Chat</h3>
                <span className="text-[10px] text-zinc-500 font-bold bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    {messages.length} Messages
                </span>
            </div>

            {/* Messages */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800"
            >
                {messages.map((msg) => {
                    const isMe = msg.profile_id === currentUser?.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`flex gap-3 max-w-[80%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                <div className="shrink-0">
                                    {msg.profiles?.avatar_url ? (
                                        <img src={msg.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full border border-zinc-800" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                                            <User className="h-4 w-4 text-zinc-600" />
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className={`flex items-center gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase">
                                            {isMe ? "You" : (msg.profiles?.first_name || "User")}
                                        </span>
                                        <span className="text-[8px] text-zinc-700">
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`
                                        px-4 py-2 rounded-2xl text-sm
                                        ${isMe
                                            ? "bg-emerald-500 text-black font-medium rounded-tr-none shadow-[0_4px_12px_rgba(16,185,129,0.2)]"
                                            : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none"}
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 bg-black/50 border-t border-zinc-900">
                <div className="relative">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="bg-zinc-900 border-zinc-800 text-white rounded-2xl pr-12 focus-visible:ring-emerald-500 h-12"
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={!newMessage.trim()}
                        className="absolute right-1 top-1 bottom-1 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl w-10 h-10"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
};
