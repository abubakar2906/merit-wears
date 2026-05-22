import AdminSidebar from "@/components/layout/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-screen">
      <AdminSidebar />
      <main className="md:ml-64 min-h-screen px-margin-mobile md:px-margin-desktop py-stack-md">
        {children}
      </main>
    </div>
  );
}
