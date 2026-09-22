import Link from "next/link";
import { clsx } from "clsx";

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-ink text-white hover:bg-accent",
  secondary:
    "bg-white text-neutral-800 shadow-sm ring-1 ring-inset ring-neutral-200 hover:ring-neutral-300",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
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
