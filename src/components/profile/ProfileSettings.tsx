"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Camera, Upload } from "lucide-react";

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
        const { error } = await supabase.from('profiles').update({
            first_name: profile.first_name,
            last_name: profile.last_name,
            age_range: profile.age_range,
            avatar_url: previewUrl || profile.avatar_url,
            commute_radius: parseInt(profile.commute_radius)
        }).eq('id', profile.id);

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
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase">Edit Profile</DialogTitle>
                    <DialogDescription className="text-zinc-400">Update your personal information and preferences.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col items-center">
                        <div className="relative w-24 h-24 mb-4">
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900">
                                {(previewUrl || profile.avatar_url) ? (
                                    <img src={previewUrl || profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600">
                                        <Camera className="h-8 w-8" />
                                    </div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 rounded-full cursor-pointer hover:bg-emerald-400 transition-colors">
                                <Upload className="h-3 w-3 text-black" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-zinc-400">First Name</Label>
                            <Input
                                value={profile.first_name || ''}
                                onChange={e => setProfile({ ...profile, first_name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Last Name</Label>
                            <Input
                                value={profile.last_name || ''}
                                onChange={e => setProfile({ ...profile, last_name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800 focus-visible:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-zinc-400">Age Range</Label>
                        <Select value={profile.age_range || ''} onValueChange={v => setProfile({ ...profile, age_range: v })}>
                            <SelectTrigger className="bg-zinc-900 border-zinc-800"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                                {['18-24', '25-34', '35-44', '45+'].map(age => (
                                    <SelectItem key={age} value={age}>{age}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} className="hover:bg-zinc-900">Cancel</Button>
                    <Button onClick={handleUpdate} disabled={loading} className="bg-emerald-500 text-black hover:bg-emerald-400 font-bold">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
