"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wifi, Home, LogIn } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { UserMenu } from "./user-menu";
import { Button } from "@/components/ui/button";

// Helper to get page title from path
function getPageTitle(pathname: string) {
  if (pathname === "/") return "Home";
  if (pathname === "/employee") return "Dashboard";
  if (pathname === "/employee/stats") return "My Stats";
  if (pathname === "/attendance") return "Attendance";
  if (pathname === "/leave") return "Leave";
  if (pathname === "/advance") return "Advance Salary";
  if (pathname.startsWith("/admin")) return "Admin";
  return "Home";
}

export function EmployeeHeader() {
  const { user, loading } = useSession();
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  if (loading) return null;
  if (pathname.startsWith("/admin") || pathname.startsWith("/employee"))
    return null;

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4 md:px-6">
        {/* Logo + Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <Wifi className="h-8 w-8 text-orange-500" />
              <div className="absolute -right-1 -top-1 h-1.5 w-1.5 rounded-full bg-orange-500/60" />
            </div>
            <span className="hidden font-bold sm:inline-block text-lg">
              AB‑<span className="text-orange-500 text-lg">Network</span>
            </span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
              <Home className="h-3 w-3" />
              <span>/</span>
              <span className="font-medium text-foreground">{pageTitle}</span>
            </div>
          )}
        </div>

        {/* Right side: UserMenu or Sign In */}
        {user ? (
          <UserMenu user={user} />
        ) : (
          <Button asChild>
            <Link href="/login">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Link>
          </Button>
        )}
      </div>
    </header>
  );
}
