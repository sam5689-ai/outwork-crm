import type { EmailFolder } from "@/generated/prisma/enums";

export const INBOX_FOLDERS: EmailFolder[] = [
  "INBOX",
  "SENT",
  "ARCHIVE",
  "TRASH",
  "DRAFT",
];

export const FOLDER_LABELS: Record<EmailFolder, string> = {
  INBOX: "Inbox",
  SENT: "Sent",
  ARCHIVE: "Archive",
  TRASH: "Trash",
  DRAFT: "Drafts",
};

/** Views the folder rail exposes, including the cross-folder Starred filter. */
export type InboxView = EmailFolder | "STARRED";
