import { Sidebar } from "@/components/layout/sidebar";
export const runtime = "edge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <header className="h-16 bg-white border-b flex items-center px-8 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800">Sistem Buku Kas Revitalisasi Sekolah</h2>
        </header>
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
