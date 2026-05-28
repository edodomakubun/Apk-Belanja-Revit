"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

interface Transaction {
  id: string;
  transactionDate: string;
  description: string;
  debit: number;
  credit: number;
  balanceBefore: number;
  balanceAfter: number;
  notes: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function KasPage() {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [date, setDate] = useState("");
  const [desc, setDesc] = useState("");
  const [catId, setCatId] = useState("");
  const [type, setType] = useState<"DEBIT" | "KREDIT">("KREDIT");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetch("/api/master/buildings").then(res => res.json()).then(setBuildings);
    fetch("/api/master/categories").then(res => res.json()).then(setCategories);
  }, []);

  const fetchTransactions = async (roomId: string) => {
    const res = await fetch(`/api/transactions?roomId=${roomId}`);
    if (res.ok) setTransactions(await res.json());
  };

  useEffect(() => {
    if (selectedBuilding) {
      fetch(`/api/master/rooms?buildingId=${selectedBuilding}`)
        .then(res => res.json())
        .then(setRooms);
      setSelectedRoom("");
      setTransactions([]);
    }
  }, [selectedBuilding]);

  useEffect(() => {
    if (selectedRoom) {
      fetchTransactions(selectedRoom);
    } else {
      setTransactions([]);
    }
  }, [selectedRoom]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !date || !desc || !amount) return;

    const numAmount = Number(amount);
    const body = {
      roomId: selectedRoom,
      categoryId: catId || null,
      transactionDate: date,
      description: desc,
      debit: type === "DEBIT" ? numAmount : 0,
      credit: type === "KREDIT" ? numAmount : 0,
      notes,
    };

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setIsDialogOpen(false);
      fetchTransactions(selectedRoom);
      // reset form
      setDesc("");
      setAmount("");
      setNotes("");
    }
  };

  const formatRp = (n: number) => new Intl.NumberFormat("id-ID").format(n);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Buku Kas Ruangan</h1>
      </div>

      <div className="flex gap-4 bg-white p-4 rounded-lg shadow-sm border">
        <div className="w-1/3">
          <Label className="mb-2 block">Pilih Bangunan</Label>
          <Select value={selectedBuilding} onValueChange={(v) => setSelectedBuilding(v || "")}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Bangunan..." />
            </SelectTrigger>
            <SelectContent>
              {buildings.map(b => (
                <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-1/3">
          <Label className="mb-2 block">Pilih Ruangan</Label>
          <Select value={selectedRoom} onValueChange={(v) => setSelectedRoom(v || "")} disabled={!selectedBuilding}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih Ruangan..." />
            </SelectTrigger>
            <SelectContent>
              {rooms.map(r => (
                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedRoom && (
        <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
          <div className="flex justify-end">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger render={<Button><Plus className="w-4 h-4 mr-2" /> Tambah Transaksi</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Input Transaksi Baru</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddTransaction} className="space-y-4 mt-4">
                  <div>
                    <Label>Tanggal</Label>
                    <Input type="date" value={date} onChange={e => setDate(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Uraian</Label>
                    <Input value={desc} onChange={e => setDesc(e.target.value)} required />
                  </div>
                  <div>
                    <Label>Pos Belanja</Label>
                    <Select value={catId} onValueChange={(v) => setCatId(v || "")}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Pos (Opsional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <Label>Jenis Transaksi</Label>
                      <Select value={type} onValueChange={(v) => setType(v as "DEBIT" | "KREDIT")}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEBIT">Pemasukan (Debet)</SelectItem>
                          <SelectItem value="KREDIT">Pengeluaran (Kredit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-1/2">
                      <Label>Nominal</Label>
                      <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="1" />
                    </div>
                  </div>
                  <div>
                    <Label>Keterangan</Label>
                    <Input value={notes} onChange={e => setNotes(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full">Simpan</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Uraian</TableHead>
                <TableHead className="text-right">Debet</TableHead>
                <TableHead className="text-right">Kredit</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Status</TableHead>
                {user?.role === "ADMIN" && <TableHead>Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.transactionDate}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right text-emerald-600">{tx.debit > 0 ? formatRp(tx.debit) : "-"}</TableCell>
                  <TableCell className="text-right text-red-600">{tx.credit > 0 ? formatRp(tx.credit) : "-"}</TableCell>
                  <TableCell className="text-right font-medium">{formatRp(tx.balanceAfter)}</TableCell>
                  <TableCell>{tx.notes}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${tx.status === 'APPROVED' ? 'bg-green-100 text-green-800' : tx.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {tx.status}
                    </span>
                  </TableCell>
                  {user?.role === "ADMIN" && (
                    <TableCell>
                      {tx.status === "PENDING" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={async () => {
                            await fetch('/api/transactions/approve', { method: 'POST', body: JSON.stringify({ id: tx.id, status: 'APPROVED' }) });
                            fetchTransactions(selectedRoom);
                          }}>Setujui</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={async () => {
                            await fetch('/api/transactions/approve', { method: 'POST', body: JSON.stringify({ id: tx.id, status: 'REJECTED' }) });
                            fetchTransactions(selectedRoom);
                          }}>Tolak</Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">Belum ada transaksi di ruangan ini.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
