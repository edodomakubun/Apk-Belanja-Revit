import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const buildingId = url.searchParams.get("buildingId");

  let query = db.select().from(rooms);
  if (buildingId) {
    query = query.where(eq(rooms.buildingId, buildingId)) as any;
  }

  const data = await query.all();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "ADMIN") return NextResponse.json({error: "Forbidden"}, {status: 403});

  const body = await request.json();
  const id = crypto.randomUUID();
  await db.insert(rooms).values({ id, buildingId: body.buildingId, name: body.name });
  return NextResponse.json({ id, buildingId: body.buildingId, name: body.name }, { status: 201 });
}
