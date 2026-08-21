"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // Fetch role
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setRole(userData.role || "user");
          } else {
            setRole("user");
          }
        } catch (error) {
          console.warn("Failed to fetch user role, defaulting to 'user'. Did you deploy firestore.rules?", error);
          setRole("user");
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in — block dashboard routes but ALLOW login pages
        if (pathname.startsWith("/admin/dashboard")) {
          router.push("/admin/login");
        } else if (pathname.startsWith("/delivery/dashboard")) {
          router.push("/delivery/login");
        } else if (pathname.startsWith("/checkout")) {
          router.push("/login");
        }
      } else {
        // Logged in — check roles
        if (pathname.startsWith("/admin")) {
          if (pathname === "/admin/login") {
            // If already admin, go to dashboard directly
            if (role === "admin") router.push("/admin/dashboard");
            // If non-admin user somehow hits /admin/login, let them see the page
            // (they'll get an "invalid credentials" error when they try to log in)
          } else if (pathname.startsWith("/admin/dashboard")) {
            // Dashboard requires admin role
            if (role !== null && role !== "admin") {
              router.push("/");
            }
          }
        } else if (pathname.startsWith("/delivery")) {
          if (pathname === "/delivery/login") {
            // If already delivery partner, go to dashboard
            if (role === "delivery") router.push("/delivery/dashboard");
          } else if (pathname.startsWith("/delivery/dashboard")) {
            // Dashboard requires delivery role
            if (role !== null && role !== "delivery") {
              router.push("/");
            }
          }
        }
      }
    }
  }, [user, role, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // Block rendering of DASHBOARD pages if unauthorized — login pages always render
  if (pathname.startsWith("/admin/dashboard") && role !== "admin") return null;
  if (pathname.startsWith("/delivery/dashboard") && role !== "delivery") return null;
  // Block checkout for guests
  if (pathname.startsWith("/checkout") && !user) return null;

  return <>{children}</>;
}
