import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { SoundProvider } from "@/contexts/SoundContext";

export const metadata: Metadata = {
  title: "Lottery Number Generator",
  description: "Generate random lottery numbers and track your history with AI-powered predictions",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SoundProvider>
          <Sidebar />
          {children}
        </SoundProvider>
      </body>
    </html>
  );
}

