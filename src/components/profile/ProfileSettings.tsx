"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, Upload } from "lucide-react";
import { AGE_RANGES, GENDERS } from "@/lib/constants";

export const ProfileSettings = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const supabase = createClient();

    useEffect(() => {
        if (!isOpen) return;
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setProfile(data);
            }
        };
        fetchProfile();
    }, [isOpen, supabase]);

    const handleUpdate = async () => {
        setLoading(true);
        const { error } = await supabase.from('profiles').upsert({
            id: profile.id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            age_range: profile.age_range,
            gender: profile.gender,
            avatar_url: previewUrl || profile.avatar_url,
            commute_radius: parseInt(profile.commute_radius),
            updated_at: new Date().toISOString()
        });

        setLoading(false);
        if (!error) {
            onClose();
            window.location.reload();
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile) return;

        setUploading(true);
        const fileExt = file.name.split('.').pop();
        const filePath = `${profile.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setPreviewUrl(publicUrl);
        }
        setUploading(false);
    };

    if (!profile) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tight">Edit Profile</DialogTitle>
                    <DialogDescription className="text-zinc-500">Update your personal information and preferences.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col items-center">
                        <div className="relative w-28 h-28 mb-4 group">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-zinc-900 bg-zinc-900 shadow-xl">
                                {(previewUrl || profile.avatar_url) ? (
                                    <img src={previewUrl || profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-800">
                                        <Camera className="h-10 w-10" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-1 right-1 p-2 bg-emerald-500 rounded-full cursor-pointer hover:bg-emerald-400 transition-all shadow-lg hover:scale-110">
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin text-black" /> : <Upload className="h-4 w-4 text-black" />}
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">First Name</Label>
                            <Input
                                value={profile.first_name || ''}
                                onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Last Name</Label>
                            <Input
                                value={profile.last_name || ''}
                                onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500 font-medium"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Age Range</Label>
                            <Select value={profile.age_range || ''} onValueChange={v => setProfile({ ...profile, age_range: v })}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-emerald-500"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    {AGE_RANGES.map(age => (
                                        <SelectItem key={age} value={age} className="focus:bg-zinc-800 focus:text-white">{age}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Gender</Label>
                            <Select value={profile.gender || ''} onValueChange={v => setProfile({ ...profile, gender: v })}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800 focus:ring-emerald-500"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                    {GENDERS.map(g => (
                                        <SelectItem key={g} value={g} className="focus:bg-zinc-800 focus:text-white">{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-2 border-t border-zinc-900">
                        <div className="flex justify-between items-center">
                            <Label className="text-xs uppercase font-bold text-zinc-500 tracking-wider">Commute Radius</Label>
                            <span className="text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded text-xs">{profile.commute_radius || 0} miles</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="50"
                            value={profile.commute_radius || 10}
                            onChange={(e) => setProfile({ ...profile, commute_radius: parseInt(e.target.value) })}
                            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-zinc-900">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-zinc-900 text-zinc-400 hover:text-white">Cancel</Button>
                    <Button onClick={handleUpdate} disabled={loading} className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold min-w-[120px]">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
