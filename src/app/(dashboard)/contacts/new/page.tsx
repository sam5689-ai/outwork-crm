import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ContactForm } from "@/components/contacts/contact-form";
import { createContact } from "../actions";

export default function NewContactPage() {
  return (
    <div>
      <PageHeader title="New Contact" description="Add a new contact" />
      <Card className="max-w-2xl">
        <ContactForm action={createContact} cancelHref="/contacts" />
      </Card>
    </div>
  );
}
