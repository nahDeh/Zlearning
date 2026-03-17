"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { User, BookOpen, Compass } from "lucide-react";

export function Navbar() {
  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <nav className="max-w-6xl mx-auto glass rounded-2xl shadow-lg shadow-slate-200/20 px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded-lg p-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-200/50 group-hover:shadow-cyan-200/70 transition-shadow">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="font-bold text-xl text-slate-800">智学</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              href="/learn"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            >
              <BookOpen className="w-4 h-4" />
              我的学习
            </Link>
            <Link
              href="/explore"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50/50 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
            >
              <Compass className="w-4 h-4" />
              探索
            </Link>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link href="/onboarding" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 rounded-full inline-block">
              <Button
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white border-0 rounded-full px-6 py-2 text-sm font-medium shadow-lg shadow-cyan-200/50 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-200/40 hover:-translate-y-0.5"
              >
                开始学习
              </Button>
            </Link>
            <button 
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-cyan-50 flex items-center justify-center transition-colors duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
              aria-label="用户中心"
            >
              <User className="w-5 h-5 text-slate-600 group-hover:text-cyan-600 transition-colors" />
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
