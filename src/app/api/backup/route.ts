import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import fs from "fs";
import path from "path";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // For Local / Development SQLite Database backup
  // In production (Cloudflare D1), backup should be handled via D1 Backup API or Wrangler.
  // This MVP approach serves the local file if it exists.

  const dbPath = path.join(process.cwd(), "sqlite.db");

  try {
    if (fs.existsSync(dbPath)) {
      const dbBuffer = fs.readFileSync(dbPath);

      const dateStr = new Date().toISOString().split("T")[0];
      return new NextResponse(dbBuffer, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="backup-sistem-kas-${dateStr}.db"`,
        },
      });
    } else {
      return NextResponse.json({ error: "Database file not found." }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Failed to read database file." }, { status: 500 });
  }
}
