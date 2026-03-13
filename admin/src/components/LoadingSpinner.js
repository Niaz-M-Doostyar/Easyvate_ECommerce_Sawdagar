"use client";
export default function LoadingSpinner({ size = "md" }) {
  const s = size === "sm" ? "w-5 h-5" : size === "lg" ? "w-12 h-12" : "w-8 h-8";
  return <div className={`${s} border-3 border-gray-200 border-t-primary rounded-full animate-spin`} />;
}
