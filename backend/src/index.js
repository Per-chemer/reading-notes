require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const notesRoutes = require("./routes/notes");

const app = express();
const port = Number(process.env.PORT || 4000);
// CORS_ORIGIN supports one or more origins separated by comma.
// Example:
// - local:  CORS_ORIGIN=http://localhost:5173
// - deploy: CORS_ORIGIN=https://your-frontend.vercel.app
// - both:   CORS_ORIGIN=http://localhost:5173,https://your-frontend.vercel.app
const corsOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

app.use(
  cors({
    // Only allow requests from configured frontend origins.
    origin(origin, callback) {
      // Allow server-to-server calls and tools with no browser Origin header.
      if (!origin) {
        return callback(null, true);
      }
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  }),
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

app.use((err, _req, res, _next) => {
  res.status(500).json({ message: "Unexpected server error.", error: err.message });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend API listening on http://localhost:${port}`);
});
