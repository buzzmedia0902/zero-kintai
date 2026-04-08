"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavBarProps {
  userName: string;
  userRole: string;
}

export function NavBar({ userName, userRole }: NavBarProps) {
  const pathname = usePathname();
  const isAdmin = userRole === "ADMIN";

  const employeeLinks = [
    { href: "/", label: "打刻" },
    { href: "/attendance", label: "勤務記録" },
    { href: "/leave", label: "休暇管理" },
  ];

  const adminLinks = [
    { href: "/admin", label: "ダッシュボード" },
    { href: "/admin/employees", label: "従業員管理" },
    { href: "/admin/attendance", label: "勤怠管理" },
    { href: "/admin/leave", label: "休暇承認" },
    { href: "/admin/reports", label: "レポート" },
  ];

  const links = isAdmin ? [...employeeLinks, ...adminLinks] : employeeLinks;

  return (
    <nav className="border-b bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-1 overflow-x-auto">
            <Link
              href="/"
              className="font-bold text-lg mr-4 shrink-0 text-primary"
            >
              勤怠管理
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {userName}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              ログアウト
            </Button>
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden flex gap-1 pb-2 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                pathname === link.href
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
