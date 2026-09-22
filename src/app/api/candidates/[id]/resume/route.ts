import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const candidate = await prisma.candidate.findUnique({
    where: { id },
    select: { resumeData: true, resumeFilename: true, resumeMimeType: true },
  });

  if (!candidate?.resumeData || !candidate.resumeFilename) {
    return new Response("Not found", { status: 404 });
  }

  const safeFilename = candidate.resumeFilename.replace(/["\r\n]/g, "");

  return new Response(new Uint8Array(candidate.resumeData), {
    headers: {
      "Content-Type": candidate.resumeMimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
