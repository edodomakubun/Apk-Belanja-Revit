"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  id: string;
  username: string;
  role: "ADMIN" | "BENDAHARA";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          if (pathname === "/login") {
            router.replace("/");
          }
        } else {
          setUser(null);
          if (pathname !== "/login") {
            router.replace("/login");
          }
        }
      } catch (error) {
        console.error("Failed to check auth", error);
        setUser(null);
        if (pathname !== "/login") {
          router.replace("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [pathname, router]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/login");
  };

  return { user, loading, logout };
}
