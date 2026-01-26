"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateLeagueModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CreateLeagueModal = ({ isOpen, onClose }: CreateLeagueModalProps) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        sport: "soccer",
        location: "",
        description: "",
    });

    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { error } = await supabase
                .from("leagues")
                .insert({
                    name: formData.name,
                    sport: formData.sport,
                    location: formData.location,
                    description: formData.description,
                    owner_id: user.id
                });

            if (error) throw error;

            onClose();
            router.refresh();
        } catch (error) {
            console.error(error);
            alert("Failed to create league");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-zinc-950 border-zinc-800 text-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tighter uppercase">Create a League</DialogTitle>
                    <DialogDescription className="text-zinc-500">
                        Start a new league season. You will be the commissioner.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="sport" className="text-zinc-400">Sport</Label>
                            <Select
                                onValueChange={(v) => setFormData({ ...formData, sport: v })}
                                defaultValue={formData.sport}
                            >
                                <SelectTrigger id="sport" className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Select sport" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    <SelectItem value="soccer">Soccer</SelectItem>
                                    <SelectItem value="basketball">Basketball</SelectItem>
                                    <SelectItem value="tennis">Tennis</SelectItem>
                                    <SelectItem value="volleyball">Volleyball</SelectItem>
                                    <SelectItem value="hockey">Hockey</SelectItem>
                                    <SelectItem value="lacrosse">Lacrosse</SelectItem>
                                    <SelectItem value="pickleball">Pickleball</SelectItem>
                                    <SelectItem value="ultimate frisbee">Ultimate Frisbee</SelectItem>
                                    <SelectItem value="football">Football</SelectItem>
                                    <SelectItem value="baseball">Baseball</SelectItem>
                                    <SelectItem value="softball">Softball</SelectItem>
                                    <SelectItem value="rugby">Rugby</SelectItem>
                                    <SelectItem value="badminton">Badminton</SelectItem>
                                    <SelectItem value="table tennis">Table Tennis</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-zinc-400">League Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Monday Night Co-ed"
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-zinc-400">Primary Location</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g. Memorial Park"
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-zinc-400">Description</Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Rules, format, etc."
                            className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500 min-h-[80px]"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="hover:bg-zinc-900">Cancel</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create League"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
