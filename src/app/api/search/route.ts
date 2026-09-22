import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json({ results: [] });
  }

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { company: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: { updatedAt: "desc" },
    take: 8,
    include: { client: true, candidate: true },
  });

  const results = contacts.map((contact) => ({
    id: contact.id,
    name: `${contact.firstName} ${contact.lastName}`,
    company: contact.company,
    email: contact.email,
    isDeal: Boolean(contact.client),
    isCandidate: Boolean(contact.candidate),
  }));

  return NextResponse.json({ results });
}
