import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions, rooms, buildings } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { sql } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Simple aggregations for dashboard MVP
  const summary = await db
    .select({
      totalDebit: sql<number>`sum(${cashTransactions.debit})`,
      totalCredit: sql<number>`sum(${cashTransactions.credit})`,
      transactionCount: sql<number>`count(*)`,
    })
    .from(cashTransactions)
    .get();

  const debit = summary?.totalDebit || 0;
  const credit = summary?.totalCredit || 0;

  return NextResponse.json({
    totalPemasukan: debit,
    totalPengeluaran: credit,
    totalSaldo: debit - credit,
    totalTransaksi: summary?.transactionCount || 0,
  });
}
