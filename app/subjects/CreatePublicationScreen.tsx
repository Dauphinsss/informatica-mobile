import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import {
  actualizarArchivo,
  eliminarArchivo,
  guardarEnlaceExterno,
  obtenerTiposArchivo,
  seleccionarArchivo,
  subirArchivo,
} from "@/scripts/services/Files";
import {
  crearPublicacion,
  obtenerArchivosConTipo,
  obtenerPublicacionPorId,
} from "@/scripts/services/Publications";
import { TipoArchivo } from "@/scripts/types/Files.type";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { getAuth } from "firebase/auth";
import { doc, getDoc, increment, setDoc, updateDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Dialog,
  Portal,
  ProgressBar,
  Text,
  TextInput,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert, {
  CustomAlertButton,
  CustomAlertType,
} from "../../components/ui/CustomAlert";
import { notificarUsuariosMateria } from "../../services/notifications";
import { getStyles } from "./_CreatePublicationScreen.styles";

interface ArchivoTemp {
  id?: string;
  asset?: DocumentPicker.DocumentPickerAsset;
  tipoArchivoId: string;
  seccionId?: string;
  orden?: number;
  progreso: number;
  subiendo: boolean;
  error?: string;
  esEnlaceExterno: boolean;
  urlExterna?: string;
  nombreEnlace?: string;
  nombrePersonalizado?: string;
  tamanoBytes?: number;
}

const MAX_ATTACHMENT_SIZE_BYTES = 100 * 1024 * 1024;
type SubjectTeacher = { id: string; nombre: string };
type SubjectSection = { id: string; nombre: string };

export default function CreatePublicationScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const route = useRoute();
  const auth = getAuth();
  const insets = useSafeAreaInsets();

  const params = route.params as {
    materiaId?: string;
    materiaNombre?: string;
    publicacionId?: string;
  };

  const materiaId = params?.materiaId || "";
  const materiaNombre = params?.materiaNombre || "Materia";
  const editPublicacionId = params?.publicacionId || "";
  const isEditMode = Boolean(editPublicacionId);

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState<ArchivoTemp[]>([]);
  const [tipos, setTipos] = useState<TipoArchivo[]>([]);
  const [publicando, setPublicando] = useState(false);
  const [publicacionId, setPublicacionId] = useState<string | null>(null);
  const [dialogEnlaceVisible, setDialogEnlaceVisible] = useState(false);
  const [urlEnlace, setUrlEnlace] = useState("");
  const [nombreEnlace, setNombreEnlace] = useState("");
  const [dialogRenombrarVisible, setDialogRenombrarVisible] = useState(false);
  const [archivoRenombrarIndex, setArchivoRenombrarIndex] = useState<
    number | null
  >(null);
  const [nuevoNombreArchivo, setNuevoNombreArchivo] = useState("");
  const [extensionBloqueada, setExtensionBloqueada] = useState<string>("");
  const [dialogSeleccionVisible, setDialogSeleccionVisible] = useState(false);
  const [dialogSeccionVisible, setDialogSeccionVisible] = useState(false);
  const [archivoSeccionIndex, setArchivoSeccionIndex] = useState<number | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<CustomAlertType>("info");
  const [alertButtons, setAlertButtons] = useState<
    CustomAlertButton[] | undefined
  >(undefined);
  const [availableTeachers, setAvailableTeachers] = useState<SubjectTeacher[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [availableSections, setAvailableSections] = useState<SubjectSection[]>([]);
  const [quickSectionId, setQuickSectionId] = useState<string>("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const showAlert = (
    title: string | undefined,
    message: string,
    type: CustomAlertType = "info",
    buttons?: CustomAlertButton[],
  ) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertButtons(
      buttons || [
        {
          text: "OK",
          onPress: () => {},
          mode: "contained",
        },
      ],
    );
    setAlertVisible(true);
  };

  useEffect(() => {
    cargarTiposArchivo();
  }, []);

  useEffect(() => {
    const cargarMetaMateria = async () => {
      if (!materiaId) return;
      try {
        const materiaSnap = await getDoc(doc(db, "materias", materiaId));
        const materiaData = materiaSnap.data() as any;
        const teacherIds: string[] = Array.isArray(materiaData?.docentesIds)
          ? materiaData.docentesIds.filter((id: unknown) => typeof id === "string")
          : [];
        const sectionIds: string[] = Array.isArray(materiaData?.seccionesIds)
          ? materiaData.seccionesIds.filter((id: unknown) => typeof id === "string")
          : [];

        const [teacherDocs, sectionDocs] = await Promise.all([
          Promise.all(teacherIds.map((id) => getDoc(doc(db, "docentes", id)))),
          Promise.all(sectionIds.map((id) => getDoc(doc(db, "secciones", id)))),
        ]);

        const teachers = teacherDocs
          .filter((d) => d.exists())
          .map((d) => {
            const data = d.data() as any;
            return {
              id: d.id,
              nombre: `${data.nombres || ""} ${data.apellidos || ""}`.trim(),
            };
          });
        const sections = sectionDocs
          .filter((d) => d.exists())
          .map((d) => {
            const data = d.data() as any;
            return { id: d.id, nombre: data.nombre || "Sección" };
          });

        setAvailableTeachers(teachers);
        setAvailableSections(sections);

        setSelectedTeacherId((prev) => {
          if (teachers.length === 0) return "";
          if (teachers.some((teacher) => teacher.id === prev)) return prev;
          return teachers[0].id;
        });
        setQuickSectionId((prev) => {
          if (sections.length === 0) return "";
          if (sections.some((section) => section.id === prev)) return prev;
          return sections[0].id;
        });
      } catch (error) {
        console.error("Error cargando meta de la materia:", error);
        setAvailableTeachers([]);
        setAvailableSections([]);
        setSelectedTeacherId("");
        setQuickSectionId("");
      }
    };

    void cargarMetaMateria();
  }, [materiaId]);

  useEffect(() => {
    if (!isEditMode || !editPublicacionId) return;
    let cancelled = false;

    const cargarDatosEdicion = async () => {
      setPublicando(true);
      try {
        const pub = await obtenerPublicacionPorId(editPublicacionId);
        if (!cancelled && pub) {
          setTitulo(pub.titulo || "");
          setDescripcion(pub.descripcion || "");
          setSelectedTeacherId(pub.docenteUid || "");
          setPublicacionId(editPublicacionId);
        }

        const archivosExistentes = await obtenerArchivosConTipo(editPublicacionId);
        if (!cancelled) {
          setArchivos(
            archivosExistentes.map((archivo, index) => ({
              id: archivo.id,
              tipoArchivoId: archivo.tipoArchivoId,
              seccionId: archivo.seccionId || "",
              orden: archivo.orden ?? index,
              progreso: 100,
              subiendo: false,
              esEnlaceExterno: !!archivo.esEnlaceExterno,
              urlExterna: archivo.esEnlaceExterno ? archivo.webUrl : undefined,
              nombreEnlace: archivo.esEnlaceExterno ? archivo.titulo : undefined,
              nombrePersonalizado: archivo.titulo,
              tamanoBytes: archivo.tamanoBytes || 0,
            })),
          );
        }
      } catch (error) {
        console.error("Error cargando publicación para editar:", error);
        if (!cancelled) {
          showAlert("Error", "No se pudo cargar la publicación para editar", "error");
        }
      } finally {
        if (!cancelled) setPublicando(false);
      }
    };

    void cargarDatosEdicion();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, editPublicacionId]);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height || 0);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const cargarTiposArchivo = async () => {
    const tiposData = await obtenerTiposArchivo();
    setTipos(tiposData);
  };

  const formatearTamano = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const obtenerIconoPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "file-pdf-box";
    if (tipo.includes("imagen")) return "image";
    if (tipo.includes("video")) return "video";
    if (tipo.includes("zip")) return "folder-zip";
    if (tipo.includes("word")) return "file-word";
    if (tipo.includes("excel")) return "file-excel";
    if (tipo.includes("presentación") || tipo.includes("ppt"))
      return "file-powerpoint";
    if (tipo.includes("audio") || tipo.includes("mp3")) return "music";
    if (tipo.includes("texto")) return "file-document-outline";
    if (tipo.includes("enlace")) return "link-variant";
    return "file-document";
  };

  const detectarTipoArchivo = (
    mimeType: string,
    nombre: string,
  ): string | null => {
    
    for (const tipo of tipos) {
      if (tipo.mimetype.some((mime) => mimeType && mimeType.includes(mime))) {
        return tipo.id;
      }
    }

    
    const extension = "." + nombre.split(".").pop()?.toLowerCase();

    for (const tipo of tipos) {
      if (tipo.extensiones.includes(extension)) {
        return tipo.id;
      }
    }

    return null;
  };

  const mostrarDialogoSeleccion = () => {
    setDialogSeleccionVisible(true);
  };

  const agregarArchivo = async () => {
    setDialogSeleccionVisible(false);

    try {
      const archivosSeleccionados = await seleccionarArchivo();
      if (!archivosSeleccionados || archivosSeleccionados.length === 0) return;

      const nuevosArchivos: ArchivoTemp[] = [];
      let omitidosPorTipo = 0;
      let omitidosPorTamano = 0;

      for (const archivo of archivosSeleccionados) {
        const tipoId = detectarTipoArchivo(archivo.mimeType || "", archivo.name);

        if (!tipoId) {
          omitidosPorTipo++;
          continue;
        }

        const tamanoArchivo = archivo.size || 0;
        if (tamanoArchivo > MAX_ATTACHMENT_SIZE_BYTES) {
          omitidosPorTamano++;
          continue;
        }

        nuevosArchivos.push({
          asset: archivo,
          tipoArchivoId: tipoId,
          seccionId: quickSectionId || availableSections[0]?.id || "",
          progreso: 0,
          subiendo: false,
          esEnlaceExterno: false,
        });
      }

      if (nuevosArchivos.length > 0) {
        setArchivos((prev) => {
          const base = prev.length;
          return [
            ...prev,
            ...nuevosArchivos.map((archivo, idx) => ({
              ...archivo,
              orden: base + idx,
            })),
          ];
        });
      }

      if (omitidosPorTipo > 0 || omitidosPorTamano > 0) {
        const partes: string[] = [];
        if (omitidosPorTipo > 0) {
          partes.push(`${omitidosPorTipo} por tipo no soportado`);
        }
        if (omitidosPorTamano > 0) {
          partes.push(`${omitidosPorTamano} por superar 100 MB`);
        }
        showAlert(
          "Algunos archivos no se agregaron",
          `Se omitieron ${partes.join(" y ")}.`,
          "info",
        );
      }
    } catch (error) {
      console.error("Error al agregar archivo:", error);
      showAlert("Error", "No se pudo agregar el archivo", "error");
    }
  };

  const mostrarDialogoEnlace = () => {
    setDialogSeleccionVisible(false);
    setDialogEnlaceVisible(true);
  };

  const agregarEnlace = () => {
    if (!urlEnlace.trim()) {
      showAlert("Error", "La URL es obligatoria", "error");
      return;
    }

    if (!nombreEnlace.trim()) {
      showAlert("Error", "El nombre del enlace es obligatorio", "error");
      return;
    }

    try {
      new URL(urlEnlace);
    } catch {
      showAlert(
        "Error",
        "La URL no es válida. Debe incluir http:// o https://",
        "error",
      );
      return;
    }

    const tipoEnlace = tipos.find((t) => t.nombre.toLowerCase() === "enlace");

    if (!tipoEnlace) {
      showAlert(
        "Error",
        "No se encontró el tipo de archivo 'Enlace' en la base de datos",
        "error",
      );
      return;
    }

    const nuevoEnlace: ArchivoTemp = {
      tipoArchivoId: tipoEnlace.id,
      seccionId: quickSectionId || availableSections[0]?.id || "",
      orden: archivos.length,
      progreso: 0,
      subiendo: false,
      esEnlaceExterno: true,
      urlExterna: urlEnlace,
      nombreEnlace: nombreEnlace,
    };

    setArchivos((prev) => [...prev, nuevoEnlace]);
    setDialogEnlaceVisible(false);
    setUrlEnlace("");
    setNombreEnlace("");
  };

  const pegarUrlDesdePortapapeles = async () => {
    try {
      const text = (await Clipboard.getStringAsync())?.trim() || "";
      if (!text) {
        showAlert("Portapapeles vacío", "No hay texto para pegar.", "info");
        return;
      }
      setUrlEnlace(text);
    } catch (error) {
      console.error("Error leyendo portapapeles:", error);
      showAlert("Error", "No se pudo leer el portapapeles.", "error");
    }
  };

  const eliminarArchivoLocal = async (index: number) => {
    const archivo = archivos[index];

    
    if (archivo.id && publicacionId) {
      try {
        await eliminarArchivo(archivo.id);
      } catch (error) {
        console.error("Error al eliminar archivo:", error);
      }
    }

    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  const moverArchivo = (fromIndex: number, toIndex: number) => {
    setArchivos((prev) => {
      if (
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }

      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next.map((archivo, idx) => ({ ...archivo, orden: idx }));
    });
  };

  const obtenerNombreArchivo = (archivo: ArchivoTemp) => {
    if (archivo.nombrePersonalizado?.trim()) {
      return archivo.nombrePersonalizado.trim();
    }
    if (archivo.esEnlaceExterno) {
      return archivo.nombreEnlace || "Enlace";
    }
    return archivo.asset?.name || "Archivo";
  };

  const obtenerExtensionBloqueada = (archivo: ArchivoTemp): string => {
    if (archivo.esEnlaceExterno) return "";

    const nombreActual = obtenerNombreArchivo(archivo).trim();
    const ultimoPunto = nombreActual.lastIndexOf(".");
    if (ultimoPunto <= 0 || ultimoPunto === nombreActual.length - 1) return "";
    return nombreActual.slice(ultimoPunto).toLowerCase();
  };

  const obtenerNombreSeccion = (sectionId?: string): string => {
    if (!sectionId) return "";
    const section = availableSections.find((s) => s.id === sectionId);
    return section?.nombre || "";
  };

  const cambiarSeccionArchivo = (index: number, sectionId: string) => {
    setArchivos((prev) =>
      prev.map((archivo, idx) =>
        idx === index ? { ...archivo, seccionId: sectionId } : archivo,
      ),
    );
  };

  const aplicarSeccionATodos = () => {
    if (!quickSectionId) return;
    setArchivos((prev) =>
      prev.map((archivo) => ({ ...archivo, seccionId: quickSectionId })),
    );
  };

  const abrirDialogoSeccionArchivo = (index: number) => {
    setArchivoSeccionIndex(index);
    setDialogSeccionVisible(true);
  };

  const seleccionarSeccionArchivo = (sectionId: string) => {
    if (archivoSeccionIndex === null) return;
    cambiarSeccionArchivo(archivoSeccionIndex, sectionId);
    setDialogSeccionVisible(false);
    setArchivoSeccionIndex(null);
  };

  const abrirDialogoRenombrarArchivo = (index: number) => {
    const archivo = archivos[index];
    if (!archivo) return;
    setArchivoRenombrarIndex(index);
    setNuevoNombreArchivo(obtenerNombreArchivo(archivo));
    setExtensionBloqueada(obtenerExtensionBloqueada(archivo));
    setDialogRenombrarVisible(true);
  };

  const guardarNombreArchivo = () => {
    if (archivoRenombrarIndex === null) return;
    const archivoObjetivo = archivos[archivoRenombrarIndex];
    if (!archivoObjetivo) return;

    const nombreIngresado = nuevoNombreArchivo.trim();
    if (!nombreIngresado) {
      showAlert("Error", "El nombre no puede estar vacío", "error");
      return;
    }

    let nombreFinal = nombreIngresado;

    if (!archivoObjetivo.esEnlaceExterno && extensionBloqueada) {
      const sufijoRegex = /\.[^./\\\s]+$/;
      const baseSinSufijo = nombreIngresado.replace(sufijoRegex, "").trim();
      if (!baseSinSufijo) {
        showAlert("Error", "El nombre no puede estar vacío", "error");
        return;
      }
      nombreFinal = `${baseSinSufijo}${extensionBloqueada}`;
    }

    setArchivos((prev) =>
      prev.map((archivo, index) => {
        if (index !== archivoRenombrarIndex) return archivo;
        if (archivo.esEnlaceExterno) {
          return {
            ...archivo,
            nombrePersonalizado: nombreFinal,
            nombreEnlace: nombreFinal,
          };
        }
        return { ...archivo, nombrePersonalizado: nombreFinal };
      }),
    );

    setDialogRenombrarVisible(false);
    setArchivoRenombrarIndex(null);
    setNuevoNombreArchivo("");
    setExtensionBloqueada("");
  };

  const actualizarEstadisticasUsuario = async (
    usuarioUid: string,
    cambios: Record<string, number>,
  ) => {
    try {
      if (!usuarioUid) return;
      const data: Record<string, any> = {};
      Object.entries(cambios).forEach(([key, value]) => {
        data[key] = increment(value);
      });

      await setDoc(doc(db, "estadisticasUsuario", usuarioUid), data, {
        merge: true,
      });
    } catch (error) {
      console.error("Error actualizando estadisticasUsuario:", error);
    }
  };

  const publicar = async () => {
    if (!titulo.trim()) {
      showAlert("Error", "El título es obligatorio", "error");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showAlert("Error", "Debes iniciar sesión", "error");
      return;
    }

    if (availableTeachers.length === 0) {
      showAlert(
        "Docentes requeridos",
        "Esta materia no tiene docentes configurados. Asigna docentes en Editar materia.",
        "error",
      );
      return;
    }

    const docenteSeleccionado = availableTeachers.find(
      (teacher) => teacher.id === selectedTeacherId,
    );
    if (!docenteSeleccionado) {
      showAlert("Error", "Debes seleccionar un docente", "error");
      return;
    }

    if (archivos.length > 0 && availableSections.length === 0) {
      showAlert(
        "Secciones requeridas",
        "Esta materia no tiene secciones configuradas. Agrégalas en Editar materia.",
        "error",
      );
      return;
    }

    const archivoSinSeccion =
      archivos.length > 0 ? archivos.find((archivo) => !archivo.seccionId) : undefined;
    if (archivoSinSeccion) {
      showAlert("Error", "Cada archivo debe tener una etiqueta de sección", "error");
      return;
    }

    setPublicando(true);

    try {
      
      const nombreUsuario = user.displayName || user.email || "Usuario";

      
      let autorRol = "usuario";
      try {
        const userDoc = await getDoc(doc(db, "usuarios", user.uid));
        if (userDoc.exists()) {
          autorRol = userDoc.data()?.rol || "usuario";
        }
      } catch {}
      const autorRolNormalizado = String(autorRol || "").trim().toLowerCase();
      const autorEsAdmin =
        autorRolNormalizado === "admin" ||
        autorRolNormalizado === "administrador" ||
        autorRolNormalizado === "administrator";

      let pubId = publicacionId || "";
      if (isEditMode && editPublicacionId) {
        pubId = editPublicacionId;
        await updateDoc(doc(db, "publicaciones", editPublicacionId), {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          docenteUid: docenteSeleccionado.id,
          docenteNombre: docenteSeleccionado.nombre,
          updatedAt: new Date(),
        });
      } else {
        pubId = await crearPublicacion(
          materiaId,
          user.uid,
          nombreUsuario,
          user.photoURL || null,
          titulo,
          descripcion.trim(),
          docenteSeleccionado.id,
          docenteSeleccionado.nombre,
          autorRol,
        );
        setPublicacionId(pubId);
        try {
          await actualizarEstadisticasUsuario(user.uid, {
            publicacionesCreadas: 1,
          });
        } catch (e) {
          console.error(
            "No se pudo actualizar estadisticasUsuario tras crear publicación:",
            e,
          );
        }
      }

      
      if (archivos.length > 0) {
        for (let i = 0; i < archivos.length; i++) {
          const archivo = archivos[i];
          const ordenActual = i;
          const nombreActualizado = obtenerNombreArchivo(archivo).trim() || "Archivo";
          const seccionId = archivo.seccionId || "";
          const seccionNombre = obtenerNombreSeccion(seccionId);

          
          if (archivo.id) {
            await actualizarArchivo(
              archivo.id,
              nombreActualizado,
              undefined,
              ordenActual,
              seccionId,
              seccionNombre,
            );
            continue;
          }

          
          setArchivos((prev) => {
            const nuevos = [...prev];
            nuevos[i] = { ...nuevos[i], subiendo: true };
            return nuevos;
          });

          try {
            
            if (archivo.esEnlaceExterno) {
              const resultado = await guardarEnlaceExterno(
                pubId,
                archivo.tipoArchivoId,
                nombreActualizado,
                archivo.urlExterna!,
                ordenActual,
                seccionId,
                seccionNombre,
              );

              setArchivos((prev) => {
                const nuevos = [...prev];
                nuevos[i] = {
                  ...nuevos[i],
                  id: resultado.id,
                  subiendo: false,
                  progreso: 100,
                };
                return nuevos;
              });
            }
            
            else {
              const resultado = await subirArchivo(
                pubId,
                archivo.asset!,
                archivo.tipoArchivoId,
                nombreActualizado,
                undefined,
                (progreso) => {
                  setArchivos((prev) => {
                    const nuevos = [...prev];
                    nuevos[i] = { ...nuevos[i], progreso };
                    return nuevos;
                  });
                },
                ordenActual,
                seccionId,
                seccionNombre,
              );

              setArchivos((prev) => {
                const nuevos = [...prev];
                nuevos[i] = {
                  ...nuevos[i],
                  id: resultado.id,
                  subiendo: false,
                  progreso: 100,
                };
                return nuevos;
              });
            }
          } catch (error) {
            console.error(`Error al procesar elemento ${i}:`, error);

            let mensajeError = "Error al procesar";
            if (error instanceof Error) {
              mensajeError = error.message;
            }

            setArchivos((prev) => {
              const nuevos = [...prev];
              nuevos[i] = {
                ...nuevos[i],
                subiendo: false,
                error: mensajeError,
              };
              return nuevos;
            });

            const nombreElemento = archivo.esEnlaceExterno
              ? archivo.nombreEnlace
              : archivo.asset?.name;

            showAlert(
              "Error al subir archivo",
              `No se pudo subir "${nombreElemento}": ${mensajeError}\n\nLos demás elementos continuarán procesándose.`,
              "error",
            );
          }
        }
      }

      if (!isEditMode && autorEsAdmin) {
        try {
          await notificarUsuariosMateria(
            materiaId,
            materiaNombre,
            "Nueva publicación",
            `${nombreUsuario} publicó: ${titulo}`,
            "info",
            "newspaper",
            pubId,
            {
              uid: user.uid,
              nombre: nombreUsuario,
              foto: user.photoURL || null,
            },
          );
        } catch (notifError) {
          console.error("Error al enviar notificaciones:", notifError);
        }
      }

      showAlert(
        "Éxito",
        isEditMode
          ? "Publicación actualizada correctamente"
          : autorEsAdmin
            ? "Publicación creada correctamente"
            : "Publicación enviada a revisión",
        "success",
        [
        {
          text: "OK",
          onPress: async () => {
            navigation.goBack();
          },
          mode: "contained",
        },
      ]);
    } catch (error) {
      console.error("Error al publicar:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      showAlert(
        "Error",
        `No se pudo ${isEditMode ? "actualizar" : "crear"} la publicación: ${errorMessage}`,
        "error",
      );
    } finally {
      setPublicando(false);
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="" />
        <Button
          mode="contained"
          onPress={publicar}
          disabled={publicando}
          loading={publicando}
          style={styles.headerCreateButton}
          contentStyle={styles.headerCreateButtonContent}
          labelStyle={styles.headerCreateButtonLabel}
        >
          {isEditMode ? "Guardar" : "Crear"}
        </Button>
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Text variant="labelMedium" style={styles.label}>
          Materia: {materiaNombre}
        </Text>

        <TextInput
          label="Título *"
          value={titulo}
          onChangeText={setTitulo}
          mode="outlined"
          style={styles.input}
          disabled={publicando}
        />

        <TextInput
          label="Descripción (opcional)"
          value={descripcion}
          onChangeText={setDescripcion}
          mode="outlined"
          numberOfLines={6}
          style={styles.input}
          disabled={publicando}
        />

        <View style={styles.teacherSelectorWrap}>
          <Text variant="labelMedium" style={styles.label}>
            Docente del material *
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.teacherChipsRow}>
              {availableTeachers.map((teacher) => (
                <TouchableOpacity
                  key={teacher.id}
                  onPress={() => setSelectedTeacherId(teacher.id)}
                  style={[
                    styles.teacherChip,
                    selectedTeacherId === teacher.id
                      ? { backgroundColor: theme.colors.primaryContainer }
                      : { backgroundColor: theme.colors.surfaceVariant },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color:
                        selectedTeacherId === teacher.id
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurfaceVariant,
                    }}
                  >
                    {teacher.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.attachmentsHeaderWrap}>
          {availableSections.length > 0 ? (
            <View style={styles.quickTagWrap}>
              <View style={styles.quickTagHeader}>
                <Text variant="labelMedium" style={styles.label}>
                  Seccion rapida
                </Text>
                <Button
                  mode="text"
                  compact
                  onPress={aplicarSeccionATodos}
                  disabled={publicando || !quickSectionId || archivos.length === 0}
                  contentStyle={styles.quickApplyContent}
                  labelStyle={styles.quickApplyLabel}
                >
                  Aplicar
                </Button>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.teacherChipsRow}>
                  {availableSections.map((section) => (
                    <TouchableOpacity
                      key={section.id}
                      onPress={() => setQuickSectionId(section.id)}
                      style={[
                        styles.teacherChip,
                        quickSectionId === section.id
                          ? { backgroundColor: theme.colors.primaryContainer }
                          : { backgroundColor: theme.colors.surfaceVariant },
                      ]}
                    >
                      <Text
                        numberOfLines={1}
                        style={{
                          color:
                            quickSectionId === section.id
                              ? theme.colors.onPrimaryContainer
                              : theme.colors.onSurfaceVariant,
                        }}
                      >
                        {section.nombre}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          ) : null}
        </View>

        {archivos.length === 0 ? (
          <Text variant="bodyMedium" style={styles.noArchivos}>
            No hay archivos adjuntos
          </Text>
        ) : (
          <View style={styles.archivosList}>
            {archivos.map((archivo, index) => {
              const tipo = tipos.find((t) => t.id === archivo.tipoArchivoId);
              const nombreMostrar = obtenerNombreArchivo(archivo);
              const tamanoTexto = archivo.esEnlaceExterno
                ? "Enlace"
                : formatearTamano(archivo.asset?.size || archivo.tamanoBytes || 0);
              const tamanoTextoUI = tamanoTexto.replace(" ", "\u00A0");
              const icono = obtenerIconoPorTipo(tipo?.nombre || "");

              return (
                <View key={index} style={styles.archivoItem}>
                  <View style={styles.archivoContent}>
                    <View style={styles.archivoInfo}>
                      <View style={styles.archivoLeading}>
                        <MaterialCommunityIcons
                          name={icono as any}
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.archivoTexto}>
                        <Text
                          variant="bodyMedium"
                          style={styles.archivoNombre}
                          numberOfLines={2}
                        >
                          {nombreMostrar}
                        </Text>
                        <View style={styles.archivoFooterRow}>
                          <Text variant="bodySmall" style={styles.archivoTamano}>
                            {tamanoTextoUI}
                          </Text>
                          <View style={styles.archivoActions}>
                            <TouchableOpacity
                              onPress={() => moverArchivo(index, index - 1)}
                              disabled={archivo.subiendo || index === 0 || publicando}
                              style={styles.archivoActionButton}
                            >
                              <MaterialCommunityIcons
                                name="arrow-up"
                                size={18}
                                color={theme.colors.onSurfaceVariant}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => moverArchivo(index, index + 1)}
                              disabled={
                                archivo.subiendo ||
                                index === archivos.length - 1 ||
                                publicando
                              }
                              style={styles.archivoActionButton}
                            >
                              <MaterialCommunityIcons
                                name="arrow-down"
                                size={18}
                                color={theme.colors.onSurfaceVariant}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => abrirDialogoRenombrarArchivo(index)}
                              disabled={archivo.subiendo || publicando}
                              style={styles.archivoActionButton}
                            >
                              <MaterialCommunityIcons
                                name="pencil"
                                size={18}
                                color={theme.colors.onSurfaceVariant}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => eliminarArchivoLocal(index)}
                              disabled={archivo.subiendo || publicando}
                              style={styles.archivoActionButton}
                            >
                              <MaterialCommunityIcons
                                name="close"
                                size={20}
                                color={theme.colors.onSurfaceVariant}
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                        {availableSections.length > 0 ? (
                          <View style={styles.fileSectionMinimalRow}>
                            <Text variant="labelMedium" style={styles.fileSectionLabel}>
                              Sección
                            </Text>
                            <TouchableOpacity
                              onPress={() => abrirDialogoSeccionArchivo(index)}
                              style={[
                                styles.fileSectionPill,
                                { backgroundColor: theme.colors.surfaceVariant },
                              ]}
                              disabled={publicando || archivo.subiendo}
                            >
                              <Text
                                numberOfLines={1}
                                style={{ color: theme.colors.onSurfaceVariant }}
                              >
                                {obtenerNombreSeccion(archivo.seccionId) || "Seleccionar"}
                              </Text>
                              <MaterialCommunityIcons
                                name="chevron-down"
                                size={16}
                                color={theme.colors.onSurfaceVariant}
                              />
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {archivo.subiendo && (
                    <ProgressBar
                      progress={archivo.progreso / 100}
                      style={styles.progressBar}
                    />
                  )}

                  {archivo.error && (
                    <View style={styles.archivoErrorWrap}>
                      <Text variant="bodySmall" style={styles.errorText}>
                        {archivo.error}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        <Button
          mode="contained"
          onPress={mostrarDialogoSeleccion}
          disabled={publicando}
          style={styles.publicarButton}
          icon="paperclip"
        >
          Adjuntar archivos
        </Button>
      </ScrollView>

      <Portal>
        <Dialog
          visible={dialogSeleccionVisible}
          onDismiss={() => setDialogSeleccionVisible(false)}
        >
          <Dialog.Title>¿Qué deseas adjuntar?</Dialog.Title>
          <Dialog.Content>
            <Button
              mode="contained"
              icon="file-upload"
              onPress={agregarArchivo}
              style={{ marginBottom: 12 }}
            >
              Subir archivos
            </Button>
            <Button
              mode="outlined"
              icon="link-variant"
              onPress={mostrarDialogoEnlace}
            >
              Agregar enlace
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogSeleccionVisible(false)}>
              Cancelar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Portal>
        <Dialog
          visible={dialogEnlaceVisible}
          onDismiss={() => setDialogEnlaceVisible(false)}
        >
          <Dialog.Title>Agregar enlace</Dialog.Title>
          <Dialog.ScrollArea>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 24}
            >
              <ScrollView keyboardShouldPersistTaps="handled">
                <TextInput
                  label="Nombre del enlace *"
                  value={nombreEnlace}
                  onChangeText={setNombreEnlace}
                  mode="outlined"
                  style={{ marginBottom: 12 }}
                  placeholder="Ej: Video explicativo"
                />
                <TextInput
                  label="URL *"
                  value={urlEnlace}
                  onChangeText={setUrlEnlace}
                  mode="outlined"
                  placeholder="https://ejemplo.com"
                  keyboardType="url"
                  autoCapitalize="none"
                />
                <View style={{ alignItems: "flex-end", marginTop: 8 }}>
                  <Button
                    mode="text"
                    icon="content-paste"
                    compact
                    onPress={pegarUrlDesdePortapapeles}
                  >
                    Pegar
                  </Button>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Dialog.ScrollArea>
          <Dialog.Actions>
            <Button onPress={() => setDialogEnlaceVisible(false)}>
              Cancelar
            </Button>
            <Button onPress={agregarEnlace}>Agregar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog
          visible={dialogRenombrarVisible}
          onDismiss={() => {
            setDialogRenombrarVisible(false);
            setArchivoRenombrarIndex(null);
            setNuevoNombreArchivo("");
            setExtensionBloqueada("");
          }}
          style={{
            transform: [
              { translateY: keyboardHeight > 0 ? -Math.min(keyboardHeight * 0.35, 140) : 0 },
            ],
          }}
        >
          <Dialog.Title>Editar nombre</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nombre"
              value={nuevoNombreArchivo}
              onChangeText={setNuevoNombreArchivo}
              mode="outlined"
              maxLength={80}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setDialogRenombrarVisible(false);
                setArchivoRenombrarIndex(null);
                setNuevoNombreArchivo("");
                setExtensionBloqueada("");
              }}
            >
              Cancelar
            </Button>
            <Button onPress={guardarNombreArchivo}>Guardar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
      <Portal>
        <Dialog
          visible={dialogSeccionVisible}
          onDismiss={() => {
            setDialogSeccionVisible(false);
            setArchivoSeccionIndex(null);
          }}
          style={styles.sectionDialog}
        >
          <Dialog.Title>Seleccionar sección</Dialog.Title>
          <Dialog.ScrollArea style={styles.sectionDialogScrollArea}>
            <ScrollView keyboardShouldPersistTaps="handled">
              {availableSections.map((section) => {
                const currentSectionId =
                  archivoSeccionIndex !== null ? archivos[archivoSeccionIndex]?.seccionId : "";
                const isSelected = currentSectionId === section.id;
                return (
                  <TouchableOpacity
                    key={section.id}
                    onPress={() => seleccionarSeccionArchivo(section.id)}
                    style={[
                      styles.sectionOptionRow,
                      isSelected
                        ? { backgroundColor: theme.colors.primaryContainer }
                        : undefined,
                    ]}
                  >
                    <Text
                      style={{
                        color: isSelected
                          ? theme.colors.onPrimaryContainer
                          : theme.colors.onSurface,
                        fontWeight: isSelected ? "600" : "500",
                      }}
                    >
                      {section.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Dialog.ScrollArea>
        </Dialog>
      </Portal>
      <CustomAlert
        visible={alertVisible}
        onDismiss={() => setAlertVisible(false)}
        title={alertTitle}
        message={alertMessage}
        type={alertType}
        buttons={alertButtons}
      />
    </View>
  );
}
