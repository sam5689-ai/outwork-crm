import { getBranding } from "@/lib/branding";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const [{ callbackUrl }, branding] = await Promise.all([
    searchParams,
    getBranding(),
  ]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,var(--color-accent)_0%,transparent_70%)] opacity-25"
      />
      <div className="relative w-full max-w-sm rounded-[32px] bg-white p-9 shadow-lg">
        <div className="mb-8 text-center">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              className="mx-auto mb-5 h-14 w-14 rounded-[18px] object-contain"
            />
          ) : (
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[18px] bg-accent font-display text-xl font-bold text-white">
              {branding.companyName.charAt(0).toUpperCase() || "O"}
            </div>
          )}
          <h1 className="text-2xl font-semibold text-ink">
            {branding.companyName}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Sign in to manage clients and candidates
          </p>
        </div>
        <LoginForm callbackUrl={callbackUrl ?? "/dashboard"} />
      </div>
    </div>
  );
}
