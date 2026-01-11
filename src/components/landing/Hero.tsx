"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Trophy, Users, MapPin, ArrowRight, Star } from "lucide-react";
import Link from "next/link";

export const Hero = () => {
  return (
    <div className="relative overflow-hidden min-h-screen flex items-center justify-center pt-20 lg:pt-0 bg-black">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse duration-[4000ms]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse duration-[5000ms] delay-1000" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-zinc-300 backdrop-blur-md shadow-lg"
            >
              <span className="mr-3 flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium tracking-wide">Pickup League v1.0 is Live</span>
            </motion.div>

            <h1 className="mb-6 text-6xl font-black tracking-tighter text-white sm:text-8xl leading-[0.9]">
              FIND YOUR <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
                GAME DAY.
              </span>
            </h1>

            <p className="mb-10 max-w-2xl text-lg text-zinc-400 sm:text-xl font-light leading-relaxed mx-auto lg:mx-0">
              The premier platform for spontaneous play and professional league management.
              Join thousands of athletes connecting daily.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link href="/pickup">
                <Button size="lg" className="h-14 rounded-full bg-emerald-500 px-10 text-lg font-bold text-black shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1">
                  Find a Game
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="h-14 rounded-full border-zinc-800 bg-zinc-900/50 px-10 text-lg font-bold text-white backdrop-blur-sm hover:bg-zinc-800 hover:text-emerald-400 transition-all">
                List League
              </Button>
            </div>

            {/* Social Proof */}
            <div className="mt-12 flex items-center justify-center lg:justify-start gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                    <Users className="h-4 w-4" />
                  </div>
                ))}
              </div>
              <div className="text-sm text-zinc-400">
                <span className="block font-bold text-white flex items-center gap-1">
                  4.9/5.0 <Star className="h-3 w-3 fill-emerald-500 text-emerald-500" />
                </span>
                from verified players
              </div>
            </div>
          </motion.div>

          {/* Floating Visuals similar to glassmorphism cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative flex-1"
          >
            <div className="relative w-full max-w-[500px] aspect-square mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-blue-500/20 rounded-3xl blur-2xl transform rotate-6" />
              <div className="relative h-full w-full bg-zinc-900/40 border border-white/10 rounded-3xl backdrop-blur-xl p-8 shadow-2xl overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-30 transition-opacity">
                  <Trophy className="h-64 w-64 text-emerald-500 transform rotate-12" />
                </div>

                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/20 px-3 py-1 text-emerald-400 text-xs font-bold uppercase mb-4">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Now
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-2">Venice Beach Hoops</h3>
                    <p className="text-zinc-400 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Los Angeles, CA
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm py-3 border-b border-white/5">
                      <span className="text-zinc-400">Players</span>
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full bg-zinc-700 border border-zinc-900" />
                        <div className="h-8 w-8 rounded-full bg-zinc-600 border border-zinc-900" />
                        <div className="h-8 w-8 rounded-full bg-zinc-500 border border-zinc-900 flex items-center justify-center text-xs">+4</div>
                      </div>
                    </div>
                    <Button className="w-full bg-white text-black hover:bg-zinc-200 font-bold rounded-xl">
                      Join Game
                    </Button>
                  </div>
                </div>
              </div>

              {/* Composition Elements */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-12 -right-12 bg-black border border-zinc-800 p-4 rounded-2xl shadow-xl z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs text-zinc-500 font-bold uppercase">Rank #1</div>
                    <div className="font-bold text-white">Top Scorer</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};
