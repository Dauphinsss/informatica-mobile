import { useTheme } from "@/contexts/ThemeContext";
import {
  eliminarArchivo,
  obtenerTiposArchivo,
  seleccionarArchivo,
  subirArchivo,
  guardarEnlaceExterno,
} from "@/scripts/services/Files";
import { crearPublicacion } from "@/scripts/services/Publications";
import { TipoArchivo } from "@/scripts/types/Files.type";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import { getAuth } from "firebase/auth";
import React, { useEffect, useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Dialog,
  IconButton,
  Portal,
  ProgressBar,
  Text,
  TextInput,
} from "react-native-paper";
import { getStyles } from "./_CreatePublicationScreen.styles";
import { notificarUsuariosMateria } from "../../services/notifications";

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
}

export default function CreatePublicationScreen() {
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const navigation = useNavigation();
  const route = useRoute();
  const auth = getAuth();

  const params = route.params as {
    materiaId?: string;
    materiaNombre?: string;
  };

  const materiaId = params?.materiaId || "";
  const materiaNombre = params?.materiaNombre || "Materia";

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [archivos, setArchivos] = useState<ArchivoTemp[]>([]);
  const [tipos, setTipos] = useState<TipoArchivo[]>([]);
  const [publicando, setPublicando] = useState(false);
  const [publicacionId, setPublicacionId] = useState<string | null>(null);
  const [dialogEnlaceVisible, setDialogEnlaceVisible] = useState(false);
  const [urlEnlace, setUrlEnlace] = useState("");
  const [nombreEnlace, setNombreEnlace] = useState("");
  const [dialogSeleccionVisible, setDialogSeleccionVisible] = useState(false);

  useEffect(() => {
    cargarTiposArchivo();
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
    if (tipo.includes("presentación") || tipo.includes("ppt")) return "file-powerpoint";
    if (tipo.includes("audio") || tipo.includes("mp3")) return "music";
    if (tipo.includes("texto")) return "file-document-outline";
    if (tipo.includes("enlace")) return "link-variant";
    return "file-document";
  };

  const detectarTipoArchivo = (
    mimeType: string,
    nombre: string
  ): string | null => {
    console.log("- mimeType:", mimeType);
    console.log("- nombre:", nombre);

    // Buscar por mimetype
    for (const tipo of tipos) {
      if (tipo.mimetype.some((mime) => mimeType && mimeType.includes(mime))) {
        console.log("Tipo encontrado por mimetype:", tipo.nombre);
        return tipo.id;
      }
    }

    // Buscar por extensión
    const extension = "." + nombre.split(".").pop()?.toLowerCase();
    console.log("- extensión:", extension);

    for (const tipo of tipos) {
      if (tipo.extensiones.includes(extension)) {
        console.log("Tipo encontrado por extensión:", tipo.nombre);
        return tipo.id;
      }
    }

    console.log("No se encontró tipo compatible");
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
        Alert.alert(
          "Tipo no soportado",
          "El tipo de archivo seleccionado no está soportado."
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
      Alert.alert("Error", "No se pudo agregar el archivo");
    }
  };

  const mostrarDialogoEnlace = () => {
    setDialogSeleccionVisible(false);
    setDialogEnlaceVisible(true);
  };

  const agregarEnlace = () => {
    if (!urlEnlace.trim()) {
      Alert.alert("Error", "La URL es obligatoria");
      return;
    }

    if (!nombreEnlace.trim()) {
      Alert.alert("Error", "El nombre del enlace es obligatorio");
      return;
    }

    try {
      new URL(urlEnlace);
    } catch {
      Alert.alert("Error", "La URL no es válida. Debe incluir http:// o https://");
      return;
    }

    const tipoEnlace = tipos.find((t) => t.nombre.toLowerCase() === "enlace");
    
    if (!tipoEnlace) {
      Alert.alert("Error", "No se encontró el tipo de archivo 'Enlace' en la base de datos");
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

  const eliminarArchivoLocal = async (index: number) => {
    const archivo = archivos[index];

    // Si ya está subido, eliminarlo de Firebase
    if (archivo.id && publicacionId) {
      try {
        await eliminarArchivo(archivo.id);
      } catch (error) {
        console.error("Error al eliminar archivo:", error);
      }
    }

    setArchivos((prev) => prev.filter((_, i) => i !== index));
  };

  const publicar = async () => {
    if (!titulo.trim()) {
      Alert.alert("Error", "El título es obligatorio");
      return;
    }

    if (!descripcion.trim()) {
      Alert.alert("Error", "La descripción es obligatoria");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "Debes iniciar sesión");
      return;
    }

    setPublicando(true);

    try {
      // 1. Crear publicación
      console.log("Creando publicación...");
      const nombreUsuario = user.displayName || user.email || "Usuario";
      const pubId = await crearPublicacion(
        materiaId,
        user.uid,
        nombreUsuario,
        user.photoURL || null,
        titulo,
        descripcion
      );
      console.log("Publicación creada con ID:", pubId);

      setPublicacionId(pubId);

      // 2. Subir archivos pendientes
      if (archivos.length > 0) {
        console.log(`Subiendo ${archivos.length} archivos...`);

        for (let i = 0; i < archivos.length; i++) {
          const archivo = archivos[i];

          // Si ya está subido, saltar
          if (archivo.id) {
            console.log(`Archivo ${i} ya está subido`);
            continue;
          }

          // Marcar como subiendo
          setArchivos((prev) => {
            const nuevos = [...prev];
            nuevos[i] = { ...nuevos[i], subiendo: true };
            return nuevos;
          });

          try {
            // Si es un enlace externo
            if (archivo.esEnlaceExterno) {
              console.log(`Guardando enlace ${i}: ${archivo.nombreEnlace}`);
              
              const resultado = await guardarEnlaceExterno(
                pubId,
                archivo.tipoArchivoId,
                archivo.nombreEnlace!,
                archivo.urlExterna!
              );

              console.log(`Enlace ${i} guardado exitosamente con ID:`, resultado.id);

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
            // Si es un archivo normal
            else {
              console.log(`Subiendo archivo ${i}: ${archivo.asset!.name}`);
              
              const resultado = await subirArchivo(
                pubId,
                archivo.asset!,
                archivo.tipoArchivoId,
                archivo.asset!.name,
                undefined,
                (progreso) => {
                  console.log(`Progreso archivo ${i}: ${progreso.toFixed(0)}%`);
                  setArchivos((prev) => {
                    const nuevos = [...prev];
                    nuevos[i] = { ...nuevos[i], progreso };
                    return nuevos;
                  });
                }
              );

              console.log(`Archivo ${i} subido exitosamente con ID:`, resultado.id);

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

            Alert.alert(
              "Error al subir archivo",
              `No se pudo subir "${nombreElemento}": ${mensajeError}\n\nLos demás elementos continuarán procesándose.`
            );
          }
        }
      }

      try {
        console.log("Enviando notificaciones a estudiantes...");
        await notificarUsuariosMateria(
          materiaId,
          materiaNombre,
          "Nueva publicación",
          `${nombreUsuario} publicó: ${titulo}`,
          "info",
          "newspaper",
          pubId
        );
        console.log("Notificaciones enviadas");
      } catch (notifError) {
        console.error("Error al enviar notificaciones:", notifError);
      }

      console.log("Publicación completada exitosamente");
      Alert.alert("Éxito", "Publicación creada correctamente", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Error al publicar:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      Alert.alert("Error", `No se pudo crear la publicación: ${errorMessage}`);
    } finally {
      setPublicando(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Nueva publicación" />
        <Appbar.Action icon="check" onPress={publicar} disabled={publicando} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
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
              multiline
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

            {archivos.length === 0 ? (
              <Text variant="bodyMedium" style={styles.noArchivos}>
                No hay archivos adjuntos
              </Text>
            ) : (
              archivos.map((archivo, index) => {
                const tipo = tipos.find((t) => t.id === archivo.tipoArchivoId);
                const nombreMostrar = archivo.esEnlaceExterno
                  ? archivo.nombreEnlace
                  : archivo.asset?.name;

                return (
                  <Card key={index} style={styles.archivoCard}>
                    <Card.Content style={styles.archivoContent}>
                      <View style={styles.archivoInfo}>
                        <IconButton
                          icon={obtenerIconoPorTipo(tipo?.nombre || "")}
                          size={32}
                          style={styles.archivoIcon}
                        />
                        <View style={styles.archivoTexto}>
                          <Text
                            variant="bodyMedium"
                            style={styles.archivoNombre}
                            numberOfLines={2}
                          >
                            {nombreMostrar}
                          </Text>
                          <View style={styles.archivoMeta}>
                            <Chip
                              compact
                              style={styles.tipoChip}
                              textStyle={{ fontSize: 12 }}
                            >
                              {tipo?.nombre || "Archivo"}
                            </Chip>
                            {!archivo.esEnlaceExterno && (
                              <Text
                                variant="bodySmall"
                                style={styles.archivoTamano}
                              >
                                {formatearTamano(archivo.asset?.size || 0)}
                              </Text>
                            )}
                            {archivo.esEnlaceExterno && (
                              <Text
                                variant="bodySmall"
                                style={styles.archivoTamano}
                                numberOfLines={1}
                              >
                                {archivo.urlExterna}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                      <IconButton
                        icon="close"
                        size={20}
                        onPress={() => eliminarArchivoLocal(index)}
                        disabled={archivo.subiendo}
                        style={{ margin: 0 }}
                      />
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
              })
            )}
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={publicar}
          loading={publicando}
          disabled={publicando}
          style={styles.publicarButton}
          icon="send"
        >
          {publicando ? "Publicando..." : "Publicar"}
        </Button>
      </ScrollView>

      {/* Diálogo de selección: Archivo o Enlace */}
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

      {/* Diálogo para agregar enlace */}
      <Portal>
        <Dialog
          visible={dialogEnlaceVisible}
          onDismiss={() => setDialogEnlaceVisible(false)}
        >
          <Dialog.Title>Agregar enlace</Dialog.Title>
          <Dialog.Content>
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogEnlaceVisible(false)}>
              Cancelar
            </Button>
            <Button onPress={agregarEnlace}>Agregar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}