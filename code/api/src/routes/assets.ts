import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import sql from "../db";
import { authMiddleware } from "../middleware/auth";

const assetsRouter = new Hono();
assetsRouter.use("*", authMiddleware);

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "eu-west-3" });
const BUCKET = process.env.ASSETS_BUCKET ?? "";

function formatAsset(row: Record<string, unknown>) {
  return {
    id: row.id,
    filename: row.filename,
    s3Key: row.s3_key,
    taskId: row.task_id,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

// POST /tasks/:taskId/assets
assetsRouter.post(
  "/tasks/:taskId/assets",
  zValidator(
    "json",
    z.object({
      filename: z.string().min(1),
      contentType: z.string().min(1),
    }),
  ),
  async (c) => {
    const userId = c.get("userId");
    const taskId = c.req.param("taskId");
    const { filename, contentType } = c.req.valid("json");
    const s3Key = `tasks/${taskId}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    const [asset] = await sql`
      INSERT INTO assets (filename, s3_key, task_id, uploaded_by)
      VALUES (${filename}, ${s3Key}, ${taskId}, ${userId})
      RETURNING id, filename, s3_key, task_id, uploaded_by, created_at
    `;

    return c.json({ uploadUrl, asset: formatAsset(asset) }, 201);
  },
);

// GET /tasks/:taskId/assets
assetsRouter.get("/tasks/:taskId/assets", async (c) => {
  const taskId = c.req.param("taskId");

  const result = await sql`
    SELECT id, filename, s3_key, task_id, uploaded_by, created_at
    FROM assets WHERE task_id = ${taskId}
  `;

  return c.json(result.map(formatAsset));
});

// DELETE /assets/:assetId
assetsRouter.delete("/assets/:assetId", async (c) => {
  const assetId = c.req.param("assetId");

  const [asset] = await sql`
    SELECT id, s3_key FROM assets WHERE id = ${assetId}
  `;

  if (!asset) return c.json({ error: "Fichier introuvable" }, 404);

  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: asset.s3_key }));
  await sql`DELETE FROM assets WHERE id = ${assetId}`;

  return c.json({ success: true });
});

export default assetsRouter;
