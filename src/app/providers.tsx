// src/app/providers.tsx
"use client";

import { Toaster } from "@/components/ui/sonner"; // shadcn sonner toasts
import { ThemeProvider } from "next-themes"; // optional, for dark mode
// import { AuthProvider } from '@/components/providers/auth-provider' // if you have one
import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react";
import { Footer } from "@/components/footer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TooltipProvider>
        <div>
          {children}
          <Toaster position="bottom-right" richColors />
          <Footer />
        </div>
      </TooltipProvider>
    </ThemeProvider>
  );
}
