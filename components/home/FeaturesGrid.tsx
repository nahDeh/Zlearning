"use client";

import Link from "next/link";
import { FeatureCard } from "./FeatureCard";

// Smart Planning - Knowledge Point Node Map Illustration
function SmartPlanningIllustration() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="opacity-90">
      {/* Central node */}
      <circle cx="40" cy="30" r="10" fill="#22D3EE" />
      <text x="40" y="34" textAnchor="middle" fill="white" fontSize="8" fontWeight="600">知识点</text>
      {/* Surrounding nodes */}
      <circle cx="20" cy="15" r="5" fill="#A5F3FC" />
      <circle cx="60" cy="15" r="5" fill="#A5F3FC" />
      <circle cx="15" cy="35" r="4" fill="#67E8F9" />
      <circle cx="65" cy="35" r="4" fill="#67E8F9" />
      <circle cx="25" cy="50" r="3" fill="#CFFAFE" />
      <circle cx="55" cy="50" r="3" fill="#CFFAFE" />
      <circle cx="40" cy="8" r="3" fill="#CFFAFE" />
      {/* Connection lines */}
      <line x1="32" y1="24" x2="24" y2="18" stroke="#22D3EE" strokeWidth="1.5" />
      <line x1="48" y1="24" x2="56" y2="18" stroke="#22D3EE" strokeWidth="1.5" />
      <line x1="35" y1="32" x2="18" y2="35" stroke="#22D3EE" strokeWidth="1" />
      <line x1="45" y1="32" x2="62" y2="35" stroke="#22D3EE" strokeWidth="1" />
      <line x1="38" y1="38" x2="28" y2="47" stroke="#22D3EE" strokeWidth="1" />
      <line x1="42" y1="38" x2="52" y2="47" stroke="#22D3EE" strokeWidth="1" />
      <line x1="40" y1="20" x2="40" y2="11" stroke="#22D3EE" strokeWidth="1" />
    </svg>
  );
}

// Real-time Progress - Mini Donut Chart Illustration
function RealtimeProgressIllustration() {
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="opacity-90">
      {/* Background ring */}
      <circle cx="30" cy="30" r="22" stroke="#E2E8F0" strokeWidth="6" fill="none" />
      {/* Progress arc - cyan */}
      <circle
        cx="30"
        cy="30"
        r="22"
        stroke="#22D3EE"
        strokeWidth="6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="85 138"
        transform="rotate(-90 30 30)"
      />
      {/* Secondary arc - light cyan */}
      <circle
        cx="30"
        cy="30"
        r="14"
        stroke="#A5F3FC"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="50 88"
        transform="rotate(45 30 30)"
      />
    </svg>
  );
}

// Data Parsing - Document Analysis Illustration
function DataParsingIllustration() {
  return (
    <svg width="80" height="60" viewBox="0 0 80 60" fill="none" className="opacity-90">
      {/* Main document */}
      <rect x="25" y="8" width="32" height="44" rx="3" fill="#1E293B" />
      <rect x="30" y="15" width="22" height="2" rx="1" fill="#475569" />
      <rect x="30" y="22" width="18" height="2" rx="1" fill="#475569" />
      <rect x="30" y="29" width="20" height="2" rx="1" fill="#475569" />
      <rect x="30" y="36" width="15" height="2" rx="1" fill="#22D3EE" />
      {/* Code bracket */}
      <text x="62" y="35" fill="#22D3EE" fontSize="14" fontFamily="monospace">&lt;/&gt;</text>
      {/* Side document */}
      <rect x="10" y="18" width="18" height="28" rx="2" fill="#334155" />
      <rect x="14" y="24" width="10" height="1.5" rx="0.5" fill="#64748B" />
      <rect x="14" y="29" width="8" height="1.5" rx="0.5" fill="#64748B" />
      {/* Arrow */}
      <path d="M20 32 L24 36 L20 40" stroke="#22D3EE" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Interactive Exercises - Check/Correct Illustration
function InteractiveExercisesIllustration() {
  return (
    <svg width="70" height="50" viewBox="0 0 70 50" fill="none" className="opacity-90">
      {/* Checkbox 1 - checked */}
      <rect x="5" y="8" width="14" height="14" rx="3" fill="#22D3EE" />
      <path d="M8 15 L11 18 L16 11" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Checkbox 2 - checked with green */}
      <rect x="5" y="28" width="14" height="14" rx="3" fill="#A5F3FC" />
      <path d="M8 35 L11 38 L16 31" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Correct text */}
      <text x="28" y="20" fill="#22D3EE" fontSize="11" fontWeight="600">正确</text>
      {/* Checkmark badge */}
      <circle cx="52" cy="35" r="10" fill="#22D3EE" opacity="0.2" />
      <path d="M46 35 L50 39 L58 31" stroke="#22D3EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// AI Coach - Robot Avatar Illustration
function AICoachIllustration() {
  return (
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none" className="opacity-90">
      {/* Antenna */}
      <line x1="30" y1="8" x2="30" y2="15" stroke="#94A3B8" strokeWidth="2" />
      <circle cx="30" cy="6" r="3" fill="#22D3EE" />
      {/* Head */}
      <rect x="15" y="15" width="30" height="24" rx="8" fill="#E2E8F0" />
      {/* Face screen */}
      <rect x="18" y="18" width="24" height="18" rx="5" fill="#1E293B" />
      {/* Eyes */}
      <circle cx="24" cy="27" r="3" fill="#22D3EE" />
      <circle cx="36" cy="27" r="3" fill="#22D3EE" />
      {/* Smile */}
      <path d="M26 32 Q30 35 34 32" stroke="#22D3EE" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Body */}
      <rect x="20" y="40" width="20" height="18" rx="6" fill="#CBD5E1" />
      {/* Chest light */}
      <circle cx="30" cy="49" r="4" fill="#22D3EE" />
      {/* Arms */}
      <rect x="10" y="42" width="8" height="14" rx="4" fill="#E2E8F0" />
      <rect x="42" y="42" width="8" height="14" rx="4" fill="#E2E8F0" />
    </svg>
  );
}

// Honors - Medal Illustration
function HonorsIllustration() {
  return (
    <svg width="60" height="70" viewBox="0 0 60 70" fill="none" className="opacity-90">
      {/* Ribbon top */}
      <path d="M18 5 L30 20 L42 5 L38 2 L30 12 L22 2 Z" fill="#8B5CF6" />
      {/* Ribbon tails */}
      <path d="M22 20 L15 35 L22 32 L28 35 L25 20 Z" fill="#A78BFA" />
      <path d="M38 20 L45 35 L38 32 L32 35 L35 20 Z" fill="#A78BFA" />
      {/* Medal circle */}
      <circle cx="30" cy="38" r="16" fill="url(#medalGrad)" stroke="#7C3AED" strokeWidth="1" />
      {/* Star */}
      <path
        d="M30 28 L32.5 35 L40 35 L34 40 L36 48 L30 43 L24 48 L26 40 L20 35 L27.5 35 Z"
        fill="white"
      />
      {/* Gradient definition */}
      <defs>
        <linearGradient id="medalGrad" x1="14" y1="22" x2="46" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const features = [
  {
    title: "智能规划",
    subtitle: "知识点\n节点图谱",
    illustration: <SmartPlanningIllustration />,
    href: "/onboarding",
  },
  {
    title: "实时进度",
    subtitle: "迷你环形\n进度图表",
    illustration: <RealtimeProgressIllustration />,
    href: "/learn",
  },
  {
    title: "资料解析",
    subtitle: "深度语义\n分析理解",
    illustration: <DataParsingIllustration />,
    href: "/onboarding",
  },
  {
    title: "互动练习",
    subtitle: "交互式\n智能批改",
    illustration: <InteractiveExercisesIllustration />,
    href: "/learn",
  },
  {
    title: "AI 教练",
    subtitle: "7×24小时\n智能陪伴",
    illustration: <AICoachIllustration />,
    href: "/learn",
  },
  {
    title: "荣誉成就",
    subtitle: "详细专业\n成就系统",
    illustration: <HonorsIllustration />,
    href: "/learn",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            强大的学习功能
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto">
            利用 AI 技术，为你提供全方位的学习支持
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => (
            <Link key={index} href={feature.href} className="block">
              <FeatureCard
                title={feature.title}
                subtitle={feature.subtitle}
                illustration={feature.illustration}
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
