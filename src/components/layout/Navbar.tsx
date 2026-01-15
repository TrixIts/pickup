"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Calendar, Trophy, MapPin } from "lucide-react";

// Navbar component
export const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();
                setProfile(data);
            }
        };
        getUser();
    }, [supabase]);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
            <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500" />
                    <span className="text-xl font-black tracking-tighter text-white uppercase">Pickup.</span>
                </Link>

                <div className="hidden md:flex items-center gap-6 text-sm font-bold">
                    <Link
                        href="/pickup"
                        className={`transition-colors flex items-center gap-2 ${isActive('/pickup') ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <MapPin className="h-4 w-4" />
                        Find Games
                    </Link>
                    <Link
                        href="/dashboard"
                        className={`transition-colors flex items-center gap-2 ${isActive('/dashboard') ? 'text-emerald-500' : 'text-zinc-400 hover:text-white'}`}
                    >
                        <Calendar className="h-4 w-4" />
                        Dashboard
                    </Link>
                </div>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10 border border-zinc-700">
                                    <AvatarImage src={profile?.avatar_url} alt={profile?.first_name} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-400 font-bold">
                                        {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-zinc-950 border-zinc-800 text-white" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-bold leading-none">{profile?.first_name} {profile?.last_name}</p>
                                    <p className="text-xs leading-none text-zinc-400">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem asChild className="focus:bg-zinc-900 focus:text-emerald-500 cursor-pointer">
                                <Link href="/dashboard">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    Profile & Dashboard
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled className="focus:bg-zinc-900 focus:text-white opacity-50">
                                <Trophy className="mr-2 h-4 w-4" />
                                League Stats (Coming Soon)
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-800" />
                            <DropdownMenuItem className="focus:bg-red-900/20 focus:text-red-500 cursor-pointer text-red-500" onClick={handleSignOut}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-sm font-bold text-zinc-400 hover:text-white">
                            Sign In
                        </Link>
                        <Button asChild className="rounded-full bg-white text-black font-bold hover:bg-zinc-200">
                            <Link href="/login?signup=true">Join Now</Link>
                        </Button>
                    </div>
                )}
            </div>
        </nav>
    );
};
