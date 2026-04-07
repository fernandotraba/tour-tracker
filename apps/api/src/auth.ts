import { createMiddleware } from "hono/factory";
import { jwtVerify } from "jose";
import type { SessionUser } from "@tour-tracker/shared";

export const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-change-in-prod"
);

type Variables = { user: SessionUser };

export const requireAuth = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer "))
    return c.json({ error: "Unauthorized" }, 401);
  try {
    const { payload } = await jwtVerify(header.slice(7), SESSION_SECRET);
    c.set("user", payload as unknown as SessionUser);
    await next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
});
