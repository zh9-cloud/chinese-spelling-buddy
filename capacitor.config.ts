import type { CapacitorConfig } from "@capacitor/cli";

// ─────────────────────────────────────────────────────────────────────────────
//  Capacitor config — native iOS/Android shell around the live PWA.
//
//  Strategy (per the app-store plan): the native app is a thin shell that loads
//  the already-deployed site over `server.url`, so Next.js API routes keep
//  running on Vercel and we don't maintain a separate static export. The native
//  value-add (camera OCR, push, in-app purchase) comes from Capacitor plugins.
//
//  `webDir` still has to exist for the CLI; it's only used as a fallback bundle.
//  Set CAP_SERVER_URL to override the loaded site (e.g. a staging URL).
// ─────────────────────────────────────────────────────────────────────────────

const config: CapacitorConfig = {
  appId: "com.sgspellingbuddy.app",
  appName: "小华听写",
  webDir: "capacitor-www",
  server: {
    url: process.env.CAP_SERVER_URL || "https://www.sgspellingbuddy.com",
    cleartext: false,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
