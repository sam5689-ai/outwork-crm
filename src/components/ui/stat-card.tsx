import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
};

export function StatCard({
  label,
  value,
  helpText,
  icon: Icon,
  color = "blue",
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
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
          {label}
        </p>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-neutral-900">
          {value}
        </p>
        {helpText && (
          <p className="mt-1 text-xs text-neutral-400">{helpText}</p>
        )}
      </div>
      <div
        className={clsx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
          colorMap[color]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
    </Card>
  );
}
