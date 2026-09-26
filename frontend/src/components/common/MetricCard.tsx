import React from "react";
import { ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  variant?: string;
  color?: string;
  icon?: any;
  trend?: string;
  onClick?: () => void;
  subtitle?: string;
}

const variantStyles: Record<string, { bg: string; title: string; value: string; iconBg: string }> = {
  blue: {
    bg: "bg-blue-50/70 border-blue-200/80 text-blue-900",
    title: "text-blue-700",
    value: "text-blue-950",
    iconBg: "bg-blue-100 text-blue-600",
  },
  green: {
    bg: "bg-emerald-50/70 border-emerald-200/80 text-emerald-900",
    title: "text-emerald-700",
    value: "text-emerald-950",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  emerald: {
    bg: "bg-emerald-50/70 border-emerald-200/80 text-emerald-900",
    title: "text-emerald-700",
    value: "text-emerald-950",
    iconBg: "bg-emerald-100 text-emerald-600",
  },
  purple: {
    bg: "bg-purple-50/70 border-purple-200/80 text-purple-900",
    title: "text-purple-700",
    value: "text-purple-950",
    iconBg: "bg-purple-100 text-purple-600",
  },
  red: {
    bg: "bg-rose-50/70 border-rose-200/80 text-rose-900",
    title: "text-rose-700",
    value: "text-rose-950",
    iconBg: "bg-rose-100 text-rose-600",
  },
  rose: {
    bg: "bg-rose-50/70 border-rose-200/80 text-rose-900",
    title: "text-rose-700",
    value: "text-rose-950",
    iconBg: "bg-rose-100 text-rose-600",
  },
  amber: {
    bg: "bg-amber-50/70 border-amber-200/80 text-amber-900",
    title: "text-amber-700",
    value: "text-amber-950",
    iconBg: "bg-amber-100 text-amber-600",
  },
  cyan: {
    bg: "bg-cyan-50/70 border-cyan-200/80 text-cyan-900",
    title: "text-cyan-700",
    value: "text-cyan-950",
    iconBg: "bg-cyan-100 text-cyan-600",
  },
  indigo: {
    bg: "bg-indigo-50/70 border-indigo-200/80 text-indigo-900",
    title: "text-indigo-700",
    value: "text-indigo-950",
    iconBg: "bg-indigo-100 text-indigo-600",
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  prefix = "",
  suffix = "",
  variant,
  color,
  icon: Icon,
  trend,
  onClick,
  subtitle
}) => {
  const chosenKey = color || variant || "blue";
  const styles = variantStyles[chosenKey] || variantStyles.blue;

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl border transition-all duration-200 ${styles.bg} ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:translate-y-0" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <span className={`text-xs font-bold uppercase tracking-wider ${styles.title}`}>
            {title}
          </span>
          <div className="mt-2 flex items-baseline gap-1">
            {prefix && <span className="text-sm font-semibold text-slate-500">{prefix}</span>}
            <span className={`text-2xl font-extrabold font-heading tracking-tight ${styles.value}`}>
              {typeof value === "number" ? value.toLocaleString() : value}
            </span>
            {suffix && <span className="text-xs font-semibold text-slate-500">{suffix}</span>}
          </div>
          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-500 font-medium">{subtitle}</p>
          )}
        </div>

        {onClick && (
          <div className="p-1 rounded-lg bg-white/60 text-slate-400 group-hover:text-slate-600 transition-colors">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-2 border-t border-slate-200/40 text-[11px] font-medium text-slate-600 flex items-center justify-between">
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;
