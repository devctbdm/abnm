// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { EmployeeHeader } from "@/components/employee-header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AB-Network EMS",
  description: "Employee Management System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <EmployeeHeader />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
