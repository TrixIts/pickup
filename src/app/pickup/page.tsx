"use client";

import { useState } from "react";
import { PickupMap } from "@/components/pickup/PickupMap";
import { PickupList } from "@/components/pickup/PickupList";
import { CreatePickupModal } from "@/components/pickup/CreatePickupModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Map as MapIcon, List as ListIcon } from "lucide-react";

export default function PickupPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-black text-white overflow-hidden">
            {/* Top Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-black/50 backdrop-blur-md z-10 shrink-0">
                <div>
                    <h1 className="text-2xl font-black tracking-tighter uppercase">Pickup Discovery</h1>
                    <p className="text-xs text-zinc-500 font-medium">Find games near Los Angeles, CA</p>
                </div>
                <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="rounded-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold gap-2 px-6"
                >
                    <Plus className="h-4 w-4" />
                    Create Game
                </Button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden">
                {/* Mobile View: Tabs */}
                <div className="md:hidden flex flex-col h-full">
                    <Tabs defaultValue="map" className="flex-1 flex flex-col">
                        <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-950">
                            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 border border-zinc-800">
                                <TabsTrigger value="map" className="data-[state=active]:bg-zinc-800 gap-2">
                                    <MapIcon className="h-4 w-4" /> Map
                                </TabsTrigger>
                                <TabsTrigger value="list" className="data-[state=active]:bg-zinc-800 gap-2">
                                    <ListIcon className="h-4 w-4" /> List
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <TabsContent value="map" className="flex-1 m-0 p-0 relative h-full">
                            <PickupMap />
                        </TabsContent>
                        <TabsContent value="list" className="flex-1 m-0 p-0 overflow-y-auto bg-black">
                            <PickupList />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Desktop View: Split Map/List */}
                <div className="hidden md:flex h-full">
                    <div className="w-1/3 border-r border-zinc-800 overflow-y-auto bg-zinc-950">
                        <PickupList />
                    </div>
                    <div className="flex-1 relative">
                        <PickupMap />
                    </div>
                </div>
            </main>

            <CreatePickupModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
            />
        </div>
    );
}
