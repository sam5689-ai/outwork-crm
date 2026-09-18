import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

const colorMap = {
  indigo: "bg-gradient-to-br from-indigo-500 to-violet-500",
  rose: "bg-gradient-to-br from-rose-500 to-orange-400",
  emerald: "bg-gradient-to-br from-emerald-500 to-teal-400",
  amber: "bg-gradient-to-br from-amber-500 to-orange-400",
};

export function StatCard({
  label,
  value,
  helpText,
  icon: Icon,
  color = "indigo",
}: {
  label: string;
  value: string | number;
  helpText?: string;
  icon: LucideIcon;
  color?: keyof typeof colorMap;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold text-slate-800">{value}</p>
        {helpText && (
          <p className="mt-1 text-xs text-slate-400">{helpText}</p>
        )}
      </div>
      <div
        className={clsx(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-md",
          colorMap[color]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
    </Card>
  );
}
