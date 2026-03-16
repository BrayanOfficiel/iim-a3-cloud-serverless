import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "../db";
import { assets } from "../db/schema";
import { authMiddleware } from "../middleware/auth";

const assetsRouter = new Hono();
assetsRouter.use("*", authMiddleware);

const s3 = new S3Client({ region: process.env.AWS_REGION ?? "eu-west-3" });
const BUCKET = process.env.ASSETS_BUCKET!;

assetsRouter.post(
  "/presign",
  zValidator(
    "json",
    z.object({
      filename: z.string().min(1),
      contentType: z.string().min(1),
      taskId: z.string().uuid(),
    })
  ),
  async (c) => {
    const userId = c.get("userId");
    const { filename, contentType, taskId } = c.req.valid("json");
    const s3Key = `tasks/${taskId}/${Date.now()}-${filename}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

    const [asset] = await db
      .insert(assets)
      .values({ filename, s3Key, taskId, uploadedBy: userId })
      .returning();

    return c.json({ uploadUrl, asset }, 201);
  }
);

assetsRouter.get("/task/:taskId", async (c) => {
  const taskId = c.req.param("taskId");
  const result = await db
    .select()
    .from(assets)
    .where(eq(assets.taskId, taskId));
  return c.json(result);
});

assetsRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");

  const [asset] = await db
    .select()
    .from(assets)
    .where(eq(assets.id, id))
    .limit(1);

  if (!asset) return c.json({ error: "Not found" }, 404);

  await s3.send(
    new DeleteObjectCommand({ Bucket: BUCKET, Key: asset.s3Key })
  );
  await db.delete(assets).where(eq(assets.id, id));

  return c.json({ success: true });
});

export default assetsRouter;
