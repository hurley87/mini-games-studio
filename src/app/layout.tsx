import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BALLISTIC - Turret Defense",
  description: "A retro arcade turret defense game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
