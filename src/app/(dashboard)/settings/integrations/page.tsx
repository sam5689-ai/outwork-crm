import { CheckCircle2, Mail, Video, AlertTriangle, Settings2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { isGoogleConfigured } from "@/lib/google";
import { getGoogleFeatures } from "@/lib/google-features";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, LinkButton } from "@/components/ui/button";
import { GoogleFeaturesForm } from "@/components/settings/google-features-form";
import { disconnectGoogleAccount } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  not_configured:
    "Google OAuth credentials haven't been set up yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment.",
  invalid_state: "Your Google sign-in session expired. Please try again.",
  exchange_failed: "Something went wrong connecting to Google. Please try again.",
  access_denied: "Google access was not granted.",
};

const FEATURE_LABELS: Record<string, string> = {
  emailSync: "Sync emails to contacts",
  autoLogEmailActivity: "Auto-log new emails as activity",
  importCalendarMeetings: "Import existing calendar meetings",
  todaysMeetingsWidget: "Today's meetings on the dashboard",
  followUpReminders: "Follow-up reminders",
  inboxEnabled: "Gmail-style inbox",
};

function hasInboxScope(scope: string | null): boolean {
  return Boolean(scope?.includes("gmail.modify"));
}

export default async function IntegrationsSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; connected?: string }>;
}) {
  const user = await requireUser();
  const { error } = await searchParams;

  const [account, configured, features] = await Promise.all([
    prisma.googleAccount.findUnique({ where: { userId: user.id } }),
    isGoogleConfigured(),
    getGoogleFeatures(),
  ]);

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
              {account && !hasInboxScope(account.scope) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Reconnect to enable the inbox (adds send &amp; organize
                  permissions)
                </p>
              )}
            </div>
          </div>

          {account ? (
            <div className="flex items-center gap-2">
              {!hasInboxScope(account.scope) && (
                <LinkButton href="/api/google/connect" variant="secondary">
                  Reconnect
                </LinkButton>
              )}
              <form action={disconnectGoogleAccount}>
                <Button type="submit" variant="secondary">
                  Disconnect
                </Button>
              </form>
            </div>
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
              Open any contact and use &quot;Schedule Google Meet&quot; to
              create a calendar invite with a Meet link that&apos;s
              automatically saved to that contact&apos;s timeline. Always on
              once you&apos;re connected.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Google integration features
            </h2>
            <p className="mt-1 max-w-md text-sm text-neutral-500">
              Choose which parts of the Google integration are switched on
              for everyone. These only take effect for users who&apos;ve
              connected their own Google account.
            </p>
          </div>
        </div>

        {user.role === "ADMIN" ? (
          <GoogleFeaturesForm features={features} />
        ) : (
          <div className="space-y-2">
            {Object.entries(FEATURE_LABELS).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between text-sm">
                <span className="text-neutral-700">{label}</span>
                <Badge
                  className={
                    features[key as keyof typeof features]
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-neutral-100 text-neutral-500"
                  }
                >
                  {features[key as keyof typeof features] ? "On" : "Off"}
                </Badge>
              </div>
            ))}
            <p className="pt-2 text-xs text-neutral-400">
              Ask an admin to change these in Settings.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
