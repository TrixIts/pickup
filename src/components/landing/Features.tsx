"use client";

import { motion } from "framer-motion";
import {
    Users,
    Calendar,
    CreditCard,
    MessageSquare,
    BarChart3,
    Smartphone
} from "lucide-react";

const playerFeatures = [
    {
        title: "Map Discovery",
        description: "Find pickup games in your neighborhood with our interactive map.",
        icon: Smartphone,
    },
    {
        title: "Skill Matching",
        description: "Match with players of your skill level for competitive and fun games.",
        icon: Users,
    },
    {
        title: "Group Chat",
        description: "Instant access to a dedicated chat for every game you join.",
        icon: MessageSquare,
    },
];

const organizerFeatures = [
    {
        title: "Auto-Scheduling",
        description: "Drag-and-drop schedule maker for leagues of any size.",
        icon: Calendar,
    },
    {
        title: "Payment Processing",
        description: "Securely collect league fees via Stripe integration.",
        icon: CreditCard,
    },
    {
        title: "Advanced Stats",
        description: "Track player goals, fouls, and and season standings automatically.",
        icon: BarChart3,
    },
];

export const Features = () => {
    return (
        <section className="bg-black py-24 sm:py-32">
            <div className="container mx-auto px-4">
                <div className="mb-20 grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-32">
                    {/* Players Column */}
                    <div>
                        <h2 className="mb-4 text-sm font-bold tracking-[0.2em] text-emerald-500 uppercase">
                            For Players
                        </h2>
                        <h3 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
                            Focus on the game, <br /> we'll handle the logistics.
                        </h3>
                        <div className="space-y-12">
                            {playerFeatures.map((feature, i) => (
                                <div key={i} className="flex gap-6">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-emerald-500">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-bold text-white">{feature.title}</h4>
                                        <p className="text-zinc-500">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Organizers Column */}
                    <div>
                        <h2 className="mb-4 text-sm font-bold tracking-[0.2em] text-emerald-500 uppercase">
                            For Organizers
                        </h2>
                        <h3 className="mb-12 text-3xl font-bold text-white sm:text-4xl">
                            Professional league management, <br /> made simple.
                        </h3>
                        <div className="space-y-12">
                            {organizerFeatures.map((feature, i) => (
                                <div key={i} className="flex gap-6">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-emerald-500">
                                        <feature.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="mb-1 font-bold text-white">{feature.title}</h4>
                                        <p className="text-zinc-500">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
