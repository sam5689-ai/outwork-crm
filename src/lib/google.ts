import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.events",
];

export function isGoogleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleOAuthClient() {
  if (!isGoogleConfigured()) {
    throw new Error(
      "Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI."
    );
  }
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getGoogleAuthUrl(state: string) {
  const client = getGoogleOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: GOOGLE_SCOPES,
    state,
  });
}

/**
 * Returns an OAuth2 client authenticated for the given user, refreshing and
 * persisting the access token if it has expired. Returns null if the user
 * hasn't connected a Google account.
 */
export async function getUserGoogleClient(userId: string) {
  const account = await prisma.googleAccount.findUnique({
    where: { userId },
  });
  if (!account) return null;

  const client = getGoogleOAuthClient();
  client.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken ?? undefined,
    expiry_date: account.expiresAt?.getTime(),
  });

  client.on("tokens", async (tokens) => {
    await prisma.googleAccount.update({
      where: { userId },
      data: {
        accessToken: tokens.access_token ?? account.accessToken,
        refreshToken: tokens.refresh_token ?? account.refreshToken,
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : account.expiresAt,
      },
    });
  });

  return client;
}
