import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminLayout } from "@/components/admin/admin-layout";
import { isAdmin } from "@/lib/auth/roles";

export default async function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  // Check if user has admin role
  const hasAdminRole = await isAdmin();
  
  if (!hasAdminRole) {
    redirect("/dashboard");
  }

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}