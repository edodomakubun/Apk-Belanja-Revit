import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  const data = await db
    .select()
    .from(cashTransactions)
    .where(eq(cashTransactions.roomId, roomId))
    .orderBy(desc(cashTransactions.transactionDate), desc(cashTransactions.createdAt))
    .all();

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const id = crypto.randomUUID();

  // Calculate balance
  // In a real robust system, you'd calculate this safely in a transaction to prevent race conditions.
  // For MVP, we get the last transaction for this room.
  const lastTx = await db
    .select({ balanceAfter: cashTransactions.balanceAfter })
    .from(cashTransactions)
    .where(eq(cashTransactions.roomId, body.roomId))
    .orderBy(desc(cashTransactions.transactionDate), desc(cashTransactions.createdAt))
    .limit(1)
    .get();

  const balanceBefore = lastTx?.balanceAfter || 0;
  const debit = Number(body.debit) || 0;
  const credit = Number(body.credit) || 0;

  if (debit < 0 || credit < 0) {
    return NextResponse.json({ error: "Debit and credit cannot be negative" }, { status: 400 });
  }

  const balanceAfter = balanceBefore + debit - credit;

  const newTx = {
    id,
    roomId: body.roomId,
    categoryId: body.categoryId || null,
    transactionDate: body.transactionDate,
    description: body.description,
    debit,
    credit,
    balanceBefore,
    balanceAfter,
    notes: body.notes,
    createdBy: auth.id,
  };

  await db.insert(cashTransactions).values(newTx);

  return NextResponse.json(newTx, { status: 201 });
}
