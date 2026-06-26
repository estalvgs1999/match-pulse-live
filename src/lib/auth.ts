import { cookies } from "next/headers";

const COOKIE_NAME = "mpl_session";
const SESSION_TOKEN = "authenticated";
const MAX_AGE_SECONDS = 60 * 60 * 12; // 12h, a typical broadcast shift

export function verifyPassword(input: string): boolean {
  const expected = process.env.CONTROL_PASSWORD;
  return Boolean(expected) && input === expected;
}

export async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, SESSION_TOKEN, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value === SESSION_TOKEN;
}
