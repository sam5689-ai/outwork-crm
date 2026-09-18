import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { requireUser } from "@/lib/session";
import { getGoogleAuthUrl, isGoogleConfigured } from "@/lib/google";

export async function GET(request: Request) {
  await requireUser();

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=not_configured", request.url)
    );
  }

  const state = randomBytes(16).toString("hex");
  const authUrl = getGoogleAuthUrl(state);

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return response;
}
