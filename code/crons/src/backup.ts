import postgres from "postgres";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
const s3 = new S3Client({ region: process.env.AWS_REGION ?? "eu-west-3" });
const BUCKET = process.env.BACKUPS_BUCKET!;

const TABLES = [
  "users",
  "teams",
  "team_members",
  "invitations",
  "projects",
  "tasks",
  "assets",
];

async function exportTable(tableName: string): Promise<string> {
  const rows = await sql`SELECT * FROM ${sql(tableName)}`;
  return JSON.stringify(rows, null, 2);
}

export async function handler() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `backup-${timestamp}.json`;
  const s3Key = `backups/${filename}`;

  console.log(`Demarrage du backup: ${filename}`);

  const backup: Record<string, any> = {};

  for (const table of TABLES) {
    try {
      backup[table] = JSON.parse(await exportTable(table));
      console.log(`Table ${table}: ${backup[table].length} lignes`);
    } catch (err) {
      console.error(`Erreur export table ${table}:`, err);
      backup[table] = [];
    }
  }

  const body = JSON.stringify(backup, null, 2);

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: s3Key,
      Body: body,
      ContentType: "application/json",
    })
  );

  // Enregistrer le backup en base
  await sql`
    INSERT INTO backups (filename, s3_key)
    VALUES (${filename}, ${s3Key})
  `;

  console.log(`Backup termine: ${s3Key} (${body.length} octets)`);

  await sql.end();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Backup termine", filename, s3Key }),
  };
}
