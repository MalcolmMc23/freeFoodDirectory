import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "San Francisco Map",
  description: "A simple full-screen Google Map centered on San Francisco."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
