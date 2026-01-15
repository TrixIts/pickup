"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

export const GetStartedButton = () => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
            >
                Get Started
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-sm bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden gap-0">
                    <DialogHeader className="p-6 pb-2 text-center">
                        <DialogTitle className="text-xl font-black tracking-tight">Join Pickup League</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Create an account to start playing, or sign in if you're already a member.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 pt-2 space-y-3">
                        <Link
                            href="/login?signup=true"
                            className="flex items-center justify-between w-full p-4 rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 transition-colors group"
                        >
                            <div className="font-bold flex flex-col items-start">
                                <span>I'm new here</span>
                                <span className="text-[10px] font-medium opacity-70">Create a new account</span>
                            </div>
                            <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        </Link>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-950 px-2 text-zinc-500">Or</span>
                            </div>
                        </div>

                        <Link
                            href="/login"
                            className="flex items-center justify-between w-full p-4 rounded-xl border border-zinc-800 hover:bg-zinc-900 transition-colors group"
                        >
                            <div className="font-bold flex flex-col items-start">
                                <span>I have an account</span>
                                <span className="text-[10px] font-medium text-zinc-500">Sign back in</span>
                            </div>
                            <LogIn className="h-5 w-5 text-zinc-500 group-hover:text-white transition-colors" />
                        </Link>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
