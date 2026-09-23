import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarApp } from "@/components/calendar/calendar-app";

export default async function CalendarPage() {
  const user = await requireUser();

  const account = await prisma.googleAccount.findUnique({
    where: { userId: user.id },
  });

  return (
    <div>
      <PageHeader
        title="Calendar"
        description={
          account
            ? `Connected as ${account.googleEmail}`
            : "Your reminders and follow-ups"
        }
      />
      {!account && (
        <p className="mb-4 text-sm text-neutral-500">
          Showing your scheduled reminders. Connect your Google account in{" "}
          <Link href="/settings/integrations" className="text-blue-600 hover:underline">
            Settings
          </Link>{" "}
          to see and schedule Google Calendar events here too.
        </p>
      )}
      <CalendarApp />
    </div>
  );
}
