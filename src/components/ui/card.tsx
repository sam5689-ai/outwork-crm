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
        "rounded-[28px] bg-white p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
