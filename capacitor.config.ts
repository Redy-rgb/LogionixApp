import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "com.logionix.app",
  appName: "Logionix",
  webDir: "dist",
  plugins: {
    // Modern edge-to-edge handling for Android 15+ / 16, where the system
    // enforces edge-to-edge and the legacy StatusBar overlay options no longer work.
    SystemBars: {
      insetsHandling: "css",
      initialViewportFitValueHint: "cover",
      style: "DEFAULT",
    },
    // Keep the composer visible above the soft keyboard on edge-to-edge Android.
    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },
  },
}

export default config
