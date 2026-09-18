import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contacts/contact-form";
import { updateContact } from "../../actions";

export default async function EditContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({ where: { id } });
  if (!contact) notFound();

  const updateContactWithId = updateContact.bind(null, contact.id);

  return (
    <div>
      <PageHeader
        title={`Edit ${contact.firstName} ${contact.lastName}`}
      />
      <Card className="max-w-2xl">
        <ContactForm
          action={updateContactWithId}
          contact={contact}
          cancelHref={`/contacts/${contact.id}`}
        />
      </Card>
    </div>
  );
}
