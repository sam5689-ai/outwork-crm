import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateJobPost, isGeminiConfigured } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isGeminiConfigured()) {
    return NextResponse.json(
      { error: "AI generation isn't configured. Set GEMINI_API_KEY." },
      { status: 503 }
    );
  }

  const body = await request.json().catch(() => null);
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json(
      { error: "Describe the role first." },
      { status: 400 }
    );
  }

  try {
    const result = await generateJobPost({
      prompt,
      clientName: typeof body?.clientName === "string" ? body.clientName : undefined,
      industry: typeof body?.industry === "string" ? body.industry : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("Gemini job post generation failed", error);
    return NextResponse.json(
      { error: "AI generation failed. Try again." },
      { status: 502 }
    );
  }
}
