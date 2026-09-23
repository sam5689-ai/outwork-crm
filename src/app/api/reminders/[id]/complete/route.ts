import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const reminder = await prisma.reminder.findUnique({ where: { id } });
  if (!reminder || reminder.authorId !== session.user.id) {
    return NextResponse.json({ error: "Reminder not found." }, { status: 404 });
  }

  await prisma.reminder.update({
    where: { id },
    data: { completedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
