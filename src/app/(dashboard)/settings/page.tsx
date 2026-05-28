"use client";
export const runtime = "edge";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { DatabaseBackup, Info } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold">Pengaturan Sistem</h1>
      <p className="text-muted-foreground">Konfigurasi lanjutan dan pemeliharaan aplikasi.</p>

      <div className="bg-white p-6 rounded-lg shadow-sm border space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Backup Database</h2>
          <p className="text-sm text-gray-600 mb-4">
            Unduh salinan penuh dari database aplikasi saat ini. Ini berguna untuk mencadangkan data secara manual (Phase 3).
          </p>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-4 flex gap-3 text-sm">
            <Info className="w-5 h-5 shrink-0" />
            <p>
              Pada versi Production di Cloudflare D1, backup otomatis akan dijalankan harian melalui *Cloudflare Dashboard*. Tombol di bawah mengunduh database lokal.
            </p>
          </div>

          <Button onClick={() => window.location.href = "/api/backup"}>
            <DatabaseBackup className="w-4 h-4 mr-2" /> Download Backup (.db)
          </Button>
        </div>
      </div>
    </div>
  );
}
