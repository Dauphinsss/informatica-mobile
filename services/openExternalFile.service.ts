import * as FileSystem from "expo-file-system/legacy";
import { Linking, Platform } from "react-native";
import ReactNativeBlobUtil from "react-native-blob-util";

const FILE_CACHE_DIR = `${FileSystem.cacheDirectory}files/`;

const ensureCacheDir = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(FILE_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(FILE_CACHE_DIR, {
      intermediates: true,
    });
  }
};

const sanitizeFileName = (name: string): string =>
  name.replace(/[^a-z0-9._-]/gi, "_");

const hashUrl = (url: string): number =>
  url.split("").reduce((acc, ch) => {
    acc = (acc << 5) - acc + ch.charCodeAt(0);
    return acc & acc;
  }, 0);

const getExtensionFromUrl = (url: string): string | null => {
  const clean = url.split("?")[0];
  const lastDot = clean.lastIndexOf(".");
  if (lastDot === -1) return null;
  const ext = clean.slice(lastDot + 1).toLowerCase();
  return ext.length > 0 && ext.length <= 6 ? ext : null;
};

const guessExtension = (url: string, tipoNombre: string): string => {
  return (
    getExtensionFromUrl(url) ||
    (() => {
      const t = (tipoNombre || "").toLowerCase();
      if (t.includes("pdf")) return "pdf";
      if (t.includes("word")) return "docx";
      if (t.includes("excel")) return "xlsx";
      if (t.includes("presentación") || t.includes("powerpoint")) return "pptx";
      if (t.includes("zip")) return "zip";
      if (t.includes("rar")) return "rar";
      if (t.includes("texto") || t.includes("txt")) return "txt";
      return "bin";
    })()
  );
};

const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    xls: "application/vnd.ms-excel",
    xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ppt: "application/vnd.ms-powerpoint",
    pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    txt: "text/plain",
    zip: "application/zip",
    rar: "application/x-rar-compressed",
  };

  return mimeTypes[extension.toLowerCase()] || "application/octet-stream";
};

export const openRemoteFileExternally = async (params: {
  url: string;
  titulo: string;
  tipoNombre: string;
  onProgress?: (progress01: number) => void;
}): Promise<void> => {
  await ensureCacheDir();

  const extension = guessExtension(params.url, params.tipoNombre);
  const fileNameBase = sanitizeFileName(params.titulo || "archivo");
  const fileName = `${fileNameBase}_${Math.abs(hashUrl(params.url))}.${extension}`;
  const path = `${FILE_CACHE_DIR}${fileName}`;

  const info = await FileSystem.getInfoAsync(path);
  const uri = info.exists
    ? path
    : await (async () => {
        const download = FileSystem.createDownloadResumable(
          params.url,
          path,
          {},
          (progress) => {
            if (params.onProgress && progress.totalBytesExpectedToWrite > 0) {
              params.onProgress(
                progress.totalBytesWritten / progress.totalBytesExpectedToWrite,
              );
            }
          },
        );

        const result = await download.downloadAsync();
        if (!result?.uri) throw new Error("Download failed");
        return path;
      })();

  const mimeType = getMimeType(extension);

  if (Platform.OS === "android") {
    const filePath = uri.replace("file://", "");
    await ReactNativeBlobUtil.android.actionViewIntent(filePath, mimeType);
    return;
  }

  await Linking.openURL(uri.startsWith("file://") ? uri : `file://${uri}`);
};
