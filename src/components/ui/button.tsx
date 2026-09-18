import Link from "next/link";
import { clsx } from "clsx";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-neutral-900 text-white hover:bg-neutral-700",
  secondary:
    "bg-white text-neutral-700 ring-1 ring-inset ring-neutral-200 hover:bg-neutral-50",
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
