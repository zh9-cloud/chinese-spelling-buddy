// Tiny platform helpers. Safe to import anywhere (web included): the Capacitor
// web shim returns "web" / false when the app is not running inside a native
// shell, so these never throw in the PWA.

import { Capacitor } from "@capacitor/core";

/** True only when running inside the native iOS/Android Capacitor shell. */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/** "ios" | "android" | "web". */
export function getPlatform(): string {
  try {
    return Capacitor.getPlatform();
  } catch {
    return "web";
  }
}
