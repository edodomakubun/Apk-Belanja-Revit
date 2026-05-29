
import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions, auditLogs } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, status } = await request.json(); // status: "APPROVED" | "REJECTED"

  if (!id || !["APPROVED", "REJECTED"].includes(status)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // Find transaction
  const tx = await db.select().from(cashTransactions).where(and(eq(cashTransactions.id, id), eq(cashTransactions.schoolId, auth.schoolId))).get();

  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  // Update status
  await db.update(cashTransactions).set({ status, approvedBy: auth.id }).where(eq(cashTransactions.id, id));

  // Log Audit
  await db.insert(auditLogs).values({
    id: crypto.randomUUID(),
    schoolId: auth.schoolId,
    userId: auth.id,
    action: `UPDATE_TRANSACTION_STATUS_${status}`,
    entity: "CASH_TRANSACTION",
    entityId: tx.id,
    details: JSON.stringify({ oldStatus: tx.status, newStatus: status }),
  });

  return NextResponse.json({ message: "Status updated successfully" });
}
