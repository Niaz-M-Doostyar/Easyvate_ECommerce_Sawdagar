"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
export default function RootPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }
    if (user.role === "admin") router.replace("/admin");
    else if (user.role === "supplier") router.replace("/supplier");
    else router.replace("/login");
  }, [user, loading, router]);
  return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
}
