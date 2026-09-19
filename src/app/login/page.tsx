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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
        <div className="mb-8 text-center">
          {branding.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={branding.logoUrl}
              alt={branding.companyName}
              className="mx-auto mb-4 h-10 w-10 rounded-lg object-contain"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900 text-sm font-semibold text-white">
              {branding.companyName.charAt(0).toUpperCase() || "O"}
            </div>
          )}
          <h1 className="text-lg font-semibold tracking-tight text-neutral-900">
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
