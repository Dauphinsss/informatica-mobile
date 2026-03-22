import { NativeModules, Platform } from "react-native";

type IconKey = "default" | "elecciones";

type LauncherIconNativeModule = {
  setLauncherIcon: (iconKey: IconKey) => Promise<string>;
};

let lastAppliedIcon: IconKey | null = null;
let warnedMissingModule = false;

const normalizeIconKey = (value: unknown): IconKey =>
  value === "elecciones" ? "elecciones" : "default";

export const applyLauncherIcon = async (iconKey: unknown): Promise<void> => {
  if (Platform.OS !== "android") return;
  const launcherModule = NativeModules.LauncherIconModule as
    | LauncherIconNativeModule
    | undefined;

  if (!launcherModule?.setLauncherIcon) {
    if (!warnedMissingModule) {
      warnedMissingModule = true;
      console.warn(
        "[LauncherIcon] Modulo nativo no disponible. Requiere rebuild Android (dev client/apk).",
      );
    }
    return;
  }

  const normalized = normalizeIconKey(iconKey);
  if (lastAppliedIcon === normalized) return;

  await launcherModule.setLauncherIcon(normalized);
  lastAppliedIcon = normalized;
};
