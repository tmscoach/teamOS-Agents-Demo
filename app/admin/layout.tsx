import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";

export default async function AdminLayoutWrapper({
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
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}