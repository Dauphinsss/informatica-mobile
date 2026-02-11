import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import {
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
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
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
  progreso: number;
  subiendo: boolean;
  error?: string;
  esEnlaceExterno: boolean;
  urlExterna?: string;
  nombreEnlace?: string;
  nombrePersonalizado?: string;
  tamanoBytes?: number;
}

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
  const [dialogSeleccionVisible, setDialogSeleccionVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<CustomAlertType>("info");
  const [alertButtons, setAlertButtons] = useState<
    CustomAlertButton[] | undefined
  >(undefined);

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
    if (!isEditMode || !editPublicacionId) return;
    let cancelled = false;

    const cargarDatosEdicion = async () => {
      setPublicando(true);
      try {
        const pub = await obtenerPublicacionPorId(editPublicacionId);
        if (!cancelled && pub) {
          setTitulo(pub.titulo || "");
          setDescripcion(pub.descripcion || "");
          setPublicacionId(editPublicacionId);
        }

        const archivosExistentes = await obtenerArchivosConTipo(editPublicacionId);
        if (!cancelled) {
          setArchivos(
            archivosExistentes.map((archivo) => ({
              id: archivo.id,
              tipoArchivoId: archivo.tipoArchivoId,
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
      const archivo = await seleccionarArchivo();
      if (!archivo) return;

      const tipoId = detectarTipoArchivo(archivo.mimeType || "", archivo.name);

      if (!tipoId) {
        showAlert(
          "Tipo no soportado",
          "El tipo de archivo seleccionado no está soportado.",
          "error",
        );
        return;
      }

      const nuevoArchivo: ArchivoTemp = {
        asset: archivo,
        tipoArchivoId: tipoId,
        progreso: 0,
        subiendo: false,
        esEnlaceExterno: false,
      };

      setArchivos((prev) => [...prev, nuevoArchivo]);
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

  const obtenerNombreArchivo = (archivo: ArchivoTemp) => {
    if (archivo.nombrePersonalizado?.trim()) {
      return archivo.nombrePersonalizado.trim();
    }
    if (archivo.esEnlaceExterno) {
      return archivo.nombreEnlace || "Enlace";
    }
    return archivo.asset?.name || "Archivo";
  };

  const abrirDialogoRenombrarArchivo = (index: number) => {
    const archivo = archivos[index];
    if (!archivo) return;
    setArchivoRenombrarIndex(index);
    setNuevoNombreArchivo(obtenerNombreArchivo(archivo));
    setDialogRenombrarVisible(true);
  };

  const guardarNombreArchivo = () => {
    if (archivoRenombrarIndex === null) return;
    const nombreLimpio = nuevoNombreArchivo.trim();
    if (!nombreLimpio) {
      showAlert("Error", "El nombre no puede estar vacío", "error");
      return;
    }

    setArchivos((prev) =>
      prev.map((archivo, index) => {
        if (index !== archivoRenombrarIndex) return archivo;
        if (archivo.esEnlaceExterno) {
          return {
            ...archivo,
            nombrePersonalizado: nombreLimpio,
            nombreEnlace: nombreLimpio,
          };
        }
        return { ...archivo, nombrePersonalizado: nombreLimpio };
      }),
    );

    setDialogRenombrarVisible(false);
    setArchivoRenombrarIndex(null);
    setNuevoNombreArchivo("");
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

    if (!descripcion.trim()) {
      showAlert("Error", "La descripción es obligatoria", "error");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      showAlert("Error", "Debes iniciar sesión", "error");
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
      } catch (e) {}

      let pubId = publicacionId || "";
      if (isEditMode && editPublicacionId) {
        pubId = editPublicacionId;
        await updateDoc(doc(db, "publicaciones", editPublicacionId), {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          updatedAt: new Date(),
        });
      } else {
        pubId = await crearPublicacion(
          materiaId,
          user.uid,
          nombreUsuario,
          user.photoURL || null,
          titulo,
          descripcion,
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

          
          if (archivo.id) {
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
                obtenerNombreArchivo(archivo),
                archivo.urlExterna!,
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
                obtenerNombreArchivo(archivo),
                undefined,
                (progreso) => {
                  setArchivos((prev) => {
                    const nuevos = [...prev];
                    nuevos[i] = { ...nuevos[i], progreso };
                    return nuevos;
                  });
                },
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

      if (!isEditMode) {
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
          : "Publicación creada correctamente",
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
        <Appbar.Content title={isEditMode ? "Editar publicación" : "Nueva publicación"} />
        <Appbar.Action icon="check" onPress={publicar} disabled={publicando} />
      </Appbar.Header>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Card style={[styles.card, styles.archivosCard]}>
          <Card.Content style={styles.archivosCardContent}>
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
              label="Descripción *"
              value={descripcion}
              onChangeText={setDescripcion}
              mode="outlined"
              numberOfLines={6}
              style={styles.input}
              disabled={publicando}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.archivosHeader}>
              <Text variant="titleMedium" style={styles.archivosTitle}>
                Archivos adjuntos
              </Text>
              <Button
                mode="contained-tonal"
                icon="paperclip"
                onPress={mostrarDialogoSeleccion}
                disabled={publicando}
                compact
              >
                Adjuntar
              </Button>
            </View>
          </Card.Content>
        </Card>

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
                <Card key={index} style={styles.archivoCard}>
                  <Card.Content style={styles.archivoContent}>
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
                              onPress={() => abrirDialogoRenombrarArchivo(index)}
                              disabled={archivo.subiendo}
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
                              disabled={archivo.subiendo}
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
                      </View>
                    </View>
                  </Card.Content>

                  {archivo.subiendo && (
                    <ProgressBar
                      progress={archivo.progreso / 100}
                      style={styles.progressBar}
                    />
                  )}

                  {archivo.error && (
                    <Card.Content>
                      <Text variant="bodySmall" style={styles.errorText}>
                        {archivo.error}
                      </Text>
                    </Card.Content>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        <Button
          mode="contained"
          onPress={publicar}
          loading={publicando}
          disabled={publicando}
          style={styles.publicarButton}
          icon="send"
        >
          {publicando
            ? isEditMode
              ? "Guardando..."
              : "Publicando..."
            : isEditMode
            ? "Guardar cambios"
            : "Publicar"}
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
              Subir archivo
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
          }}
        >
          <Dialog.Title>Editar nombre del archivo</Dialog.Title>
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
              }}
            >
              Cancelar
            </Button>
            <Button onPress={guardarNombreArchivo}>Guardar</Button>
          </Dialog.Actions>
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
