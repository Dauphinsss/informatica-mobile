import { ArchivoPublicacion } from '@/scripts/types/Publication.type';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { enviarNotificacionLocal } from './pushNotifications';

const FOLDER_MAPPING: Record<string, string> = {
  pdf: 'PDF',
  imagen: 'Imágenes',
  video: 'Videos',
  audio: 'Audio',
  word: 'Documentos',
  excel: 'Documentos',
  powerpoint: 'Presentaciones',
  texto: 'Documentos',
  zip: 'Comprimidos',
  rar: 'Comprimidos',
  enlace: 'Enlaces',
};

export const getFolderForType = (tipoNombre: string): string => {
  const tipo = tipoNombre.toLowerCase();
  
  for (const [key, folder] of Object.entries(FOLDER_MAPPING)) {
    if (tipo.includes(key)) {
      return folder;
    }
  }
  
  return 'Otros';
};

const requestStoragePermissions = async (): Promise<boolean> => true;

const sanitizeFileName = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  return nameWithoutExt.replace(/[^a-z0-9._-]/gi, '_');
};

const getTipoArchivo = (tipoNombre: string): 'imagen' | 'video' | 'audio' | 'documento' => {
  const tipo = tipoNombre.toLowerCase();
  
  if (tipo.includes('imagen') || tipo.includes('image')) return 'imagen';
  if (tipo.includes('video')) return 'video';
  if (tipo.includes('audio')) return 'audio';
  
  return 'documento';
};

const getDocumentSubfolder = (extension: string): string => {
  const ext = extension.toLowerCase();
  
  if (ext === 'pdf') return 'PDFs';
  
  if (ext === 'doc' || ext === 'docx') return 'Word';
  
  if (ext === 'xls' || ext === 'xlsx') return 'Excel';
  
  if (ext === 'ppt' || ext === 'pptx') return 'PowerPoint';
  
  if (ext === 'txt') return 'Textos';
  
  if (ext === 'zip' || ext === 'rar') return 'Comprimidos';
  
  return 'Otros';
};

const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    txt: 'text/plain',
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    mp4: 'video/mp4',
    mp3: 'audio/mpeg',
  };
  
  return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
};

const getFileExtension = (url: string, tipoNombre: string): string => {
  const urlParts = url.split('?')[0].split('.');
  if (urlParts.length > 1) {
    const ext = urlParts[urlParts.length - 1].toLowerCase();
    if (ext.length <= 4) {
      return ext;
    }
  }
  
  const tipo = tipoNombre.toLowerCase();
  if (tipo.includes('pdf')) return 'pdf';
  if (tipo.includes('word')) return 'docx';
  if (tipo.includes('excel')) return 'xlsx';
  if (tipo.includes('powerpoint')) return 'pptx';
  if (tipo.includes('imagen') || tipo.includes('image')) return 'jpg';
  if (tipo.includes('video')) return 'mp4';
  if (tipo.includes('audio')) return 'mp3';
  if (tipo.includes('zip')) return 'zip';
  if (tipo.includes('rar')) return 'rar';
  if (tipo.includes('texto')) return 'txt';
  
  return 'bin';
};

interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}

interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  requiresShare?: boolean;
  shareUri?: string;
}

export const compartirArchivo = async (fileUri: string): Promise<void> => {
  try {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error('Sharing no disponible en este dispositivo');
      return;
    }
    await Sharing.shareAsync(fileUri, {
      dialogTitle: 'Guardar documento',
      mimeType: 'application/*',
    });
  } catch (error) {
    console.error('Error al compartir archivo:', error);
  }
};

export const descargarArchivo = async (
  archivo: ArchivoPublicacion,
  onProgress?: (progress: DownloadProgress) => void,
  silentNotification: boolean = false
): Promise<DownloadResult> => {
  try {    
    const hasPermission = await requestStoragePermissions();
    if (!hasPermission) {
      return {
        success: false,
        error: 'No se pudo obtener permisos de almacenamiento.',
      };
    }

    const extension = getFileExtension(archivo.webUrl, archivo.tipoNombre);
    const sanitizedName = sanitizeFileName(archivo.titulo);
    const fileName = `${sanitizedName}.${extension}`;
    const mimeType = getMimeType(extension);
    const tipoArchivo = getTipoArchivo(archivo.tipoNombre);
    
    const tempPath = `${FileSystem.cacheDirectory}${fileName}`;
    
    const downloadResumable = FileSystem.createDownloadResumable(
      archivo.webUrl,
      tempPath,
      {},
      (downloadProgress: any) => {
        const progress = {
          totalBytesWritten: downloadProgress.totalBytesWritten,
          totalBytesExpectedToWrite: downloadProgress.totalBytesExpectedToWrite,
          progress: downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite,
        };
        onProgress?.(progress);
      }
    );
    
    const downloadResult = await downloadResumable.downloadAsync();
    
    if (!downloadResult) {
      return { success: false, error: 'No se pudo completar la descarga' };
    }
    
    try {
      let mediaType: 'Image' | 'Video' | 'Audio' | 'Download';
      let parentFolder: string;
      let ubicacionFinal: string;
      
      if (tipoArchivo === 'imagen') {
        mediaType = 'Image';
        parentFolder = 'Informatica Imagenes';
        ubicacionFinal = 'Pictures/Informatica Imagenes';
      } else if (tipoArchivo === 'video') {
        mediaType = 'Video';
        parentFolder = 'Informatica Videos';
        ubicacionFinal = 'Movies/Informatica Videos';
      } else if (tipoArchivo === 'audio') {
        mediaType = 'Audio';
        parentFolder = 'Informatica';
        ubicacionFinal = 'Music/Informatica';
      } else {
        mediaType = 'Download';
        const subfolder = getDocumentSubfolder(extension);
        parentFolder = `Informatica/${subfolder}`;
        ubicacionFinal = `Download/Informatica/${subfolder}`;
      }
      
      const tempFilePath = downloadResult.uri.replace('file://', '');
      const contentUri = await ReactNativeBlobUtil.MediaCollection.copyToMediaStore(
        {
          name: fileName,
          parentFolder: parentFolder,
          mimeType: mimeType,
        },
        mediaType,
        tempFilePath
      );
      
      try {
        await FileSystem.deleteAsync(tempPath, { idempotent: true });
      } catch (cleanupError) {
        console.warn('No se pudo eliminar temporal:', cleanupError);
      }
      
      if (!silentNotification) {
        try {
          await enviarNotificacionLocal(
            'Descarga Completada',
            `El archivo "${archivo.titulo}" se descargó correctamente`,
            { tipo: 'descarga', archivo: fileName, ubicacion: ubicacionFinal }
          );
        } catch (notifError) {
          console.warn('No se pudo enviar notificación:', notifError);
        }
      }
      
      return {
        success: true,
        filePath: `${ubicacionFinal}/${fileName}`,
      };
      
    } catch (mediaStoreError: any) {
      console.error('Error al copiar a MediaStore:', mediaStoreError);
      
      return {
        success: true,
        filePath: fileName,
        requiresShare: true,
        shareUri: downloadResult.uri,
      };
    }
    
  } catch (error) {
    console.error('Error al descargar:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
    };
  }
};

export const descargarMultiplesArchivos = async (
  archivos: ArchivoPublicacion[],
  nombrePublicacion: string,
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{
  success: boolean;
  downloadedCount: number;
  failedCount: number;
  errors: string[];
  pendingShare?: Array<{ fileName: string; shareUri: string }>;
}> => {  
  let downloadedCount = 0;
  let failedCount = 0;
  const errors: string[] = [];
  const pendingShare: Array<{ fileName: string; shareUri: string }> = [];

  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    onProgress?.(i + 1, archivos.length, archivo.titulo);

    const result = await descargarArchivo(archivo, undefined, true);

    if (result.success) {
      downloadedCount++;
      if (result.requiresShare && result.shareUri) {
        pendingShare.push({
          fileName: archivo.titulo,
          shareUri: result.shareUri,
        });
      }
    } else {
      failedCount++;
      errors.push(`${archivo.titulo}: ${result.error}`);
    }
  }

  if (failedCount > 0) {
    console.warn(`${failedCount} archivos fallaron`);
  }

  if (downloadedCount > 0) {
    try {
      const mensaje = failedCount > 0
        ? `${downloadedCount} de ${archivos.length} archivos de la publicación "${nombrePublicacion}" se descargaron correctamente`
        : `Los archivos de la publicación "${nombrePublicacion}" se descargaron correctamente`;
      
      await enviarNotificacionLocal(
        'Descarga Completada',
        mensaje,
        { tipo: 'descarga_multiple', publicacion: nombrePublicacion, total: archivos.length, exitosos: downloadedCount }
      );
    } catch (notifError) {
      console.warn('No se pudo enviar notificación:', notifError);
    }
  }

  return {
    success: downloadedCount > 0,
    downloadedCount,
    failedCount,
    errors,
    pendingShare: pendingShare.length > 0 ? pendingShare : undefined,
  };
};

export const getStorageInfo = async (): Promise<{
  freeDiskStorage: number;
  totalDiskCapacity: number;
}> => {
  try {
    const freeSize = await FileSystem.getFreeDiskStorageAsync();
    const totalSize = await FileSystem.getTotalDiskCapacityAsync();
    return {
      freeDiskStorage: freeSize,
      totalDiskCapacity: totalSize,
    };
  } catch (error) {
    console.error('Error obteniendo info de almacenamiento:', error);
    return {
      freeDiskStorage: 0,
      totalDiskCapacity: 0,
    };
  }
};

export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};
