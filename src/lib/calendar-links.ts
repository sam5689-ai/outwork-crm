import { prisma } from "@/lib/prisma";
import type { CrmLink, CrmLinkType } from "@/lib/google-calendar";

export type ResolvedCrmLink = {
  type: CrmLinkType;
  id: string;
  label: string;
  href: string;
} | null;

/** Resolves a single CRM link (from extendedProperties) into a display label + URL. */
export async function resolveCrmLink(link: CrmLink): Promise<ResolvedCrmLink> {
  if (!link) return null;

  if (link.type === "contact") {
    const contact = await prisma.contact.findUnique({ where: { id: link.id } });
    if (!contact) return null;
    return {
      type: "contact",
      id: link.id,
      label: `${contact.firstName} ${contact.lastName}`,
      href: `/contacts/${link.id}`,
    };
  }

  if (link.type === "client") {
    const client = await prisma.client.findUnique({ where: { id: link.id } });
    if (!client) return null;
    return {
      type: "client",
      id: link.id,
      label: client.companyName,
      href: `/clients/${link.id}`,
    };
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: link.id },
    include: { contact: true },
  });
  if (!candidate) return null;
  return {
    type: "candidate",
    id: link.id,
    label: `${candidate.contact.firstName} ${candidate.contact.lastName}`,
    href: `/candidates/${link.id}`,
  };
}
