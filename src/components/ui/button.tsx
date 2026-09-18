import Link from "next/link";
import { clsx } from "clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";

const variants = {
  primary:
    "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-200 hover:opacity-90",
  secondary:
    "bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50",
  danger: "bg-rose-500 text-white hover:bg-rose-600",
  ghost: "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
};

type ButtonVariant = keyof typeof variants;

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
}) {
  return (
    <button
      className={clsx(base, variants[variant], className)}
      {...props}
    />
  );
}

export function LinkButton({
  variant = "primary",
  className,
  href,
  children,
}: {
  variant?: ButtonVariant;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={clsx(base, variants[variant], className)}>
      {children}
    </Link>
  );
}
