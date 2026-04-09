import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { cors } from "hono/cors";
import { requireAuth } from "./auth.js";
import authRoutes from "./routes/auth.js";
import workerRoutes from "./routes/workers.js";
import recordRoutes from "./routes/records.js";

const app = new Hono();

// Dev CORS (Vite runs on :5173, API on :3000)
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    allowHeaders: ["Authorization", "Content-Type", "X-Google-Token"],
    allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  })
);

// ── Auth (no middleware — you need this to GET a session) ──────────────────────
app.route("/api/auth", authRoutes);

// ── Protected API routes ───────────────────────────────────────────────────────
app.use("/api/*", requireAuth);
app.route("/api/workers", workerRoutes);
app.route("/api/tour-records", recordRoutes);

// ── Serve frontend in production ───────────────────────────────────────────────
app.use("/*", serveStatic({ root: "../web/dist" }));
app.get("*", serveStatic({ path: "../web/dist/index.html" }));

const PORT = parseInt(process.env.PORT ?? "3000", 10);
serve({ fetch: app.fetch, port: PORT }, () => {
  console.log(`Tour Tracker API → http://localhost:${PORT}`);
});
