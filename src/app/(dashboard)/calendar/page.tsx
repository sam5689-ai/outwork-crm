import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { CalendarApp } from "@/components/calendar/calendar-app";

export default async function CalendarPage() {
  const user = await requireUser();

  const account = await prisma.googleAccount.findUnique({
    where: { userId: user.id },
  });

  if (!account) {
    return (
      <div>
        <PageHeader title="Calendar" description="Your Google Calendar, inside the CRM" />
        <Card>
          <p className="text-sm text-neutral-500">
            Connect your Google account in{" "}
            <Link href="/settings/integrations" className="text-blue-600 hover:underline">
              Settings
            </Link>{" "}
            to view and schedule events here.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Calendar"
        description={`Connected as ${account.googleEmail}`}
      />
      <CalendarApp />
    </div>
  );
}
