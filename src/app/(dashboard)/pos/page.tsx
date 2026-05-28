"use client";
export const runtime = "edge";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

export default function PosBelanjaPage() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const fetchCategories = async () => {
    const res = await fetch("/api/master/categories");
    if (res.ok) {
      setCategories(await res.json());
    }
  };

  useEffect(() => {
    if (user?.role === "ADMIN") {
      fetchCategories();
    }
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory) return;

    const res = await fetch("/api/master/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });

    if (res.ok) {
      setNewCategory("");
      fetchCategories();
    }
  };

  if (!user) return null;
  if (user.role !== "ADMIN") return <p>Akses ditolak.</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Master Pos Belanja</h1>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <form onSubmit={handleAdd} className="flex gap-4 mb-6">
          <Input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Nama Pos Belanja Baru"
            className="flex-1"
          />
          <Button type="submit">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Pos
          </Button>
        </form>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Nama Pos Belanja</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat, idx) => (
              <TableRow key={cat.id}>
                <TableCell>{idx + 1}</TableCell>
                <TableCell>{cat.name}</TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} className="text-center text-muted-foreground">Tidak ada data</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
