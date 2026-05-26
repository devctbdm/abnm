"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface User {
  userId: string;
  name: string;
  email: string;
  role: "OWNER" | "ADMIN" | "EMPLOYEE";
}

export function useSession() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pathname]);

  return { user, loading };
}
