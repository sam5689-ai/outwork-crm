import { clsx } from "clsx";
import { Card } from "./card";

export function ReportCard({
  title,
  thisMonth,
  yearToDate,
  tone = "neutral",
  detail,
  featured = false,
}: {
  title: string;
  thisMonth: number;
  yearToDate: number;
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
      <div className="mt-3 flex items-end gap-6">
        <div>
          <p className={valueClass}>{thisMonth}</p>
          <p className="mt-1 text-xs text-neutral-400">This month</p>
        </div>
        <div>
          <p className={valueClass}>{yearToDate}</p>
          <p className="mt-1 text-xs text-neutral-400">Year to date</p>
        </div>
      </div>
      {detail && <p className="mt-3 text-xs text-neutral-500">{detail}</p>}
    </Card>
  );
}
