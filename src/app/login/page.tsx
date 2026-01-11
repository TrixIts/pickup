
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push("/pickup");
            router.refresh();
        }
    };

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            // Redirect to callback route to handle email verification link if needed
            options: {
                emailRedirectTo: `${location.origin}/auth/callback`,
            },
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            // Automatically sign in if email confirmation is disabled, or show message
            // For now, assume it might work or require check
            setError("Check your email for a confirmation link (if enabled), or simpler: try logging in if you disabled verification.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black text-white p-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-8 shadow-xl">
                <div className="text-center">
                    <h2 className="text-3xl font-black tracking-tighter">Welcome Back</h2>
                    <p className="mt-2 text-sm text-zinc-400">Sign in to list games and manage your league.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-emerald-500"
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="bg-zinc-900 border-zinc-800 text-white focus-visible:ring-emerald-500"
                        />
                    </div>

                    {error && (
                        <div className="text-sm text-red-500 font-medium text-center">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-4">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-emerald-500 text-black font-bold hover:bg-emerald-400"
                        >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={loading}
                            onClick={handleSignUp}
                            className="flex-1 border-zinc-800 bg-transparent text-white hover:bg-zinc-900"
                        >
                            Sign Up
                        </Button>
                    </div>
                </form>

                <div className="text-center">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
