"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Rocket, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-32 pb-16 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI 驱动的个性化学习体验
        </div>
        
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 tracking-tight">
          AI 个性化学习
        </h1>
        
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          通过 AI 个性化学习教练，帮助你完成持续、自适应的学习闭环
        </p>

        <Link href="/onboarding" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-4 rounded-full inline-block">
          <Button
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 rounded-full px-8 py-6 text-base font-medium shadow-xl shadow-cyan-200/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-200/40 hover:-translate-y-1 group"
          >
            立即开启学习
            <Rocket className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-0.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}
