"use client";

import { Sidebar } from "@/components/sidebar";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  userName: string;
  userRole: string;
}

export function AuthenticatedLayout({
  children,
  userName,
  userRole,
}: AuthenticatedLayoutProps) {
  return (
    <div className="gradient-bg-subtle relative overflow-hidden">
      {/* Background orbs */}
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />

      <div className="relative z-10 flex min-h-screen">
        <Sidebar userName={userName} userRole={userRole} />
        <main className="flex-1 p-4 lg:p-8 pt-18 lg:pt-8 overflow-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
