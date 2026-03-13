"use client";
import "./globals.css";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const swrConfig = {
  dedupingInterval: 10000,
  revalidateOnFocus: false,
  revalidateIfStale: true,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <title>Sawdagar Admin</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-[#F5F7FA]">
        <SWRConfig value={swrConfig}>
          <ToastProvider>
            <LanguageProvider>
              <AuthProvider>{children}</AuthProvider>
            </LanguageProvider>
          </ToastProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
