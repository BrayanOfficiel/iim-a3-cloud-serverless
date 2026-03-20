import { Hono } from "hono";
import { cors } from "hono/cors";
import adminRouter from "./routes/admin";
import assetsRouter from "./routes/assets";
import auth from "./routes/auth";
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

// Auth
app.route("/", auth);

// Users
app.route("/", usersRouter);

// Teams
app.route("/teams", teamsRouter);

// Invitations
app.route("/", invitationsRouter);

// Projects
app.route("/", projectsRouter);

// Tasks
app.route("/", tasksRouter);

// Assets
app.route("/", assetsRouter);

// Admin
app.route("/admin", adminRouter);

export default app;
