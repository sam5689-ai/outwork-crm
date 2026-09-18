import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { google } from "googleapis";
import { requireUser } from "@/lib/session";
import { getGoogleOAuthClient } from "@/lib/google";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("google_oauth_state")?.value;

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings/integrations?error=${error}`, request.url)
    );
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/settings/integrations?error=invalid_state", request.url)
    );
  }

  try {
    const client = getGoogleOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: client, version: "v2" });
    const { data: profile } = await oauth2.userinfo.get();

    await prisma.googleAccount.upsert({
      where: { userId: user.id },
      update: {
        googleEmail: profile.email ?? "",
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token ?? undefined,
        scope: tokens.scope,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
      create: {
        userId: user.id,
        googleEmail: profile.email ?? "",
        accessToken: tokens.access_token ?? "",
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    const response = NextResponse.redirect(
      new URL("/settings/integrations?connected=1", request.url)
    );
    response.cookies.delete("google_oauth_state");
    return response;
  } catch (err) {
    console.error("Google OAuth callback failed", err);
    return NextResponse.redirect(
      new URL("/settings/integrations?error=exchange_failed", request.url)
    );
  }
}
