import { Hono } from "hono";
import { SignJWT } from "jose";
import { SESSION_SECRET } from "../auth.js";
import type { AuthResponse } from "@tour-tracker/shared";

const auth = new Hono();

auth.post("/verify", async (c) => {
  const header = c.req.header("Authorization");
  if (!header?.startsWith("Bearer "))
    return c.json({ error: "Missing token" }, 401);

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: header },
  });
  if (!res.ok) return c.json({ error: "Invalid Google token" }, 401);

  const info = (await res.json()) as { hd?: string; email: string; name: string; picture: string };
  if (info.hd !== "traba.work")
    return c.json({ error: "Access restricted to @traba.work accounts" }, 403);

  const token = await new SignJWT({ email: info.email, name: info.name, picture: info.picture })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SESSION_SECRET);

  return c.json<AuthResponse>({ email: info.email, name: info.name, picture: info.picture, token });
});

export default auth;
