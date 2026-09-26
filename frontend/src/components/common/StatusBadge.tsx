import React from "react";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const s = status.toLowerCase();

  let style = "bg-slate-100 text-slate-700 border-slate-200";

  if (s.includes("in stock") || s.includes("paid") || s.includes("active") || s.includes("approved") || s.includes("settled")) {
    style = "bg-emerald-50 text-emerald-700 border-emerald-200/80";
  } else if (s.includes("low stock") || s.includes("partial") || s.includes("draft") || s.includes("submitted")) {
    style = "bg-amber-50 text-amber-700 border-amber-200/80";
  } else if (s.includes("out of stock") || s.includes("due") || s.includes("unpaid") || s.includes("inactive") || s.includes("shortage")) {
    style = "bg-rose-50 text-rose-700 border-rose-200/80";
  } else if (s.includes("loan") || s.includes("credit") || s.includes("excess")) {
    style = "bg-indigo-50 text-indigo-700 border-indigo-200/80";
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${style}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
