
import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions, rooms, buildings, schools } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, AlignmentType, WidthType, BorderStyle } from "docx";

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

  let totalDebet = 0;
  let totalKredit = 0;
  let runningBalance = 0;

  const headerRow = new TableRow({
    children: ["No", "Tanggal", "Uraian", "Keterangan", "Penerimaan (Debet)", "Pengeluaran (Kredit)", "Saldo"].map(
      (text) => new TableCell({ children: [new Paragraph({ text, alignment: AlignmentType.CENTER, style: "Strong" })] })
    ),
  });

  const dataRows = transactions.map((tx: any, idx: number) => {
    totalDebet += tx.debit;
    totalKredit += tx.credit;
    runningBalance += tx.debit - tx.credit;

    return new TableRow({
      children: [
        new TableCell({ children: [new Paragraph({ text: (idx + 1).toString(), alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: tx.transactionDate, alignment: AlignmentType.CENTER })] }),
        new TableCell({ children: [new Paragraph({ text: tx.description })] }),
        new TableCell({ children: [new Paragraph({ text: tx.notes || "-" })] }),
        new TableCell({ children: [new Paragraph({ text: tx.debit > 0 ? tx.debit.toLocaleString("id-ID") : "-", alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ text: tx.credit > 0 ? tx.credit.toLocaleString("id-ID") : "-", alignment: AlignmentType.RIGHT })] }),
        new TableCell({ children: [new Paragraph({ text: runningBalance.toLocaleString("id-ID"), alignment: AlignmentType.RIGHT })] }),
      ],
    });
  });

  const footerRow = new TableRow({
    children: [
      new TableCell({ children: [new Paragraph("")] }),
      new TableCell({ children: [new Paragraph("")] }),
      new TableCell({ children: [new Paragraph({ text: "JUMLAH", alignment: AlignmentType.RIGHT, style: "Strong" })] }),
      new TableCell({ children: [new Paragraph("")] }),
      new TableCell({ children: [new Paragraph({ text: totalDebet.toLocaleString("id-ID"), alignment: AlignmentType.RIGHT, style: "Strong" })] }),
      new TableCell({ children: [new Paragraph({ text: totalKredit.toLocaleString("id-ID"), alignment: AlignmentType.RIGHT, style: "Strong" })] }),
      new TableCell({ children: [new Paragraph({ text: runningBalance.toLocaleString("id-ID"), alignment: AlignmentType.RIGHT, style: "Strong" })] }),
    ],
  });

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...dataRows, footerRow],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { size: { orientation: "landscape" } }
        },
        children: [
          new Paragraph({
            text: "BUKU KAS BANTUAN PROGRAM REVITALISASI SEKOLAH",
            heading: "Heading1",
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Sekolah: ${schoolData?.name || "Unknown"}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            text: `Ruang: ${roomData.name} - ${buildingData?.name || ""}`,
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph(""), // Spacing
          table,
          new Paragraph(""), // Spacing
          new Paragraph(""), // Spacing
          new Paragraph({
            children: [
              new TextRun({ text: "Mengetahui,\t\t\t\t\t\t\tBendahara Sekolah", bold: true }),
            ],
            alignment: AlignmentType.RIGHT
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Kepala Sekolah", bold: true }),
            ],
            alignment: AlignmentType.RIGHT
          }),
          new Paragraph(""),
          new Paragraph(""),
          new Paragraph(""),
          new Paragraph({
            children: [
              new TextRun({ text: "( _______________________ )\t\t\t\t\t( _______________________ )" }),
            ],
            alignment: AlignmentType.RIGHT
          })
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);

  return new NextResponse(buffer as any, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="BukuKas_${roomData.name.replace(/\s+/g, '_')}.docx"`,
    },
  });
}
