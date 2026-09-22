import { clsx } from "clsx";
import { Card } from "./card";

export function ReportCard({
  title,
  value,
  periodLabel,
  tone = "neutral",
  detail,
  featured = false,
}: {
  title: string;
  value: number;
  periodLabel: string;
  tone?: "positive" | "negative" | "neutral";
  detail?: string;
  featured?: boolean;
}) {
  const valueClass = clsx(
    "font-semibold tracking-tight",
    featured ? "text-4xl" : "text-2xl",
    tone === "positive" && "text-emerald-600",
    tone === "negative" && "text-red-600",
    tone === "neutral" && "text-neutral-900"
  );

  return (
    <Card className={clsx(featured && "border-l-4 border-l-emerald-500")}>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-400">
        {title}
      </p>
      <p className={clsx("mt-3", valueClass)}>{value}</p>
      <p className="mt-1 text-xs text-neutral-400">{periodLabel}</p>
      {detail && <p className="mt-3 text-xs text-neutral-500">{detail}</p>}
    </Card>
  );
}
