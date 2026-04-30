import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boktion",
  description: "Full-Stack Notion Clone — Boktion",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>{children}</body>
    </html>
  );
}
