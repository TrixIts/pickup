import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MapPin, Trophy } from "lucide-react";

interface LeagueCardProps {
    league: any;
}

export const LeagueCard = ({ league }: LeagueCardProps) => {
    return (
        <Card className="bg-zinc-900 border-zinc-800 text-white overflow-hidden hover:border-emerald-500/50 transition-all">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-bold text-emerald-500 uppercase tracking-widest mb-1">{league.sport}</p>
                        <CardTitle className="text-xl font-bold">{league.name}</CardTitle>
                    </div>
                    {/* Placeholder for league logo or icon */}
                    <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-zinc-500" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 pb-4">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <MapPin className="h-4 w-4" />
                    <span>{league.location || "No location set"}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <Users className="h-4 w-4" />
                    <span>0 Teams Registered</span>
                </div>
                {league.description && (
                    <p className="text-sm text-zinc-500 line-clamp-2">{league.description}</p>
                )}
            </CardContent>
            <CardFooter className="pt-0 bg-zinc-950/30 p-4 border-t border-zinc-800/50">
                <Button variant="outline" className="w-full border-zinc-700 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 font-bold">
                    Manage League
                </Button>
            </CardFooter>
        </Card>
    );
};
