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
// FileSystem se importa dinámicamente cuando se necesita
import { Archivo, TipoArchivo } from "../types/Files.type";

/**
 * Verifica que el usuario esté autenticado y espera si es necesario
 */
const verificarAutenticacion = async (): Promise<boolean> => {
  const auth = getAuth();
  
  // Si ya hay un usuario, devolver true inmediatamente
  if (auth.currentUser) {
    console.log("✅ Usuario autenticado:", auth.currentUser.uid);
    return true;
  }
  
  // Esperar hasta 5 segundos por la autenticación
  return new Promise((resolve) => {
    let intentos = 0;
    const maxIntentos = 10;
    
    const verificar = setInterval(() => {
      intentos++;
      
      if (auth.currentUser) {
        clearInterval(verificar);
        console.log("✅ Usuario autenticado después de espera:", auth.currentUser.uid);
        resolve(true);
      } else if (intentos >= maxIntentos) {
        clearInterval(verificar);
        console.error("❌ No se pudo verificar autenticación después de 5 segundos");
        resolve(false);
      }
    }, 500);
  });
};

/**
 * Obtiene todos los tipos de archivo disponibles del catálogo
 */
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

/**
 * Obtiene un tipo de archivo por su ID
 */
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

/**
 * Selecciona un archivo del dispositivo
 */
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

/**
 * Simula el progreso de subida para uploadBytes
 */
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

/**
 * Sube un archivo a Firebase Storage y guarda la referencia en Firestore
 */
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
    console.log("=== INICIANDO SUBIDA DE ARCHIVO ===");
    console.log("📄 Archivo:", archivo.name);
    console.log("📏 Tamaño:", archivo.size, "bytes");
    console.log("📝 Tipo:", archivo.mimeType);
    
    // 0. VERIFICAR AUTENTICACIÓN
    console.log("🔐 Verificando autenticación...");
    const autenticado = await verificarAutenticacion();
    
    if (!autenticado) {
      throw new Error("No se pudo verificar la autenticación. Por favor, inicia sesión nuevamente.");
    }
    
    // Pequeña pausa para asegurar sincronización
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 1. Leer el archivo
    console.log("📖 Leyendo archivo...");
    let blob: Blob;
    
    try {
      // Método principal: usar fetch (funciona para la mayoría de casos)
      const response = await fetch(archivo.uri);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Obtener como Blob directamente
      blob = await response.blob();
      console.log("✅ Archivo leído:", blob.size, "bytes");
      
    } catch (fetchError) {
      console.log("⚠️ Fetch falló, intentando método alternativo...");
      console.error("Error fetch:", fetchError);
      
      // Método alternativo: leer como base64 y convertir
      try {
        // Usar la API legacy explícitamente para evitar el warning
        const FileSystemLegacy = require('expo-file-system/legacy');
        const base64 = await FileSystemLegacy.readAsStringAsync(archivo.uri, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });
        
        // Convertir base64 a Blob
        const byteCharacters = atob(base64);
        const byteNumbers = new Uint8Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        // Determinar MIME type
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
        console.log("✅ Archivo leído con FileSystem:", blob.size, "bytes");
        
      } catch (fsError) {
        console.error("❌ FileSystem también falló:", fsError);
        throw new Error("No se pudo leer el archivo desde el dispositivo");
      }
    }

    // Validar
    if (!blob || blob.size === 0) {
      throw new Error("El archivo no pudo ser leído (tamaño 0)");
    }

    // 2. Preparar Storage reference
    const timestamp = Date.now();
    const nombreLimpio = archivo.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `archivos/${publicacionId}/${timestamp}_${nombreLimpio}`;
    console.log("📁 Ruta Storage:", storagePath);
    
    const storageRef = ref(storage, storagePath);

    // 3. Configurar metadata
    const metadata = {
      contentType: blob.type || archivo.mimeType || 'application/octet-stream',
      customMetadata: {
        publicacionId: publicacionId,
        originalName: archivo.name,
        uploadedBy: getAuth().currentUser?.uid || 'unknown',
        uploadTimestamp: timestamp.toString()
      }
    };

    // 4. Iniciar progreso simulado
    console.log("⬆️ Subiendo a Storage...");
    detenerProgreso = simularProgreso(onProgress);

    // 5. Subir usando uploadBytes (más confiable en React Native)
    const uploadResult = await uploadBytes(storageRef, blob, metadata);
    console.log("✅ Subida completada!");
    
    // Detener simulación y marcar 100%
    if (detenerProgreso) {
      detenerProgreso();
      detenerProgreso = null;
    }

    // 6. Obtener URL de descarga
    console.log("🔗 Obteniendo URL...");
    const downloadURL = await getDownloadURL(uploadResult.ref);
    console.log("✅ URL obtenida");

    // 7. Guardar en Firestore
    console.log("💾 Guardando en Firestore...");
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
    console.log("✅ Guardado con ID:", docRef.id);

    const resultado = {
      id: docRef.id,
      ...archivoData,
      fechaSubida: new Date()
    } as Archivo;
    
    console.log("🎉 === SUBIDA COMPLETADA ===");
    return resultado;
    
  } catch (error) {
    console.error("❌ ERROR en subirArchivo:", error);
    
    // Detener progreso en caso de error
    if (detenerProgreso) {
      detenerProgreso();
    }
    
    // Proporcionar mensaje de error más útil
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

/**
 * Obtiene todos los archivos de una publicación
 */
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

/**
 * Elimina un archivo (lógicamente en Firestore y físicamente en Storage)
 */
export const eliminarArchivo = async (archivoId: string): Promise<void> => {
  try {
    // 1. Obtener datos del archivo
    const archivoDoc = await getDoc(doc(db, "archivos", archivoId));
    
    if (!archivoDoc.exists()) {
      throw new Error("Archivo no encontrado");
    }

    const archivoData = archivoDoc.data();

    // 2. Eliminar de Storage
    try {
      const storageUrl = archivoData.webUrl;
      const baseUrl = `https://firebasestorage.googleapis.com/v0/b/${storage.app.options.storageBucket}/o/`;
      const filePath = decodeURIComponent(
        storageUrl.replace(baseUrl, '').split('?')[0]
      );
      
      const storageRef = ref(storage, filePath);
      await deleteObject(storageRef);
      console.log("✅ Archivo eliminado de Storage");
    } catch (storageError) {
      console.warn("⚠️ No se pudo eliminar de Storage:", storageError);
      // Continuar con eliminación lógica
    }

    // 3. Marcar como inactivo en Firestore
    await updateDoc(doc(db, "archivos", archivoId), {
      activo: false
    });
    console.log("✅ Archivo marcado como inactivo");
    
  } catch (error) {
    console.error("❌ Error al eliminar archivo:", error);
    throw error;
  }
};

/**
 * Actualiza los metadatos de un archivo
 */
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

/**
 * Obtiene el tamaño total en bytes de archivos de una publicación
 */
export const obtenerTamanoTotalArchivos = async (
  publicacionId: string
): Promise<number> => {
  try {
    const archivos = await obtenerArchivosPorPublicacion(publicacionId);
    return archivos.reduce((total, archivo) => total + archivo.tamanoBytes, 0);
  } catch (error) {
    console.error("Error al calcular tamaño total:", error);
    return 0;
  }
};