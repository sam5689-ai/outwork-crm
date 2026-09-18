import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const contacts = await prisma.contact.findMany({
    where: q
      ? {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { company: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { client: true, candidate: true },
  });

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Everyone you've connected with, before they're a client or candidate"
        actions={
          <LinkButton href="/contacts/new">
            <Plus className="h-4 w-4" />
            New Contact
          </LinkButton>
        }
      />

      <Card className="p-0">
        <form className="border-b border-slate-100 p-4">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search by name, email or company..."
            className="w-full max-w-sm rounded-lg border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
        </form>

        {contacts.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-400">
            No contacts found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {contacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="font-medium text-slate-800 hover:text-indigo-500"
                      >
                        {contact.firstName} {contact.lastName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {contact.company ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {contact.email ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {contact.phone ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {contact.client && (
                          <Badge className="bg-rose-50 text-rose-600 ring-rose-100">
                            Client
                          </Badge>
                        )}
                        {contact.candidate && (
                          <Badge className="bg-emerald-50 text-emerald-600 ring-emerald-100">
                            Candidate
                          </Badge>
                        )}
                        {!contact.client && !contact.candidate && (
                          <span className="text-slate-400">-</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
