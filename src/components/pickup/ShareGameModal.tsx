"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Copy,
    Check,
    Share2,
    MessageCircle,
    Mail,
    QrCode,
    Users
} from "lucide-react";

interface ShareGameModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameId: string;
    gameTitle: string;
    sportName?: string;
    startTime?: string;
}

export const ShareGameModal = ({
    isOpen,
    onClose,
    gameId,
    gameTitle,
    sportName,
    startTime,
}: ShareGameModalProps) => {
    const [copied, setCopied] = useState(false);
    const [shareUrl, setShareUrl] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined") {
            // Use the /join/ route for direct joining experience
            setShareUrl(`${window.location.origin}/join/${gameId}`);
        }
    }, [gameId]);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy:", err);
        }
    };

    const shareText = `Join me for ${sportName || "a pickup game"}! ${gameTitle}${startTime ? ` - ${new Date(startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}` : ""
        }`;

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Join: ${gameTitle}`,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                // User cancelled or error
                console.log("Share cancelled or failed:", err);
            }
        }
    };

    const handleSMSShare = () => {
        const smsBody = encodeURIComponent(`${shareText}\n${shareUrl}`);
        window.open(`sms:?&body=${smsBody}`, "_blank");
    };

    const handleEmailShare = () => {
        const subject = encodeURIComponent(`Join my pickup game: ${gameTitle}`);
        const body = encodeURIComponent(`Hey!\n\n${shareText}\n\nJoin here: ${shareUrl}`);
        window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    };

    const canNativeShare = typeof navigator !== "undefined" && navigator.share;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Users className="h-5 w-5 text-emerald-500" />
                        </div>
                        Invite Players
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Share this link to invite people to join your game. They'll be prompted to sign up if needed.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Quick Copy Link */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            Invite Link
                        </label>
                        <div className="flex gap-2">
                            <Input
                                readOnly
                                value={shareUrl}
                                className="bg-zinc-900 border-zinc-800 text-zinc-300 font-mono text-sm"
                            />
                            <Button
                                onClick={handleCopy}
                                className={`shrink-0 transition-all ${copied
                                        ? "bg-emerald-500 text-black"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                    }`}
                            >
                                {copied ? (
                                    <Check className="h-4 w-4" />
                                ) : (
                                    <Copy className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {copied && (
                            <p className="text-xs text-emerald-500 font-medium animate-in fade-in">
                                Link copied to clipboard!
                            </p>
                        )}
                    </div>

                    {/* Share Options */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                            Quick Share
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {canNativeShare && (
                                <button
                                    onClick={handleNativeShare}
                                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-95"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                        <Share2 className="h-5 w-5 text-white" />
                                    </div>
                                    <span className="text-xs font-bold text-zinc-400">Share</span>
                                </button>
                            )}
                            <button
                                onClick={handleSMSShare}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                                    <MessageCircle className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-zinc-400">Text</span>
                            </button>
                            <button
                                onClick={handleEmailShare}
                                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all active:scale-95"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                                    <Mail className="h-5 w-5 text-white" />
                                </div>
                                <span className="text-xs font-bold text-zinc-400">Email</span>
                            </button>
                        </div>
                    </div>

                    {/* Pro Tip */}
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-sm text-emerald-400">
                            <span className="font-bold">Pro tip:</span> Friends who click the link will be taken straight to join your game after signing up!
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
