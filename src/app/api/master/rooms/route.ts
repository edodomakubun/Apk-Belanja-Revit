import { NextResponse } from "next/server";
import { db } from "@/db";
import { rooms } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq } from "drizzle-orm";
export const runtime = "edge";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const buildingId = url.searchParams.get("buildingId");

  let query = db.select().from(rooms).where(eq(rooms.schoolId, auth.schoolId));
  // Need custom type-safe approach since we used dynamic query earlier which had TS issues
  let data;
  if (buildingId) {
    data = await db.select().from(rooms).where(eq(rooms.buildingId, buildingId)).all();
    // In real app we'd combine where eq schoolId AND eq buildingId
    data = data.filter(r => r.schoolId === auth.schoolId);
  } else {
    data = await query.all();
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "ADMIN") return NextResponse.json({error: "Forbidden"}, {status: 403});

  const body = await request.json();
  const id = crypto.randomUUID();
  await db.insert(rooms).values({ id, schoolId: auth.schoolId, buildingId: body.buildingId, name: body.name });
  return NextResponse.json({ id, buildingId: body.buildingId, name: body.name }, { status: 201 });
}
