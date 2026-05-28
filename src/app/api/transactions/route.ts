import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, desc, asc, and } from "drizzle-orm";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  // Get data ascending to calculate running balance correctly
  const rawData = await db
    .select()
    .from(cashTransactions)
    .where(and(eq(cashTransactions.roomId, roomId), eq(cashTransactions.schoolId, auth.schoolId)))
    .orderBy(asc(cashTransactions.transactionDate), asc(cashTransactions.createdAt))
    .all();

  let currentBalance = 0;
  const processedData = rawData.map((tx) => {
    // Only approved transactions affect the balance
    if (tx.status === "APPROVED") {
      currentBalance += tx.debit - tx.credit;
    }
    return { ...tx, balanceAfter: currentBalance };
  });

  // Return descending to UI for newest-first display
  return NextResponse.json(processedData.reverse());
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const id = crypto.randomUUID();

  const debit = Number(body.debit) || 0;
  const credit = Number(body.credit) || 0;

  if (debit < 0 || credit < 0) {
    return NextResponse.json({ error: "Debit and credit cannot be negative" }, { status: 400 });
  }

  // We no longer calculate static balance before/after at insert time due to approval/rejection workflows
  // which can permanently corrupt the balances. It will be computed at runtime when queried.
  // We keep the fields in schema for backward compatibility but default them to 0.

  const newTx = {
    id,
    schoolId: auth.schoolId,
    roomId: body.roomId,
    categoryId: body.categoryId || null,
    transactionDate: body.transactionDate,
    description: body.description,
    debit,
    credit,
    balanceBefore: 0,
    balanceAfter: 0,
    notes: body.notes,
    status: auth.role === "ADMIN" ? "APPROVED" : "PENDING",
    createdBy: auth.id,
  };

  await db.insert(cashTransactions).values(newTx as any);

  return NextResponse.json(newTx, { status: 201 });
}
