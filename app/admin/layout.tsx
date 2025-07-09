import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // TODO: Add proper admin role check
  // For now, we'll allow all authenticated users
  // In production, check if user has admin role in database

  return (
    <div className="flex h-screen bg-teams-bg">
      <AdminSidebar />
      <main className="flex-1 overflow-y-auto bg-teams-bg">
        <div className="p-teams-xl">
          {children}
        </div>
      </main>
    </div>
  );
}