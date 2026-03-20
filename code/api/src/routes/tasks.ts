import {zValidator} from "@hono/zod-validator";
import {Hono} from "hono";
import {z} from "zod";
import sql from "../db";
import {authMiddleware} from "../middleware/auth";

const tasksRouter = new Hono();
tasksRouter.use("*", authMiddleware);

function formatTask(row: Record<string, unknown>) {
    return {
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        status: row.status,
        projectId: row.project_id,
        assigneeId: row.assignee_id ?? null,
        createdAt: row.created_at,
    };
}

// POST /projects/:projectId/tasks
tasksRouter.post(
    "/projects/:projectId/tasks",
    zValidator(
        "json",
        z.object({
            name: z.string().min(1),
            description: z.string().nullable().optional(),
            assigneeId: z.string().nullable().optional(),
        }),
    ),
    async (c) => {
        const projectId = c.req.param("projectId");
        const {name, description, assigneeId} = c.req.valid("json");

        const [task] = await sql`
            INSERT INTO tasks (name, description, project_id, assignee_id)
            VALUES (${name}, ${description ?? null}, ${projectId},
                    ${assigneeId ?? null}) RETURNING id, name, description, status, project_id, assignee_id, created_at
        `;

        return c.json(formatTask(task), 201);
    },
);

// GET /projects/:projectId/tasks
tasksRouter.get("/projects/:projectId/tasks", async (c) => {
    const projectId = c.req.param("projectId");

    const result = await sql`
        SELECT id, name, description, status, project_id, assignee_id, created_at
        FROM tasks
        WHERE project_id = ${projectId}
    `;

    return c.json(result.map(formatTask));
});

// GET /tasks/:taskId
tasksRouter.get("/tasks/:taskId", async (c) => {
    const taskId = c.req.param("taskId");

    const [task] = await sql`
        SELECT id, name, description, status, project_id, assignee_id, created_at
        FROM tasks
        WHERE id = ${taskId}
    `;

    if (!task) return c.json({error: "Tâche introuvable"}, 404);
    return c.json(formatTask(task));
});

// PATCH /tasks/:taskId
tasksRouter.patch(
    "/tasks/:taskId",
    zValidator(
        "json",
        z.object({
            name: z.string().min(1).optional(),
            description: z.string().nullable().optional(),
            status: z.enum(["todo", "in_progress", "done"]).optional(),
            assigneeId: z.string().nullable().optional(),
        }),
    ),
    async (c) => {
        const taskId = c.req.param("taskId");
        const data = c.req.valid("json");

        const [updated] = await sql`
            UPDATE tasks
            SET name        = COALESCE(${data.name ?? null}, name),
                description = ${data.description !== undefined ? (data.description ?? null) : sql`description`},
                status      = COALESCE(${data.status ?? null}, status),
                assignee_id = ${data.assigneeId !== undefined ? (data.assigneeId ?? null) : sql`assignee_id`}
            WHERE id = ${taskId} RETURNING id, name, description, status, project_id, assignee_id, created_at
        `;

        if (!updated) return c.json({error: "Tâche introuvable"}, 404);
        return c.json(formatTask(updated));
    },
);

// PATCH /tasks/:taskId/assign
tasksRouter.patch(
    "/tasks/:taskId/assign",
    zValidator("json", z.object({assigneeId: z.string().nullable()})),
    async (c) => {
        const taskId = c.req.param("taskId");
        const {assigneeId} = c.req.valid("json");

        const [updated] = await sql`
            UPDATE tasks
            SET assignee_id = ${assigneeId}
            WHERE id = ${taskId} RETURNING id, name, description, status, project_id, assignee_id, created_at
        `;

        if (!updated) return c.json({error: "Tâche introuvable"}, 404);
        return c.json(formatTask(updated));
    },
);

// PATCH /tasks/:taskId/status
tasksRouter.patch(
    "/tasks/:taskId/status",
    zValidator(
        "json",
        z.object({status: z.enum(["todo", "in_progress", "done"])}),
    ),
    async (c) => {
        const taskId = c.req.param("taskId");
        const {status} = c.req.valid("json");

        const [updated] = await sql`
            UPDATE tasks
            SET status = ${status}
            WHERE id = ${taskId} RETURNING id, name, description, status, project_id, assignee_id, created_at
        `;

        if (!updated) return c.json({error: "Tâche introuvable"}, 404);
        return c.json(formatTask(updated));
    },
);

// DELETE /tasks/:taskId
tasksRouter.delete("/tasks/:taskId", async (c) => {
    const taskId = c.req.param("taskId");
    await sql`DELETE
              FROM tasks
              WHERE id = ${taskId}`;
    return c.json({success: true});
});

export default tasksRouter;
