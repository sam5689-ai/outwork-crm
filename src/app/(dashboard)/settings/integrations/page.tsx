import { CheckCircle2, Mail, Video, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isGoogleConfigured } from "@/lib/google";
import { Card } from "@/components/ui/card";
import { Button, LinkButton } from "@/components/ui/button";
import { disconnectGoogleAccount } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured:
    "Google OAuth credentials haven't been set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.",
  invalid_state: "Your Google sign-in session expired. Please try again.",
  exchange_failed: "Something went wrong connecting to Google. Please try again.",
  access_denied: "Google access was not granted.",
};

export default async function IntegrationsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const account = await prisma.googleAccount.findUnique({
    where: { userId: user.id },
  });
  const configured = isGoogleConfigured();

  return (
    <div className="space-y-6">
      {!configured && (
        <Card className="border-amber-100 bg-amber-50">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="text-sm text-amber-700">
              <p className="font-semibold">Google integration not configured</p>
              <p className="mt-1">
                Set <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_ID</code>,{" "}
                <code className="rounded bg-amber-100 px-1">GOOGLE_CLIENT_SECRET</code> and{" "}
                <code className="rounded bg-amber-100 px-1">GOOGLE_REDIRECT_URI</code>{" "}
                in your environment to enable Gmail and Google Meet syncing.
                See the README for setup instructions.
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && ERROR_MESSAGES[error] && (
        <Card className="border-rose-100 bg-rose-50">
          <p className="text-sm text-rose-600">{ERROR_MESSAGES[error]}</p>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Google Account (Gmail &amp; Meet)
              </h2>
              <p className="mt-1 max-w-md text-sm text-slate-500">
                Connect your Google account to link emails to contacts and
                create Google Meet meetings directly from the CRM.
              </p>
              {account && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected as {account.googleEmail}
                </p>
              )}
            </div>
          </div>

          {account ? (
            <form action={disconnectGoogleAccount}>
              <Button type="submit" variant="secondary">
                Disconnect
              </Button>
            </form>
          ) : (
            <LinkButton
              href="/api/google/connect"
              variant={configured ? "primary" : "secondary"}
            >
              Connect Google Account
            </LinkButton>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 text-white">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">
              Scheduling Google Meet calls
            </h2>
            <p className="mt-1 max-w-md text-sm text-slate-500">
              Once connected, open any contact and use &quot;Schedule Google
              Meet&quot; to create a calendar invite with a Meet link
              that&apos;s automatically saved to that contact&apos;s
              timeline.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
