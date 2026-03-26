import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>{children}</main>
      <Toaster />
    </div>
  );
}
