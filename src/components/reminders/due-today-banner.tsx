import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { clsx } from "clsx";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { CONTACT_CHANNEL_LABELS, CONTACT_CHANNEL_COLORS } from "@/lib/stages";
import { Badge } from "@/components/ui/badge";
import { completeReminder } from "@/app/(dashboard)/contacts/actions";

/**
 * "Notifications" for follow-ups: a banner at the top of every dashboard
 * page listing this user's reminders due today or overdue. There's no push
 * notification infra in this app, so this in-app banner is what stands in
 * for "notify me that day."
 */
export async function DueTodayBanner({ userId }: { userId: string }) {
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const reminders = await prisma.reminder.findMany({
    where: { authorId: userId, completedAt: null, dueAt: { lte: endOfToday } },
    orderBy: { dueAt: "asc" },
    include: { contact: true },
    take: 10,
  });

  if (reminders.length === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
        <Bell className="h-4 w-4" />
        {reminders.length} follow-up{reminders.length === 1 ? "" : "s"} due
      </div>
      <ul className="space-y-2">
        {reminders.map((reminder) => {
          const overdue = reminder.dueAt.getTime() < new Date().getTime() - 60_000;
          const completeWithId = completeReminder.bind(
            null,
            reminder.contactId,
            reminder.id
          );
          const href = `/contacts/${reminder.contactId}`;
          return (
            <li
              key={reminder.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 shadow-sm"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge className={CONTACT_CHANNEL_COLORS[reminder.channel]}>
                  {CONTACT_CHANNEL_LABELS[reminder.channel]}
                </Badge>
                <Link
                  href={href}
                  className="font-medium text-neutral-800 hover:text-blue-600"
                >
                  {reminder.contact.firstName} {reminder.contact.lastName}
                </Link>
                {reminder.note && (
                  <span className="text-neutral-500">&middot; {reminder.note}</span>
                )}
                <span
                  className={clsx(
                    "text-xs font-medium",
                    overdue ? "text-red-600" : "text-neutral-400"
                  )}
                >
                  {overdue ? "Overdue" : "Today"} &middot;{" "}
                  {reminder.dueAt.toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <form action={completeWithId}>
                <Button type="submit" variant="secondary" className="px-3 py-1.5 text-xs">
                  <Check className="h-3.5 w-3.5" />
                  Mark done
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
