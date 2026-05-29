import { drizzle as drizzleLibsql } from "drizzle-orm/libsql";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import { createClient } from "@libsql/client";
import * as schema from "./schema";
import { getRequestContext } from "@cloudflare/next-on-pages";

export function getDb() {
  try {
    const env = getRequestContext().env as unknown as { DB: any };
    if (env && env.DB) {
      return drizzleD1(env.DB, { schema });
    }
  } catch (e) {
    // Fallback to SQLite
  }

  const client = createClient({
      url: process.env.DB_URL || "file:./sqlite.db"
  });
  return drizzleLibsql(client as any, { schema }) as any;
}

export const db = getDb();
