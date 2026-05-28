import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const d1Binding = typeof globalThis !== "undefined"
  ? (globalThis as any).kas_sekolah_db ?? (globalThis as any).KAS_SEKOLAH_DB
  : undefined;

const client = d1Binding
  ? d1Binding
  : createClient({ url: process.env.DB_URL || "file:./sqlite.db" });

export const db = drizzle(client, { schema });
