

import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions, rooms, buildings } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { sql, eq, and } from "drizzle-orm";

export async function GET() {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  // Simple aggregations for dashboard
  const summary = await db
    .select({
      totalDebit: sql<number>`sum(${cashTransactions.debit})`,
      totalCredit: sql<number>`sum(${cashTransactions.credit})`,
      transactionCount: sql<number>`count(*)`,
    })
    .from(cashTransactions)
    .where(and(eq(cashTransactions.schoolId, auth.schoolId), eq(cashTransactions.status, "APPROVED")))
    .get();

  const debit = summary?.totalDebit || 0;
  const credit = summary?.totalCredit || 0;

  // Chart data: pengeluaran per bangunan
  const chartDataRaw = await db
    .select({
      buildingName: buildings.name,
      pengeluaran: sql<number>`sum(${cashTransactions.credit})`,
    })
    .from(cashTransactions)
    .innerJoin(rooms, eq(cashTransactions.roomId, rooms.id))
    .innerJoin(buildings, eq(rooms.buildingId, buildings.id))
    .where(and(eq(cashTransactions.schoolId, auth.schoolId), eq(cashTransactions.status, "APPROVED")))
    .groupBy(buildings.name)
    .all();

  return NextResponse.json({
    totalPemasukan: debit,
    totalPengeluaran: credit,
    totalSaldo: debit - credit,
    totalTransaksi: summary?.transactionCount || 0,
    chartData: chartDataRaw.map(d => ({ name: d.buildingName, total: d.pengeluaran || 0 })),
  });
}
