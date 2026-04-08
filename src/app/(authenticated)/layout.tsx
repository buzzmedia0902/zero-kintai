import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthenticatedLayout } from "./authenticated-layout";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <AuthenticatedLayout
      userName={session.user.name}
      userRole={session.user.role}
    >
      {children}
    </AuthenticatedLayout>
  );
}
