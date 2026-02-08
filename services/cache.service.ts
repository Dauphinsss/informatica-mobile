import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";

const CACHE_PREFIX = "@cache_";
const PDF_CACHE_DIR = `${FileSystem.cacheDirectory}pdfs/`;
const MAX_PDF_CACHE_MB = 100;

// ─── JSON Cache (publicaciones, materias, userData) ───

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Guarda datos en cache con timestamp
 */
export const setCache = async <T>(key: string, data: T): Promise<void> => {
  try {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };
    await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    console.warn("[Cache] Error guardando:", key, error);
  }
};

/**
 * Obtiene datos del cache. Devuelve null si no existe o si expiró.
 * @param maxAgeMs - edad máxima en ms (default: 24h)
 */
export const getCache = async <T>(
  key: string,
  maxAgeMs: number = 24 * 60 * 60 * 1000,
): Promise<T | null> => {
  try {
    const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const entry: CacheEntry<T> = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;

    if (age > maxAgeMs) return null;

    return entry.data;
  } catch (error) {
    console.warn("[Cache] Error leyendo:", key, error);
    return null;
  }
};

/**
 * Elimina una entrada del cache
 */
export const removeCache = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch (error) {
    console.warn("[Cache] Error eliminando:", key, error);
  }
};

/**
 * Limpia todo el cache de datos JSON
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const cacheKeys = allKeys.filter((k) => k.startsWith(CACHE_PREFIX));
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
  } catch (error) {
    console.warn("[Cache] Error limpiando cache:", error);
  }
};

// ─── PDF Cache (archivos descargados) ───

/**
 * Asegura que el directorio de cache de PDFs existe
 */
const ensurePdfCacheDir = async (): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(PDF_CACHE_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PDF_CACHE_DIR, {
      intermediates: true,
    });
  }
};

/**
 * Genera un nombre de archivo sanitizado para el cache
 */
const getPdfCachePath = (url: string, titulo: string): string => {
  const sanitized = titulo.replace(/[^a-z0-9._-]/gi, "_");
  // Usar hash simple de la URL para evitar colisiones
  const hash = url.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${PDF_CACHE_DIR}${sanitized}_${Math.abs(hash)}.pdf`;
};

/**
 * Verifica si un PDF ya está en cache
 */
export const getPdfFromCache = async (
  url: string,
  titulo: string,
): Promise<string | null> => {
  try {
    await ensurePdfCacheDir();
    const path = getPdfCachePath(url, titulo);
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) {
      return path;
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Descarga un PDF y lo guarda en cache persistente
 */
export const downloadAndCachePdf = async (
  url: string,
  titulo: string,
  onProgress?: (progress: number) => void,
): Promise<string> => {
  await ensurePdfCacheDir();
  const path = getPdfCachePath(url, titulo);

  const download = FileSystem.createDownloadResumable(
    url,
    path,
    {},
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesExpectedToWrite > 0) {
        onProgress(
          downloadProgress.totalBytesWritten /
            downloadProgress.totalBytesExpectedToWrite,
        );
      }
    },
  );

  const result = await download.downloadAsync();
  if (!result?.uri) throw new Error("Download failed");

  // Limpiar cache viejo si excede el límite
  cleanPdfCacheIfNeeded().catch(() => {});

  return path;
};

/**
 * Limpia PDFs viejos si el cache excede el límite
 */
const cleanPdfCacheIfNeeded = async (): Promise<void> => {
  try {
    await ensurePdfCacheDir();
    const files = await FileSystem.readDirectoryAsync(PDF_CACHE_DIR);

    const fileInfos = await Promise.all(
      files.map(async (name) => {
        const path = `${PDF_CACHE_DIR}${name}`;
        const info = await FileSystem.getInfoAsync(path);
        return {
          path,
          size: (info as any).size || 0,
          modTime: (info as any).modificationTime || 0,
        };
      }),
    );

    const totalSize = fileInfos.reduce((sum, f) => sum + f.size, 0);
    const maxBytes = MAX_PDF_CACHE_MB * 1024 * 1024;

    if (totalSize <= maxBytes) return;

    // Borrar los más viejos primero
    fileInfos.sort((a, b) => a.modTime - b.modTime);

    let currentSize = totalSize;
    for (const file of fileInfos) {
      if (currentSize <= maxBytes * 0.7) break; // Limpiar hasta el 70%
      await FileSystem.deleteAsync(file.path, { idempotent: true });
      currentSize -= file.size;
    }
  } catch (error) {
    console.warn("[Cache] Error limpiando PDFs:", error);
  }
};

// ─── Cache Keys ───

export const CACHE_KEYS = {
  subjects: "all_subjects",
  enrolledIds: (uid: string) => `enrolled_${uid}`,
  userData: (uid: string) => `user_data_${uid}`,
  subjectPublications: (materiaId: string) => `pubs_${materiaId}`,
  publicationDetail: (pubId: string) => `pub_detail_${pubId}`,
  publicationFiles: (pubId: string) => `pub_files_${pubId}`,
  subjectMaterials: "subject_materials_count",
};
