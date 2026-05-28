"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  createdAt: string;
  username: string;
}

export default function AuditPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetch("/api/audit")
        .then((res) => res.json())
        .then(setLogs);
    }
  }, [user]);

  if (!user) return null;
  if (user.role !== "ADMIN") return <p>Akses ditolak. Halaman ini khusus Admin.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Audit Log</h1>
      <p className="text-muted-foreground">Riwayat aktivitas penting dan perubahan sistem.</p>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Waktu</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead>Aksi</TableHead>
              <TableHead>Entitas</TableHead>
              <TableHead>Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString("id-ID")}</TableCell>
                <TableCell className="font-medium">{log.username}</TableCell>
                <TableCell>
                  <Badge variant={log.action.includes("REJECTED") ? "destructive" : log.action.includes("APPROVED") ? "default" : "secondary"}>
                    {log.action}
                  </Badge>
                </TableCell>
                <TableCell>{log.entity}</TableCell>
                <TableCell className="text-sm font-mono truncate max-w-xs">{log.details}</TableCell>
              </TableRow>
            ))}
            {logs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">Belum ada aktivitas terekam.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
