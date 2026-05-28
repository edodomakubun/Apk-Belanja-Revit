import { NextResponse } from "next/server";
import { db } from "@/db";
import { cashTransactions, rooms, buildings } from "@/db/schema";
import { requireAuth } from "@/lib/auth";
import { eq, and, asc } from "drizzle-orm";
import ExcelJS from "exceljs";

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const roomId = url.searchParams.get("roomId");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required" }, { status: 400 });
  }

  // Get room and building info
  const roomData = await db.select().from(rooms).where(and(eq(rooms.id, roomId), eq(rooms.schoolId, auth.schoolId))).get();
  if (!roomData) return NextResponse.json({ error: "Room not found" }, { status: 404 });

  const buildingData = await db.select().from(buildings).where(eq(buildings.id, roomData.buildingId)).get();
  const buildingName = buildingData?.name || "Unknown Building";

  // Get transactions for the room
  const transactions = await db
    .select()
    .from(cashTransactions)
    .where(and(eq(cashTransactions.roomId, roomId), eq(cashTransactions.schoolId, auth.schoolId), eq(cashTransactions.status, "APPROVED")))
    .orderBy(asc(cashTransactions.transactionDate), asc(cashTransactions.createdAt))
    .all();

  // Create Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Sistem Buku Kas";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet(`Buku Kas - ${roomData.name}`);

  // Set Page Setup for printing
  sheet.pageSetup.paperSize = 9; // A4
  sheet.pageSetup.orientation = "landscape";
  sheet.pageSetup.fitToPage = true;
  sheet.pageSetup.fitToWidth = 1;
  sheet.pageSetup.fitToHeight = 0;
  sheet.pageSetup.margins = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };

  // Styling helpers
  const borderAll: Partial<ExcelJS.Borders> = {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  };

  const centerAlign: Partial<ExcelJS.Alignment> = { vertical: "middle", horizontal: "center" };

  // Header Title
  sheet.mergeCells("A1:H1");
  const title1 = sheet.getCell("A1");
  title1.value = "BUKU KAS BANTUAN PROGRAM REVITALISASI SEKOLAH";
  title1.font = { name: "Arial", size: 14, bold: true };
  title1.alignment = centerAlign;

  sheet.mergeCells("A2:H2");
  const title2 = sheet.getCell("A2");
  title2.value = `Ruang: ${roomData.name} - ${buildingName}`;
  title2.font = { name: "Arial", size: 12, bold: true };
  title2.alignment = centerAlign;

  sheet.addRow([]); // Blank row A3

  // Table Headers
  const headerRow = sheet.addRow(["No", "Tanggal", "Uraian", "Keterangan", "Penerimaan (Debet)", "Pengeluaran (Kredit)", "Saldo"]);

  sheet.getColumn(1).width = 5;  // No
  sheet.getColumn(2).width = 15; // Tanggal
  sheet.getColumn(3).width = 40; // Uraian
  sheet.getColumn(4).width = 25; // Keterangan
  sheet.getColumn(5).width = 20; // Debet
  sheet.getColumn(6).width = 20; // Kredit
  sheet.getColumn(7).width = 20; // Saldo

  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = centerAlign;
    cell.border = borderAll;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E0E0" } };
  });

  let totalDebet = 0;
  let totalKredit = 0;
  let runningBalance = 0;

  // Add Data Rows
  transactions.forEach((tx, index) => {
    runningBalance += tx.debit - tx.credit;
    totalDebet += tx.debit;
    totalKredit += tx.credit;

    const row = sheet.addRow([
      index + 1,
      tx.transactionDate,
      tx.description,
      tx.notes || "-",
      tx.debit > 0 ? tx.debit : "-",
      tx.credit > 0 ? tx.credit : "-",
      runningBalance
    ]);

    row.getCell(5).numFmt = '#,##0';
    row.getCell(6).numFmt = '#,##0';
    row.getCell(7).numFmt = '#,##0';

    row.eachCell((cell, colNumber) => {
      cell.border = borderAll;
      if (colNumber === 1 || colNumber === 2) cell.alignment = centerAlign;
    });
  });

  // Footer / Rekap Row
  const footerRow = sheet.addRow(["", "", "JUMLAH", "", totalDebet, totalKredit, runningBalance]);
  footerRow.getCell(3).font = { bold: true };
  footerRow.getCell(3).alignment = { horizontal: "right" };
  footerRow.getCell(5).font = { bold: true };
  footerRow.getCell(6).font = { bold: true };
  footerRow.getCell(7).font = { bold: true };

  footerRow.getCell(5).numFmt = '#,##0';
  footerRow.getCell(6).numFmt = '#,##0';
  footerRow.getCell(7).numFmt = '#,##0';

  footerRow.eachCell((cell, colNumber) => {
    if (colNumber >= 3) {
      cell.border = borderAll;
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEEEEEE" } };
    }
  });

  sheet.addRow([]); // Blank row
  sheet.addRow([]); // Blank row

  // Tanda Tangan Section
  const dateStr = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  const signRow1 = sheet.addRow(["", "", "", "", "", `Mengetahui,\nKepala Sekolah`, `Bendahara Sekolah`]);
  signRow1.height = 30;
  signRow1.getCell(6).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };
  signRow1.getCell(7).alignment = { horizontal: "center", vertical: "bottom", wrapText: true };

  sheet.addRow([]);
  sheet.addRow([]);
  sheet.addRow([]);

  const signRow2 = sheet.addRow(["", "", "", "", "", "( _______________________ )", "( _______________________ )"]);
  signRow2.getCell(6).alignment = { horizontal: "center" };
  signRow2.getCell(7).alignment = { horizontal: "center" };


  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="BukuKas_${roomData.name.replace(/\s+/g, '_')}.xlsx"`,
    },
  });
}
