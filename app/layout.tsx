import type { Metadata, Viewport } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { StoreProvider } from "@/context/StoreContext";

// Nunito — rounded, friendly, great for children, works well alongside CJK system fonts
const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chinese Spelling Buddy · 华文听写助手",
  description:
    "Practice Chinese spelling for Singapore primary school students.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "听写助手",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f5880a",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-SG" className={nunito.variable}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* 霞鹜文楷 (LXGW WenKai) — web 楷体 for character display + calligraphic
            headings. Self-hosted CSS sets font-display:optional so first load
            never flashes (uses the system 楷体 fallback, then caches the web
            font for subsequent visits). Glyph woff2 are chunked by unicode-range
            and still served from the CDN, so only used glyphs download. */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/fonts/lxgw-wenkai.css" />
        {/* Tabler outline icons (webfont) — used via <i className="ti ti-name" /> */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.44.0/dist/tabler-icons.min.css" />
      </head>
      <body className="antialiased font-sans">
        <AuthProvider>
          <StoreProvider>
            {children}
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
