import { NextResponse } from "next/server";
import { db } from "@/db";
import { expenseCategories } from "@/db/schema";
import { requireAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const data = await db.select().from(expenseCategories).all();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "ADMIN") return NextResponse.json({error: "Forbidden"}, {status: 403});

  const body = await request.json();
  const id = crypto.randomUUID();
  await db.insert(expenseCategories).values({ id, name: body.name });
  return NextResponse.json({ id, name: body.name }, { status: 201 });
}
