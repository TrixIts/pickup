"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Check,
    ChevronRight,
    ChevronLeft,
    MapPin,
    Trophy,
    Users,
    Activity,
    Camera,
    CheckCircle2,
    Upload
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LocationSearch } from "@/components/pickup/LocationSearch";

const STEPS = [
    { id: "basic", title: "Basic Info" },
    { id: "demographics", title: "Demographics" },
    { id: "sports", title: "Your Sports" },
    { id: "skills", title: "Skill Levels" },
    { id: "location", title: "Location" },
    { id: "leagues", title: "Leagues" },
    { id: "final", title: "Finalize" }
];

import { AGE_RANGES, GENDERS, SKILL_LEVELS } from "@/lib/constants";

export const Onboarding = () => {
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [sports, setSports] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        ageRange: "",
        gender: "",
        selectedSports: [] as string[],
        sportSkills: {} as Record<string, string>,
        location: "",
        lat: 0,
        lng: 0,
        commuteRadius: 10,
        interestedInLeagues: false,
        avatarUrl: ""
    });
    const [uploading, setUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // Pre-populate names from Google/OAuth metadata if possible
                const meta = user.user_metadata;
                setFormData(prev => ({
                    ...prev,
                    firstName: prev.firstName || meta?.full_name?.split(" ")[0] || meta?.first_name || "",
                    lastName: prev.lastName || meta?.full_name?.split(" ").slice(1).join(" ") || meta?.last_name || "",
                }));
            }

            const { data } = await supabase.from("sports").select("*");
            if (data) setSports(data);
        };
        init();
    }, []);

    const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS.length - 1));
    const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

    const handleSportToggle = (sportId: string) => {
        setFormData(prev => {
            const isSelected = prev.selectedSports.includes(sportId);
            const newSports = isSelected
                ? prev.selectedSports.filter(id => id !== sportId)
                : [...prev.selectedSports, sportId];

            // Cleanup skills if sport removed
            const newSkills = { ...prev.sportSkills };
            if (isSelected) delete newSkills[sportId];
            else newSkills[sportId] = "INTERMEDIATE";

            return { ...prev, selectedSports: newSports, sportSkills: newSkills };
        });
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        // Preview
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(file);

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error("Upload error:", uploadError);
        } else {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
            setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
        }
        setUploading(false);
    };

    const handleSave = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return;

        // 1. Upsert Profile (to handle cases where trigger didn't create it)
        const { error: profileError } = await supabase.from("profiles").upsert({
            id: user.id,
            email: user.email,
            first_name: formData.firstName,
            last_name: formData.lastName,
            age_range: formData.ageRange,
            gender: formData.gender,
            location: formData.location,
            latitude: formData.lat,
            longitude: formData.lng,
            commute_radius: formData.commuteRadius,
            interested_in_leagues: formData.interestedInLeagues,
            avatar_url: formData.avatarUrl,
            updated_at: new Date().toISOString()
        });

        if (profileError) {
            console.error("Profile update error:", profileError);
            alert("Error saving profile: " + profileError.message);
            setLoading(false);
            return;
        }

        // 2. Clear old skills and insert new ones
        await supabase.from("sport_skills").delete().eq("profile_id", user.id);

        const skillsToInsert = formData.selectedSports.map(sportId => ({
            profile_id: user.id,
            sport_id: sportId,
            level: formData.sportSkills[sportId]
        }));

        if (skillsToInsert.length > 0) {
            const { error: skillError } = await supabase.from("sport_skills").insert(skillsToInsert);
            if (skillError) console.error("Skill insert error:", skillError);
        }

        setLoading(false);
        router.push("/pickup");
        router.refresh();
    };

    const progress = ((currentStep + 1) / STEPS.length) * 100;

    return (
        <div className="max-w-xl mx-auto min-h-[600px] flex flex-col">
            {/* Progress Bar */}
            <div className="mb-12">
                <div className="flex justify-between mb-4">
                    {STEPS.map((step, i) => (
                        <div key={step.id} className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full mb-2 transition-colors duration-500 ${i <= currentStep ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-800"}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${i === currentStep ? "text-emerald-500" : "text-zinc-600"}`}>
                                {step.title}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <motion.div
                        className="h-full bg-emerald-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                    />
                </div>
            </div>

            <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                    {/* Step 1: Basic Info */}
                    {currentStep === 0 && (
                        <motion.div
                            key="basic"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-white">First, the basics</h2>
                                <p className="text-zinc-400">What should we call you?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">First Name</Label>
                                    <Input
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 h-12 focus:ring-emerald-500"
                                        placeholder="Jordan"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Last Name</Label>
                                    <Input
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        className="bg-zinc-900 border-zinc-800 h-12 focus:ring-emerald-500"
                                        placeholder="Smith"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Demographics */}
                    {currentStep === 1 && (
                        <motion.div
                            key="demo"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-white">A bit more about you</h2>
                                <p className="text-zinc-400">This helps us match you with the right leagues.</p>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-emerald-500 font-bold uppercase text-xs tracking-widest">Age Range</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {AGE_RANGES.map((range) => (
                                        <button
                                            key={range}
                                            onClick={() => setFormData({ ...formData, ageRange: range })}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all ${formData.ageRange === range
                                                ? "bg-emerald-500 border-emerald-400 text-black"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                                }`}
                                        >
                                            {range}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-emerald-500 font-bold uppercase text-xs tracking-widest">Gender</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {GENDERS.map((gender) => (
                                        <button
                                            key={gender}
                                            onClick={() => setFormData({ ...formData, gender: gender })}
                                            className={`p-3 rounded-xl border text-sm font-bold transition-all ${formData.gender === gender
                                                ? "bg-emerald-500 border-emerald-400 text-black"
                                                : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                                }`}
                                        >
                                            {gender}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Sports */}
                    {currentStep === 2 && (
                        <motion.div
                            key="sports"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-white">What do you play?</h2>
                                <p className="text-zinc-400">Select all that apply.</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {sports.map((sport) => (
                                    <button
                                        key={sport.id}
                                        onClick={() => handleSportToggle(sport.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${formData.selectedSports.includes(sport.id)
                                            ? "bg-emerald-500/10 border-emerald-500 text-emerald-500"
                                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${formData.selectedSports.includes(sport.id) ? "bg-emerald-500 text-black" : "bg-zinc-800"
                                            }`}>
                                            <Activity className="h-5 w-5" />
                                        </div>
                                        <span className="font-bold">{sport.name}</span>
                                        {formData.selectedSports.includes(sport.id) && <Check className="h-4 w-4 ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Skills */}
                    {currentStep === 3 && (
                        <motion.div
                            key="skills"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-white">Level up</h2>
                                <p className="text-zinc-400">Be honest! This helps everyone have a discovery experience.</p>
                            </div>

                            <div className="space-y-8 max-h-[400px] overflow-y-auto pr-2">
                                {formData.selectedSports.map(sportId => {
                                    const sport = sports.find(s => s.id === sportId);
                                    return (
                                        <div key={sportId} className="space-y-4 p-6 bg-zinc-900/50 rounded-2xl border border-zinc-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Trophy className="h-4 w-4 text-emerald-500" />
                                                <h3 className="font-bold text-lg">{sport?.name}</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {SKILL_LEVELS.map(level => (
                                                    <button
                                                        key={level}
                                                        onClick={() => setFormData({
                                                            ...formData,
                                                            sportSkills: { ...formData.sportSkills, [sportId]: level }
                                                        })}
                                                        className={`p-3 rounded-xl border text-[10px] font-black tracking-tighter transition-all ${formData.sportSkills[sportId] === level
                                                            ? "bg-emerald-500 border-emerald-400 text-black ring-4 ring-emerald-500/20"
                                                            : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                                                            }`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {formData.selectedSports.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-zinc-500">Go back and select some sports first!</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 5: Location */}
                    {currentStep === 4 && (
                        <motion.div
                            key="loc"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-white">Where do you play?</h2>
                                <p className="text-zinc-400">We'll recommend games in your area.</p>
                            </div>
                            <div className="space-y-6">
                                <LocationSearch
                                    onSelectLocation={(loc, lat, lng) => setFormData({ ...formData, location: loc, lat, lng })}
                                    defaultValue={formData.location}
                                />
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-zinc-400">Commute Radius</Label>
                                        <span className="text-emerald-500 font-bold">{formData.commuteRadius} miles</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="50"
                                        value={formData.commuteRadius}
                                        onChange={(e) => setFormData({ ...formData, commuteRadius: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 6: Leagues */}
                    {currentStep === 5 && (
                        <motion.div
                            key="leagues"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-white">Go Pro?</h2>
                                <p className="text-zinc-400">Interested in joining official competitive leagues later?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setFormData({ ...formData, interestedInLeagues: true })}
                                    className={`p-8 rounded-3xl border flex flex-col items-center gap-4 transition-all ${formData.interestedInLeagues
                                        ? "bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/20"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                        }`}
                                >
                                    <Trophy className="h-10 w-10" />
                                    <span className="font-black text-xl">Yes, definitely!</span>
                                </button>
                                <button
                                    onClick={() => setFormData({ ...formData, interestedInLeagues: false })}
                                    className={`p-8 rounded-3xl border flex flex-col items-center gap-4 transition-all ${!formData.interestedInLeagues
                                        ? "bg-zinc-800 border-zinc-700 text-white"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                                        }`}
                                >
                                    <Users className="h-10 w-10" />
                                    <span className="font-bold text-xl text-zinc-500">Just for fun</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 7: Finalize */}
                    {currentStep === 6 && (
                        <motion.div
                            key="final"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-8"
                        >
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black tracking-tight text-white">Almost there!</h2>
                                <p className="text-zinc-400">Ready to start discovering games?</p>
                            </div>
                            <div className="bg-zinc-900/50 rounded-3xl p-8 border border-zinc-800 text-center space-y-6">
                                <div className="relative w-32 h-32 mx-auto">
                                    <div className="w-full h-full rounded-full bg-emerald-500/10 flex items-center justify-center border-4 border-zinc-800 overflow-hidden">
                                        {previewUrl ? (
                                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : formData.avatarUrl ? (
                                            <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera className="h-10 w-10 text-emerald-500/50" />
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-black rounded-full cursor-pointer hover:bg-emerald-400 transition-all shadow-lg">
                                        <Upload className="h-4 w-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-black text-xl text-white">
                                        {uploading ? "Uploading..." : "Show your face!"}
                                    </h3>
                                    <p className="text-zinc-500 text-sm mt-1">Upload a profile photo so others can recognize you on the field.</p>
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {formData.selectedSports.map(id => (
                                        <span key={id} className="text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full border border-emerald-500/20">
                                            {sports.find(s => s.id === id)?.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="mt-12 flex items-center justify-between pt-8 border-t border-zinc-900">
                <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 0 || loading}
                    className="text-zinc-500 hover:text-white hover:bg-zinc-900"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                </Button>

                {currentStep === STEPS.length - 1 ? (
                    <Button
                        onClick={async () => {
                            if (!formData.ageRange || !formData.gender || !formData.firstName) {
                                alert("Please make sure your first name, age range, and gender are set.");
                                // Find step to go back to if needed
                                if (!formData.firstName) setCurrentStep(0);
                                else if (!formData.ageRange || !formData.gender) setCurrentStep(1);
                                return;
                            }
                            await handleSave();
                        }}
                        disabled={loading}
                        className="bg-emerald-500 text-black font-black px-8 py-6 rounded-2xl hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                    >
                        {loading ? "Finishing..." : "Done! Let's Go"}
                        <CheckCircle2 className="ml-2 h-5 w-5" />
                    </Button>
                ) : (
                    <Button
                        onClick={nextStep}
                        className="bg-white text-black font-black px-8 py-6 rounded-2xl hover:bg-zinc-200"
                    >
                        Next
                        <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                )}
            </div>
        </div >
    );
};
