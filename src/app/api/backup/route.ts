import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
export const runtime = "edge";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        error:
          "Backup not available in Cloudflare production build. Use D1 backup/export tools or a separate backup workflow.",
      },
      { status: 501 }
    );
  }

  try {
    const fs = await import("fs");
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "sqlite.db");

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
    }

    return NextResponse.json({ error: "Database file not found." }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: "Failed to read database file." }, { status: 500 });
  }
}
