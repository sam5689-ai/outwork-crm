import { clsx } from "clsx";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={clsx(
        "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
