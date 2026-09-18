import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";

export default async function SettingsIndexPage() {
  const user = await requireUser();
  redirect(user.role === "ADMIN" ? "/settings/general" : "/settings/integrations");
}
