import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#080808",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "GymPace — Track your runs",
  description:
    "A plataforma definitiva para atletas híbridos. Corrida, academia, analytics e competições.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GymPace",
    startupImage: [
      {
        url: "/icon-512x512.png",
        media:
          "(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
    "msapplication-TileColor": "#080808",
    "msapplication-tap-highlight": "no",
  },
};

import OneSignalProvider from "@/components/providers/onesignal-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased"
      style={
        {
          "--font-sans": "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          "--font-display": "\"Space Grotesk\", Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          "--font-geist-mono": "\"Geist Mono\", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", monospace",
        } as Record<string, string>
      }
    >
      <body className="flex min-h-full flex-col">
        {children}
        <OneSignalProvider />
      </body>
    </html>
  );
}
