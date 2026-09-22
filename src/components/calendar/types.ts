export type CalendarEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  allDay: boolean;
  meetLink: string | null;
  htmlLink: string | null;
  attendees: { email: string; name: string | null; responseStatus: string | null }[];
  crmLink: {
    type: "contact" | "client" | "candidate";
    id: string;
    label: string;
    href: string;
  } | null;
};

export type CalendarView = "month" | "week" | "day" | "agenda";
