import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "../context/AppContext";

export const metadata: Metadata = {
  title: "Potentat Pro - Enterprise POS & Inventory",
  description: "Next-generation sales and inventory management system for phone and accessory retail",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#060919",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#060919] text-slate-100">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
