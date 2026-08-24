// ─────────────────────────────────────────────────────────────────────────────
//  Native camera / photo picker (iOS + Android Capacitor shell).
//
//  In the native app the web <input type="file" capture> is a poor experience
//  and, on iOS, an app that only wraps a website risks rejection under App
//  Review Guideline 4.2 (Minimum Functionality). Using the real native camera
//  gives the app genuine native capability: full-resolution capture, the system
//  camera UI, and proper permission handling.
//
//  Both call sites (parent word-list import, student handwriting grading) work
//  with File objects, so these helpers return a File and the existing upload
//  logic is unchanged. On the web these are never called — the file input stays.
// ─────────────────────────────────────────────────────────────────────────────

import { isNativePlatform } from "@/lib/platform";

/** True when the native camera plugin can be used (iOS/Android shell only). */
export function hasNativeCamera(): boolean {
  return isNativePlatform();
}

/** Thrown-free result: a File, or null when the user cancelled. */
export type PhotoResult = { file: File } | { cancelled: true } | { error: string };

function base64ToFile(base64: string, format: string): File {
  const mime = format === "png" ? "image/png" : format === "webp" ? "image/webp" : "image/jpeg";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = mime.split("/")[1];
  return new File([bytes], `photo-${Date.now()}.${ext}`, { type: mime });
}

/** Lazily import so the plugin never loads (or breaks) in the web bundle. */
async function getCamera() {
  const mod = await import("@capacitor/camera");
  return mod;
}

/**
 * Open the native camera (source "camera") or the photo library ("photos").
 * Returns a File ready for the existing upload paths.
 */
export async function takeNativePhoto(from: "camera" | "photos" = "camera"): Promise<PhotoResult> {
  try {
    const { Camera, CameraResultType, CameraSource } = await getCamera();

    // Ask for the permission the chosen source needs, so the OS prompt appears
    // with our Info.plist / manifest explanation rather than failing silently.
    const perm = await Camera.checkPermissions();
    const needed = from === "camera" ? perm.camera : perm.photos;
    if (needed !== "granted") {
      const asked = await Camera.requestPermissions({
        permissions: from === "camera" ? ["camera"] : ["photos"],
      });
      const now = from === "camera" ? asked.camera : asked.photos;
      if (now !== "granted") {
        return { error: "没有相机/相册权限，请到系统设置里允许。Permission denied — enable it in Settings." };
      }
    }

    const photo = await Camera.getPhoto({
      quality: 88,
      allowEditing: false,
      correctOrientation: true,
      resultType: CameraResultType.Base64,
      source: from === "camera" ? CameraSource.Camera : CameraSource.Photos,
    });

    if (!photo.base64String) return { cancelled: true };
    return { file: base64ToFile(photo.base64String, photo.format ?? "jpeg") };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // The plugin throws on user cancel — treat that as a normal cancel, not an error.
    if (/cancel/i.test(msg)) return { cancelled: true };
    return { error: msg || "无法打开相机 Could not open the camera." };
  }
}
