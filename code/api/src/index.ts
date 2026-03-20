import { Hono } from "hono";
import { cors } from "hono/cors";
import adminRouter from "./routes/admin";
import assetsRouter from "./routes/assets";
import authRouter from "./routes/auth";
import invitationsRouter from "./routes/invitations";
import projectsRouter from "./routes/projects";
import tasksRouter from "./routes/tasks";
import teamsRouter from "./routes/teams";
import usersRouter from "./routes/users";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin,
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/health", (c) => c.json({ status: "ok" }));

// Auth (pas de middleware auth)
app.route("/", authRouter);
app.route("/auth", authRouter);

// Users (avec middleware auth)
app.route("/me", usersRouter);

// Teams (avec middleware auth)
app.route("/teams", teamsRouter);

// Invitations (avec middleware auth)
app.route("/", invitationsRouter);

// Projects (avec middleware auth)
app.route("/", projectsRouter);

// Tasks (avec middleware auth)
app.route("/", tasksRouter);

// Assets (avec middleware auth)
app.route("/", assetsRouter);

// Admin (avec middleware auth + admin)
app.route("/admin", adminRouter);

export default app;
