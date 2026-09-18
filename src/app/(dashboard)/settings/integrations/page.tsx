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
        <Card>
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="text-sm text-neutral-600">
              <p className="font-medium text-neutral-900">
                Google integration not configured
              </p>
              <p className="mt-1">
                Set{" "}
                <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
                  GOOGLE_CLIENT_ID
                </code>
                ,{" "}
                <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
                  GOOGLE_CLIENT_SECRET
                </code>{" "}
                and{" "}
                <code className="rounded bg-neutral-100 px-1 py-0.5 text-xs">
                  GOOGLE_REDIRECT_URI
                </code>{" "}
                in your environment to enable Gmail and Google Meet syncing.
                See the README for setup instructions.
              </p>
            </div>
          </div>
        </Card>
      )}

      {error && ERROR_MESSAGES[error] && (
        <Card>
          <p className="text-sm text-red-600">{ERROR_MESSAGES[error]}</p>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">
                Google Account (Gmail &amp; Meet)
              </h2>
              <p className="mt-1 max-w-md text-sm text-neutral-500">
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
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Scheduling Google Meet calls
            </h2>
            <p className="mt-1 max-w-md text-sm text-neutral-500">
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
