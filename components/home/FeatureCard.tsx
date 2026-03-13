"use client";

import { ReactNode } from "react";

interface FeatureCardProps {
  title: string;
  subtitle: string;
  illustration: ReactNode;
}

export function FeatureCard({ title, subtitle, illustration }: FeatureCardProps) {
  return (
    <div className="glass rounded-2xl p-6 card-hover cursor-pointer h-full group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-cyan-600 transition-colors">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed whitespace-pre-line">{subtitle}</p>
        </div>
        <div className="flex-shrink-0 ml-4">
          {illustration}
        </div>
      </div>
    </div>
  );
}
