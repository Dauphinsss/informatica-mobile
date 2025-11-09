import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where,
  updateDoc,
  Timestamp 
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes,
  getDownloadURL,
  deleteObject 
} from "firebase/storage";
import { getAuth } from "firebase/auth";
import { db, storage } from "@/firebase";
import * as DocumentPicker from 'expo-document-picker';
import { Archivo, TipoArchivo } from "../types/Files.type";

const verificarAutenticacion = async (): Promise<boolean> => {
  const auth = getAuth();
  if (auth.currentUser) {
    return true;
  }
  
  return new Promise((resolve) => {
    let intentos = 0;
    const maxIntentos = 10;
    
    const verificar = setInterval(() => {
      intentos++;
      
      if (auth.currentUser) {
        clearInterval(verificar);
        resolve(true);
      } else if (intentos >= maxIntentos) {
        clearInterval(verificar);
        console.error("❌ No se pudo verificar autenticación después de 5 segundos");
        resolve(false);
      }
    }, 500);
  });
};

export const obtenerTiposArchivo = async (): Promise<TipoArchivo[]> => {
  const tipos: TipoArchivo[] = [];
  try {
    const tiposSnap = await getDocs(collection(db, "tiposArchivo"));
    tiposSnap.docs.forEach(docSnap => {
      tipos.push({
        id: docSnap.id,
        ...docSnap.data()
      } as TipoArchivo);
    });
  } catch (error) {
    console.error("Error al obtener tipos de archivo:", error);
  }
  return tipos;
};

export const obtenerTipoArchivoPorId = async (tipoId: string): Promise<TipoArchivo | null> => {
  try {
    const tipoDoc = await getDoc(doc(db, "tiposArchivo", tipoId));
    if (tipoDoc.exists()) {
      return {
        id: tipoDoc.id,
        ...tipoDoc.data()
      } as TipoArchivo;
    }
  } catch (error) {
    console.error("Error al obtener tipo de archivo:", error);
  }
  return null;
};

export const seleccionarArchivo = async (tiposPermitidos?: string[]) => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: tiposPermitidos || '*/*',
      copyToCacheDirectory: true
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error("Error al seleccionar archivo:", error);
    throw error;
  }
};

const simularProgreso = (onProgress?: (progress: number) => void) => {
  if (!onProgress) return () => {};
  
  let progreso = 0;
  const interval = setInterval(() => {
    progreso += 10;
    if (progreso <= 90) {
      onProgress(progreso);
    }
  }, 200);
  
  return () => {
    clearInterval(interval);
    onProgress(100);
  };
};

export const subirArchivo = async (
  publicacionId: string,
  archivo: DocumentPicker.DocumentPickerAsset,
  tipoArchivoId: string,
  titulo: string,
  descripcion?: string,
  onProgress?: (progress: number) => void
): Promise<Archivo> => {
  let detenerProgreso: (() => void) | null = null;
  
  try {
    const autenticado = await verificarAutenticacion();
    
    if (!autenticado) {
      throw new Error("No se pudo verificar la autenticación. Por favor, inicia sesión nuevamente.");
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let blob: Blob;
    
    try {
      const response = await fetch(archivo.uri);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      blob = await response.blob();
      
    } catch (fetchError) {
      console.error("Error fetch:", fetchError);
      
      try {
        const FileSystemLegacy = require('expo-file-system/legacy');
        const base64 = await FileSystemLegacy.readAsStringAsync(archivo.uri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
        
        const byteCharacters = atob(base64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        let mimeType = archivo.mimeType || 'application/octet-stream';
        if (!mimeType || mimeType === 'application/octet-stream') {
          const extension = archivo.name.split('.').pop()?.toLowerCase();
          if (extension === 'pdf') mimeType = 'application/pdf';
          else if (['jpg', 'jpeg'].includes(extension || '')) mimeType = 'image/jpeg';
          else if (extension === 'png') mimeType = 'image/png';
          else if (extension === 'mp4') mimeType = 'video/mp4';
          else if (extension === 'zip') mimeType = 'application/zip';
        }
        
        blob = new Blob([byteNumbers], { type: mimeType });
        
      } catch (fsError) {
        console.error("❌ FileSystem también falló:", fsError);
        throw new Error("No se pudo leer el archivo desde el dispositivo");
      }
    }

    if (!blob || blob.size === 0) {
      throw new Error("El archivo no pudo ser leído (tamaño 0)");
    }

    const timestamp = Date.now();
    const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `archivos/${publicacionId}/${timestamp}_${nombreLimpio}`;
    
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: blob.type || archivo.mimeType || 'application/octet-stream',
      customMetadata: {
        publicacionId: publicacionId,
        originalName: archivo.name,
        uploadedBy: getAuth().currentUser?.uid || 'unknown',
        uploadTimestamp: timestamp.toString()
      }
    };

    detenerProgreso = simularProgreso(onProgress);

    const uploadResult = await uploadBytes(storageRef, blob, metadata);
    
    if (detenerProgreso) {
      detenerProgreso();
      detenerProgreso = null;
    }

    const downloadURL = await getDownloadURL(uploadResult.ref);

    const archivoData = {
      publicacionId,
      tipoArchivoId,
      titulo,
      descripcion: descripcion || null,
      webUrl: downloadURL,
      filepath: downloadURL,
      tamanoBytes: archivo.size || blob.size || 0,
      fechaSubida: Timestamp.now(),
      activo: true
    };

    const docRef = await addDoc(collection(db, "archivos"), archivoData);

    const resultado = {
      id: docRef.id,
      ...archivoData,
      fechaSubida: new Date()
    } as Archivo;
    
    return resultado;
    
  } catch (error) {
    console.error("❌ ERROR en subirArchivo:", error);
    
    if (detenerProgreso) {
      detenerProgreso();
    }
    
    let mensajeError = "Error al subir el archivo";
    
    if (error instanceof Error) {
      if (error.message.includes('unauthorized')) {
        mensajeError = "Sin permisos. Cierra sesión y vuelve a iniciar.";
      } else if (error.message.includes('network')) {
        mensajeError = "Error de red. Verifica tu conexión.";
      } else if (error.message.includes('quota')) {
        mensajeError = "Cuota de almacenamiento excedida.";
      } else {
        mensajeError = error.message;
      }
    }
    
    throw new Error(mensajeError);
  }
};

export const obtenerArchivosPorPublicacion = async (
  publicacionId: string
): Promise<Archivo[]> => {
  const archivos: Archivo[] = [];
  try {
    const archivosSnap = await getDocs(
      query(
        collection(db, "archivos"),
        where("publicacionId", "==", publicacionId),
        where("activo", "==", true)
      )
    );

    archivosSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      archivos.push({
        id: docSnap.id,
        ...data,
        fechaSubida: data.fechaSubida.toDate()
      } as Archivo);
    });
  } catch (error) {
    console.error("Error al obtener archivos:", error);
  }
  return archivos;
};

export const eliminarArchivo = async (archivoId: string): Promise<void> => {
  try {
    const archivoDoc = await getDoc(doc(db, "archivos", archivoId));
    
    if (!archivoDoc.exists()) {
      throw new Error("Archivo no encontrado");
    }

    const archivoData = archivoDoc.data();

    if (!archivoData.esEnlaceExterno && archivoData.webUrl) {
      try {
        const storageUrl = archivoData.webUrl;
        const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
        const filePath = decodeURIComponent(
          storageUrl.replace(baseUrl, '').split('?')[0]
        );
        
        const storageRef = ref(storage, filePath);
        await deleteObject(storageRef);
      } catch (storageError) {
        console.warn("⚠️ No se pudo eliminar de Storage:", storageError);
      }
    } else {
    }

    // 3. Marcar como inactivo en Firestore
    await updateDoc(doc(db, "archivos", archivoId), {
      activo: false
    });
    
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error);
    throw error;
  }
};

export const actualizarArchivo = async (
  archivoId: string,
  titulo?: string,
  descripcion?: string
): Promise<void> => {
  try {
    const updateData: any = {};
    
    if (titulo !== undefined) updateData.titulo = titulo;
    if (descripcion !== undefined) updateData.descripcion = descripcion;

    await updateDoc(doc(db, "archivos", archivoId), updateData);
  } catch (error) {
    console.error("Error al actualizar archivo:", error);
    throw error;
  }
};

export const obtenerTamanoTotalArchivos = async (
  publicacionId: string
): Promise<number> => {
  try {
    const archivos = await obtenerArchivosPorPublicacion(publicacionId);
    return archivos
      .filter(archivo => !archivo.esEnlaceExterno)
      .reduce((total, archivo) => total + archivo.tamanoBytes, 0);
  } catch (error) {
    console.error("Error al calcular tamaño total:", error);
    return 0;
  }
};

export const guardarEnlaceExterno = async (
  publicacionId: string,
  tipoArchivoId: string,
  nombreEnlace: string,
  url: string
): Promise<{ id: string }> => {
  try {

    const archivoRef = await addDoc(collection(db, "archivos"), {
      activo: true,
      descripcion: null,
      fechaSubida: Timestamp.now(),
      filepath: null,
      publicacionId: publicacionId,
      tamanoBytes: 0,
      tipoArchivoId: tipoArchivoId,
      titulo: nombreEnlace,
      webUrl: url,
      esEnlaceExterno: true,
    });

    return { id: archivoRef.id };
  } catch (error) {
    console.error("Error al guardar enlace externo:", error);
    throw new Error(
      `Error al guardar el enlace: ${error instanceof Error ? error.message : "Error desconocido"}`
    );
  }
};