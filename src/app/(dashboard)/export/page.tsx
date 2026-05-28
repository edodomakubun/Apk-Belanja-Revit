"use client";

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

        <Button onClick={handleExport} disabled={!selectedRoom} className="w-full">
          <Download className="w-4 h-4 mr-2" /> Download Excel
        </Button>
      </div>
    </div>
  );
}
