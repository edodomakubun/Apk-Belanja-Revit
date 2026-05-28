"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";

export default function ExportPage() {
  const { user } = useAuth();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedRoom, setSelectedRoom] = useState<string>("");

  useEffect(() => {
    fetch("/api/master/buildings").then(res => res.json()).then(setBuildings);
  }, []);

  useEffect(() => {
    if (selectedBuilding) {
      fetch(`/api/master/rooms?buildingId=${selectedBuilding}`)
        .then(res => res.json())
        .then(setRooms);
      setSelectedRoom("");
    }
  }, [selectedBuilding]);

  const handleExport = () => {
    if (!selectedRoom) return;
    // Trigger download by changing location to the API route
    window.location.href = `/api/export?roomId=${selectedRoom}`;
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Export Buku Kas</h1>
      <p className="text-muted-foreground">Unduh laporan buku kas dalam format Excel yang sudah siap cetak beserta rekap otomatis dan tempat tanda tangan.</p>

      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <div>
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

        <div>
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

        <div className="flex gap-4">
          <Button onClick={() => window.location.href = `/api/export?roomId=${selectedRoom}`} disabled={!selectedRoom} className="flex-1" variant="outline">
            <Download className="w-4 h-4 mr-2" /> Excel (.xlsx)
          </Button>
          <Button onClick={() => window.location.href = `/api/export/pdf?roomId=${selectedRoom}`} disabled={!selectedRoom} className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            <Download className="w-4 h-4 mr-2" /> PDF (.pdf)
          </Button>
          <Button onClick={() => window.location.href = `/api/export/word?roomId=${selectedRoom}`} disabled={!selectedRoom} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" /> Word (.docx)
          </Button>
        </div>
      </div>
    </div>
  );
}
