import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions, rooms, buildings, schools } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
export const runtime = "edge";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  // Fetch Data
  const roomData = await db.select().from(rooms).where(and(eq(rooms.id, roomId), eq(rooms.schoolId, auth.schoolId))).get();
  if (!roomData) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const buildingData = await db.select().from(buildings).where(eq(buildings.id, roomData.buildingId)).get();
  const schoolData = await db.select().from(schools).where(eq(schools.id, auth.schoolId)).get();

  const transactions = await db
    .select()
    .from(cashTransactions)
    .where(and(eq(cashTransactions.roomId, roomId), eq(cashTransactions.schoolId, auth.schoolId), eq(cashTransactions.status, "APPROVED")))
    .orderBy(asc(cashTransactions.transactionDate), asc(cashTransactions.createdAt))
    .all();

  // Generate PDF
  const doc = new jsPDF("landscape");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("BUKU KAS BANTUAN PROGRAM REVITALISASI SEKOLAH", 148, 15, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Sekolah: ${schoolData?.name || "Unknown"}`, 148, 22, { align: "center" });
  doc.text(`Ruang: ${roomData.name} - ${buildingData?.name || ""}`, 148, 28, { align: "center" });

  let totalDebet = 0;
  let totalKredit = 0;
  let runningBalance = 0;

  const tableData = transactions.map((tx, idx) => {
    totalDebet += tx.debit;
    totalKredit += tx.credit;
    runningBalance += tx.debit - tx.credit;

    return [
      idx + 1,
      tx.transactionDate,
      tx.description,
      tx.notes || "-",
      tx.debit > 0 ? tx.debit.toLocaleString("id-ID") : "-",
      tx.credit > 0 ? tx.credit.toLocaleString("id-ID") : "-",
      runningBalance.toLocaleString("id-ID")
    ];
  });

  tableData.push([
    "", "", "JUMLAH", "",
    totalDebet.toLocaleString("id-ID"),
    totalKredit.toLocaleString("id-ID"),
    runningBalance.toLocaleString("id-ID")
  ]);

  autoTable(doc, {
    startY: 35,
    head: [["No", "Tanggal", "Uraian", "Keterangan", "Penerimaan (Debet)", "Pengeluaran (Kredit)", "Saldo"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [220, 220, 220], textColor: 0, halign: "center" },
    columnStyles: {
      0: { halign: "center", cellWidth: 15 },
      1: { halign: "center", cellWidth: 30 },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right", fontStyle: "bold" },
    },
    didParseCell: function (data) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [240, 240, 240];
      }
    }
  });

  // Tanda Tangan
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.setFont("helvetica", "normal");
  doc.text("Mengetahui,", 200, finalY, { align: "center" });
  doc.text("Kepala Sekolah", 200, finalY + 5, { align: "center" });
  doc.text("Bendahara Sekolah", 250, finalY + 5, { align: "center" });

  doc.text("( _______________________ )", 200, finalY + 25, { align: "center" });
  doc.text("( _______________________ )", 250, finalY + 25, { align: "center" });

  const pdfBuffer = doc.output("arraybuffer");

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="BukuKas_${roomData.name.replace(/\s+/g, '_')}.pdf"`,
    },
  });
}
