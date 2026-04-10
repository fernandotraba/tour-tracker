import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { requireAuth } from "./auth.js";
import authRoutes from "./routes/auth.js";
import workerRoutes from "./routes/workers.js";
import recordRoutes from "./routes/records.js";

const app = new Hono();

// CORS for local dev only
if (process.env.NODE_ENV !== "production") {
  app.use(
    "/api/*",
    cors({
      origin: ["http://localhost:5173", "http://localhost:3000"],
      allowHeaders: ["Authorization", "Content-Type", "X-Google-Token"],
      allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
    })
  );
}

// ── Auth (no middleware — you need this to GET a session) ──────────────────────
app.route("/api/auth", authRoutes);

// ── Protected API routes ───────────────────────────────────────────────────────
app.use("/api/*", requireAuth);
app.route("/api/workers", workerRoutes);
app.route("/api/tour-records", recordRoutes);

// ── Serve frontend ─────────────────────────────────────────────────────────────
// Production: Railway runs from repo root, so path is apps/web/dist
// Dev: bun runs from apps/api, so path is ../web/dist
const staticRoot = process.env.NODE_ENV === "production" ? "apps/web/dist" : "../web/dist";
app.use("/*", serveStatic({ root: staticRoot }));
app.get("*", serveStatic({ path: `${staticRoot}/index.html` }));

const PORT = parseInt(process.env.PORT ?? "3000", 10);
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Tour Tracker API → http://localhost:${PORT}`);
});
