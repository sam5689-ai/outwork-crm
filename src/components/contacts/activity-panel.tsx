import { Bell, Check, Clock } from "lucide-react";
import { clsx } from "clsx";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CONTACT_CHANNEL_LABELS, CONTACT_CHANNEL_COLORS } from "@/lib/stages";
import { ActivityForms } from "./activity-forms";
import {
  addActivityNote,
  createReminder,
  completeReminder,
} from "@/app/(dashboard)/contacts/actions";

/**
 * Self-fetching "Activity" card for a Contact/Client/Candidate detail page:
 * log an interaction (phone call / email / WhatsApp / other), schedule a
 * follow-up reminder, and see both in one timeline. Reminders also surface
 * on the in-app Calendar and the dashboard's due-today banner.
 */
export async function ActivityPanel({ contactId }: { contactId: string }) {
  const [activities, reminders] = await Promise.all([
    prisma.activity.findMany({
      where: { contactId },
      orderBy: { createdAt: "desc" },
      include: { author: true },
      take: 25,
    }),
    prisma.reminder.findMany({
      where: { contactId },
      orderBy: { dueAt: "asc" },
      include: { author: true },
    }),
  ]);

  const pendingReminders = reminders.filter((r) => !r.completedAt);
  const pastReminders = reminders.filter((r) => r.completedAt);

  const logActionWithId = addActivityNote.bind(null, contactId);
  const reminderActionWithId = createReminder.bind(null, contactId);

  return (
    <Card>
      <h2 className="mb-4 font-display text-base font-semibold text-ink">
        Activity &amp; Reminders
      </h2>

      <div className="mb-4">
        <ActivityForms
          logAction={logActionWithId}
          reminderAction={reminderActionWithId}
        />
      </div>

      {pendingReminders.length > 0 && (
        <ul className="mb-4 space-y-2">
          {pendingReminders.map((reminder) => {
            const overdue = reminder.dueAt.getTime() < new Date().getTime();
            const completeWithId = completeReminder.bind(
              null,
              contactId,
              reminder.id
            );
            return (
              <li
                key={reminder.id}
                className={clsx(
                  "flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5",
                  overdue
                    ? "border-amber-200 bg-amber-50"
                    : "border-neutral-200"
                )}
              >
                <div className="flex items-start gap-2">
                  <Bell
                    className={clsx(
                      "mt-0.5 h-4 w-4 shrink-0",
                      overdue ? "text-amber-500" : "text-neutral-400"
                    )}
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge className={CONTACT_CHANNEL_COLORS[reminder.channel]}>
                        {CONTACT_CHANNEL_LABELS[reminder.channel]}
                      </Badge>
                      <span className="text-xs font-medium text-neutral-500">
                        {reminder.dueAt.toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    {reminder.note && (
                      <p className="mt-1 text-sm text-neutral-700">
                        {reminder.note}
                      </p>
                    )}
                  </div>
                </div>
                <form action={completeWithId}>
                  <Button type="submit" variant="secondary" className="shrink-0 px-3 py-1.5 text-xs">
                    <Check className="h-3.5 w-3.5" />
                    Mark done
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}

      {activities.length === 0 && pastReminders.length === 0 ? (
        <p className="py-4 text-center text-sm text-neutral-400">
          No activity logged yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {[
            ...activities.map((a) => ({
              id: `activity:${a.id}`,
              at: a.createdAt,
              channel: a.channel,
              body: a.body,
              author: a.author.name,
              kind: "activity" as const,
            })),
            ...pastReminders.map((r) => ({
              id: `reminder:${r.id}`,
              at: r.completedAt!,
              channel: r.channel,
              body: r.note ? `Reminder done: ${r.note}` : "Reminder done.",
              author: r.author.name,
              kind: "reminder" as const,
            })),
          ]
            .sort((a, b) => b.at.getTime() - a.at.getTime())
            .map((item) => (
              <li key={item.id} className="border-l-2 border-blue-100 pl-3 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  {item.channel && (
                    <Badge className={CONTACT_CHANNEL_COLORS[item.channel]}>
                      {CONTACT_CHANNEL_LABELS[item.channel]}
                    </Badge>
                  )}
                  {item.kind === "reminder" && (
                    <Clock className="h-3.5 w-3.5 text-emerald-500" />
                  )}
                </div>
                <p className="mt-0.5 text-neutral-700">{item.body}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {item.author} &middot; {item.at.toLocaleString()}
                </p>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}
