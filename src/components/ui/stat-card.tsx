import { clsx } from "clsx";
import type { LucideIcon } from "lucide-react";
import { Card } from "./card";

const colorMap = {
  blue: "bg-blue-100 text-blue-700",
  violet: "bg-violet-100 text-violet-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-lime text-lime-900",
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
    <Card className="flex items-center gap-4">
      <div
        className={clsx(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px]",
          colorMap[color]
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-500">{label}</p>
        <p className="font-display text-2xl font-semibold tracking-tight text-ink">
          {value}
        </p>
        {helpText && <p className="text-xs text-neutral-500">{helpText}</p>}
      </div>
    </Card>
  );
}
