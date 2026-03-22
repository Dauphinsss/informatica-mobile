import { NativeModules, Platform } from "react-native";

type IconKey = "default" | "elecciones";

type LauncherIconNativeModule = {
  setLauncherIcon: (iconKey: IconKey) => Promise<string>;
};

const launcherModule = NativeModules.LauncherIconModule as
  | LauncherIconNativeModule
  | undefined;

let lastAppliedIcon: IconKey | null = null;

const normalizeIconKey = (value: unknown): IconKey =>
  value === "elecciones" ? "elecciones" : "default";

export const applyLauncherIcon = async (iconKey: unknown): Promise<void> => {
  if (Platform.OS !== "android") return;
  if (!launcherModule?.setLauncherIcon) return;

  const normalized = normalizeIconKey(iconKey);
  if (lastAppliedIcon === normalized) return;

  await launcherModule.setLauncherIcon(normalized);
  lastAppliedIcon = normalized;
};
