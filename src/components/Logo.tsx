import { Wifi } from "lucide-react";
import Link from "next/link";

interface LogoProps {
  variant?: "default" | "small" | "large";
  showTagline?: boolean;
  className?: string;
}

export function Logo({
  variant = "default",
  showTagline = false,
  className = "",
}: LogoProps) {
  const sizes = {
    small: { text: "text-lg", icon: "h-4 w-4", tagline: "text-xs" },
    default: { text: "text-xl", icon: "h-5 w-5", tagline: "text-sm" },
    large: { text: "text-2xl", icon: "h-6 w-6", tagline: "text-base" },
  };

  const size = sizes[variant];

  return (
    <Link href="/" className={`flex items-center gap-2 group ${className}`}>
      <div className="flex flex-col">
        <span className={`font-bold tracking-tight ${size.text}`}>
          AB‑<span className="text-primary">Network</span>
        </span>
        {showTagline && (
          <span className={`text-muted-foreground ${size.tagline}`}>
            Employee Management System
          </span>
        )}
      </div>
    </Link>
  );
}
