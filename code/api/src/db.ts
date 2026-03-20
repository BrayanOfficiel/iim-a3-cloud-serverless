import postgres from "postgres";

const isLocal = (process.env.DATABASE_URL ?? "").includes("localhost");

const sql = postgres(process.env.DATABASE_URL ?? "", {
  max: 1,
  ssl: isLocal ? false : "require",
});

export default sql;
