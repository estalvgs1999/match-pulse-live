import { z } from "zod";
import { setSessionCookie, verifyPassword } from "@/lib/auth";

const LoginSchema = z.object({ password: z.string().min(1) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!verifyPassword(parsed.data.password)) {
    return Response.json({ error: "Invalid password" }, { status: 401 });
  }

  await setSessionCookie();
  return Response.json({ ok: true });
}
