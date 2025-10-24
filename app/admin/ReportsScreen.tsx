import { useTheme } from "@/contexts/ThemeContext";
import { db } from "@/firebase";
import { obtenerArchivosConTipo } from "@/scripts/services/Publications";
import {
  aplicarStrikeAlAutor,
  banearUsuarioPorNombre,
  completarReportesDePublicacion,
  eliminarPublicacionYArchivos,
  obtenerReportes,
} from "@/scripts/services/Reports";
import { ArchivoPublicacion } from "@/scripts/types/Publication.type";
import { useNavigation } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, Linking, ScrollView, TouchableOpacity, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text,
} from "react-native-paper";
import CustomAlert, { CustomAlertButton, CustomAlertType } from "../../components/ui/CustomAlert";
import { FilterType, Report } from "../../scripts/types/Reports.type";
import { getStyles } from "./ReportsScreen.styles";

export default function ReportsScreen() {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<CustomAlertType>("info");
  const [alertButtons, setAlertButtons] = useState<CustomAlertButton[]>([]);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const [filtroActivo, setFiltroActivo] = useState<FilterType>("pendientes");
  const [modalVisible, setModalVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Report | null>(null);
  const [archivos, setArchivos] = useState<ArchivoPublicacion[]>([]);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);
  const [reportes, setReportes] = useState<Report[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    const unsubscribe = onSnapshot(collection(db, "reportes"), async () => {
      const datos = await obtenerReportes();
      setReportes(datos);
      setCargando(false);
    });
    obtenerReportes().then(datos => {
      setReportes(datos);
      setCargando(false);
    });
    return () => unsubscribe();
  }, []);

  const reportesFiltrados = reportes
    .filter((reporte) => {
      if (filtroActivo === "pendientes") return reporte.estado === "pendiente";
      if (filtroActivo === "completados") return reporte.estado === "completado";
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.ultimaFecha.split("/").reverse().join("-"));
      const dateB = new Date(b.ultimaFecha.split("/").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });

  const getDecisionLabel = (r: Report) => {
    const text = (r.decision || "").toLowerCase();
    if (text.includes("bane") || text.includes("usuario baneado") || text.includes("baneado"))
      return "BAN";
    if (text.includes("elimin") || text.includes("eliminada")) return "Eliminado";
    if (text.includes("descart") || text.includes("descartado") || text.includes("rechaz"))
      return "Rechazado";
    return "Resuelto";
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setReporteSeleccionado(null);
    setArchivos([]);
  };

  const abrirDetalles = async (reporte: Report) => {
    setReporteSeleccionado(reporte);
    setModalVisible(true);
    
    // Cargar archivos de la publicación
    setCargandoArchivos(true);
    try {
      const archivosData = await obtenerArchivosConTipo(reporte.publicacionId);
      setArchivos(archivosData);
    } catch (error) {
      console.error("Error al cargar archivos:", error);
      setArchivos([]);
    } finally {
      setCargandoArchivos(false);
    }
  };

  const obtenerIconoPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "file-pdf-box";
    if (tipo.includes("imagen")) return "image";
    if (tipo.includes("video")) return "video";
    if (tipo.includes("zip") || tipo.includes("rar")) return "folder-zip";
    if (tipo.includes("word")) return "file-word";
    if (tipo.includes("excel")) return "file-excel";
    if (tipo.includes("presentación") || tipo.includes("powerpoint")) return "file-powerpoint";
    if (tipo.includes("audio") || tipo.includes("mp3")) return "music";
    if (tipo.includes("texto")) return "file-document-outline";
    if (tipo.includes("enlace")) return "link-variant";
    return "file-document";
  };

  const esArchivoVisualizable = (archivo: ArchivoPublicacion): boolean => {
    if (archivo.esEnlaceExterno) return true;

    const tipo = archivo.tipoNombre.toLowerCase();
    return (
      tipo.includes("pdf") ||
      tipo.includes("imagen") ||
      tipo.includes("video") ||
      tipo.includes("audio") ||
      tipo.includes("word") ||
      tipo.includes("presentación") ||
      tipo.includes("powerpoint") ||
      tipo.includes("texto")
    );
  };

  const abrirArchivo = async (archivo: ArchivoPublicacion) => {
    // Si es enlace externo, abrirlo directamente
    if (archivo.esEnlaceExterno) {
      try {
        const canOpen = await Linking.canOpenURL(archivo.webUrl);
        if (canOpen) {
          await Linking.openURL(archivo.webUrl);
        } else {
          setAlertTitle("Error");
          setAlertMessage("No se puede abrir este enlace");
          setAlertType("error");
          setAlertButtons([{ text: "OK", onPress: () => {} }]);
          setAlertVisible(true);
        }
      } catch (error) {
        console.error("Error al abrir enlace:", error);
        setAlertTitle("Error");
        setAlertMessage("No se pudo abrir el enlace");
        setAlertType("error");
        setAlertButtons([{ text: "OK", onPress: () => {} }]);
        setAlertVisible(true);
      }
      return;
    }

    // Si es visualizable, abrir en FileGallery
    if (esArchivoVisualizable(archivo)) {
      const indice = archivos.findIndex((a) => a.id === archivo.id);

      const archivosSerializados = archivos.map((a) => ({
        ...a,
        fechaSubida:
          a.fechaSubida instanceof Date
            ? a.fechaSubida.toISOString()
            : a.fechaSubida,
      }));

      // Cerrar modal antes de navegar
      setModalVisible(false);

      (navigation.navigate as any)("FileGallery", {
        archivos: archivosSerializados,
        indiceInicial: indice,
        materiaNombre: "Denuncia",
      });
    } else {
      setAlertTitle("No visualizable");
      setAlertMessage("Este tipo de archivo no se puede previsualizar en la galería");
      setAlertType("warning");
      setAlertButtons([{ text: "OK", onPress: () => {} }]);
      setAlertVisible(true);
    }
  };

  const renderArchivoPreview = (archivo: ArchivoPublicacion) => {
    const tipo = archivo.tipoNombre.toLowerCase();

    if (archivo.esEnlaceExterno) {
      return (
        <View style={styles.miniPreviewContainer}>
          <IconButton
            icon="link-variant"
            size={32}
            iconColor={theme.colors.primary}
            style={{ margin: 0 }}
          />
        </View>
      );
    }

    if (tipo.includes("imagen")) {
      return (
        <Image
          source={{ uri: archivo.webUrl }}
          style={styles.miniPreviewImage}
          resizeMode="cover"
        />
      );
    }

    if (tipo.includes("video")) {
      return (
        <View style={styles.miniPreviewContainer}>
          <Image
            source={{ uri: archivo.webUrl }}
            style={styles.miniPreviewImage}
            resizeMode="cover"
          />
          <View style={styles.videoOverlay}>
            <IconButton
              icon="play-circle"
              size={24}
              iconColor="rgba(255,255,255,0.95)"
              style={{ margin: 0 }}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.miniPreviewContainer}>
        <IconButton
          icon={obtenerIconoPorTipo(archivo.tipoNombre || "")}
          size={32}
          iconColor={theme.colors.primary}
          style={{ margin: 0 }}
        />
      </View>
    );
  };

  const quitarReporte = async () => {
    if (!reporteSeleccionado) return;
    setAlertTitle("Quitar Reporte");
    setAlertMessage("¿Confirmar que la publicación está en orden y no viola las normas?");
    setAlertType("confirm");
    setAlertButtons([
      {
        text: "Cancelar",
        onPress: () => {},
        mode: "outlined",
      },
      {
        text: "Confirmar",
        onPress: async () => {
          try {
            const fecha = await completarReportesDePublicacion(
              reporteSeleccionado.publicacionId,
              "Denuncia descartada - publicación en orden"
            );
            const fechaStr = fecha.toLocaleDateString();
            setReportes((prev) =>
              prev.map((r) =>
                r.publicacionId === reporteSeleccionado.publicacionId
                  ? {
                      ...r,
                      estado: "completado",
                      decision: "Denuncia descartada - publicación en orden",
                      fechaDecision: fechaStr,
                    }
                  : r
              )
            );
            cerrarModal();
            setAlertTitle("Éxito");
            setAlertMessage("Reporte descartado correctamente");
            setAlertType("success");
            setAlertButtons([{ text: "OK", onPress: () => {} }]);
            setAlertVisible(true);
          } catch (error) {
            console.error("Error al quitar reporte:", error);
            setAlertTitle("Error");
            setAlertMessage("No se pudo descartar el reporte");
            setAlertType("error");
            setAlertButtons([{ text: "OK", onPress: () => {} }]);
            setAlertVisible(true);
          }
        },
        mode: "contained",
      },
    ]);
    setAlertVisible(true);
  };

  const eliminarPublicacion = async () => {
    if (!reporteSeleccionado) return;
    setAlertTitle("Eliminar Publicación");
    setAlertMessage("Se eliminará la publicación, sus archivos y se aplicará un strike al autor. ¿Continuar?");
    setAlertType("warning");
    setAlertButtons([
      {
        text: "Cancelar",
        onPress: () => {},
        mode: "outlined",
      },
      {
        text: "Eliminar",
        onPress: async () => {
          try {
            // Eliminar publicación y archivos
            await eliminarPublicacionYArchivos(reporteSeleccionado.publicacionId);
            // Aplicar strike al autor
            await aplicarStrikeAlAutor(reporteSeleccionado.autorUid);
            // Completar reportes
            const fecha = await completarReportesDePublicacion(
              reporteSeleccionado.publicacionId,
              "Publicación eliminada y strike aplicado al autor"
            );
            const fechaStr = fecha.toLocaleDateString();
            setReportes((prev) =>
              prev.map((r) =>
                r.publicacionId === reporteSeleccionado.publicacionId
                  ? {
                      ...r,
                      estado: "completado",
                      strikesAutor: (r.strikesAutor || 0) + 1,
                      decision: "Publicación eliminada y strike aplicado al autor",
                      fechaDecision: fechaStr,
                    }
                  : r
              )
            );
            cerrarModal();
            setAlertTitle("Éxito");
            setAlertMessage("Publicación eliminada y strike aplicado");
            setAlertType("success");
            setAlertButtons([{ text: "OK", onPress: () => {} }]);
            setAlertVisible(true);
          } catch (error) {
            console.error("Error al eliminar publicación:", error);
            setAlertTitle("Error");
            setAlertMessage("No se pudo eliminar la publicación");
            setAlertType("error");
            setAlertButtons([{ text: "OK", onPress: () => {} }]);
            setAlertVisible(true);
          }
        },
        mode: "contained",
        color: theme.colors.error,
      },
    ]);
    setAlertVisible(true);
  };

  const banearUsuario = async () => {
    if (!reporteSeleccionado) return;
    setAlertTitle("Banear Usuario");
    setAlertMessage(`¿Confirmar baneo permanente de ${reporteSeleccionado.autor}? Esta acción es irreversible.`);
    setAlertType("error");
    setAlertButtons([
      {
        text: "Cancelar",
        onPress: () => {},
        mode: "outlined",
      },
      {
        text: "Banear",
        onPress: async () => {
          try {
            // Banear usuario
            await banearUsuarioPorNombre(reporteSeleccionado.autor);
            // Eliminar publicación y archivos
            await eliminarPublicacionYArchivos(reporteSeleccionado.publicacionId);
            // Completar reportes
            const fecha = await completarReportesDePublicacion(
              reporteSeleccionado.publicacionId,
              "Usuario baneado del sistema"
            );
            const fechaStr = fecha.toLocaleDateString();
            setReportes((prev) =>
              prev.map((r) =>
                r.publicacionId === reporteSeleccionado.publicacionId
                  ? {
                      ...r,
                      estado: "completado",
                      decision: "Usuario baneado del sistema",
                      fechaDecision: fechaStr,
                    }
                  : r
              )
            );
            cerrarModal();
            setAlertTitle("Éxito");
            setAlertMessage("Usuario baneado del sistema");
            setAlertType("success");
            setAlertButtons([{ text: "OK", onPress: () => {} }]);
            setAlertVisible(true);
          } catch (error) {
            console.error("Error al banear usuario:", error);
            setAlertTitle("Error");
            setAlertMessage("No se pudo banear al usuario");
            setAlertType("error");
            setAlertButtons([{ text: "OK", onPress: () => {} }]);
            setAlertVisible(true);
          }
        },
        mode: "contained",
        color: theme.colors.error,
      },
    ]);
    setAlertVisible(true);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Denuncias" />
      </Appbar.Header>

      <View style={styles.filterContainer}>
        <Button
          mode={filtroActivo === "pendientes" ? "contained" : "outlined"}
          onPress={() => setFiltroActivo("pendientes")}
          style={styles.filterButton}
          compact
        >
          Pendientes
        </Button>
        <Button
          mode={filtroActivo === "completados" ? "contained" : "outlined"}
          onPress={() => setFiltroActivo("completados")}
          style={styles.filterButton}
          compact
        >
          Completados
        </Button>
        <Button
          mode={filtroActivo === "todos" ? "contained" : "outlined"}
          onPress={() => setFiltroActivo("todos")}
          style={styles.filterButton}
          compact
        >
          Todos
        </Button>
      </View>

      <ScrollView style={styles.content}>
        {cargando ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge" style={styles.emptyText}>
              Cargando reportes...
            </Text>
          </View>
        ) : reportesFiltrados.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text variant="headlineSmall" style={styles.emptyText}>
              ¡No hay denuncias!
            </Text>
            <Text variant="bodyLarge" style={styles.emptyText}>
              No hay denuncias {filtroActivo}
            </Text>
          </View>
        ) : (
          reportesFiltrados.map((reporte) => (
            <Card
              key={reporte.id}
              style={styles.card}
              onPress={() => abrirDetalles(reporte)}
            >
              <Card.Content>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {reporte.titulo}
                </Text>
                <Text variant="bodySmall" style={styles.cardAuthor}>
                  Por {reporte.autor}
                </Text>
                <Text variant="bodySmall" style={styles.cardDate}>
                  {reporte.ultimaFecha}
                </Text>

                <View style={styles.chipContainer}>
                  <Chip icon="flag" compact style={styles.leftChip}>
                    {reporte.ultimoMotivo}
                  </Chip>

                  {reporte.estado === "completado" ? (
                    <Chip compact style={styles.rightChip}>
                      {getDecisionLabel(reporte)}
                    </Chip>
                  ) : (
                    <Chip icon="alert-circle" compact>
                      {reporte.totalReportes}{" "}
                      {reporte.totalReportes === 1 ? "reporte" : "reportes"}
                    </Chip>
                  )}
                </View>
              </Card.Content>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Modal de Detalles */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={cerrarModal}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {reporteSeleccionado && (
              <>
                <Text variant="headlineSmall" style={styles.modalTitle}>
                  Detalles del Reporte
                </Text>
                <Divider style={styles.divider} />

                {/* Publicación */}
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <Text variant="titleLarge" style={styles.publicacionTitulo}>
                      {reporteSeleccionado.titulo}
                    </Text>
                    <Text variant="bodyMedium" style={styles.publicacionAutor}>
                      Autor: {reporteSeleccionado.autor}
                    </Text>
                  </Card.Content>
                </Card>

                {/* Archivos Adjuntos */}
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Archivos adjuntos ({archivos.length})
                    </Text>
                    <Divider style={styles.divider} />

                    {cargandoArchivos ? (
                      <View style={styles.archivosLoadingContainer}>
                        <ActivityIndicator size="small" />
                        <Text variant="bodySmall" style={styles.archivosLoadingText}>
                          Cargando archivos...
                        </Text>
                      </View>
                    ) : archivos.length === 0 ? (
                      <Text variant="bodyMedium" style={styles.noArchivosText}>
                        Sin archivos adjuntos
                      </Text>
                    ) : (
                      <View style={styles.archivosGrid}>
                        {archivos.map((archivo) => (
                          <TouchableOpacity
                            key={archivo.id}
                            style={styles.miniArchivoCard}
                            onPress={() => abrirArchivo(archivo)}
                            activeOpacity={0.7}
                          >
                            <View style={styles.miniArchivoPreview}>
                              {renderArchivoPreview(archivo)}
                            </View>
                            <View style={styles.miniArchivoInfo}>
                              <IconButton
                                icon={obtenerIconoPorTipo(archivo.tipoNombre || "")}
                                size={16}
                                iconColor={theme.colors.primary}
                                style={{ margin: 0, marginRight: 4 }}
                              />
                              <Text
                                variant="bodySmall"
                                style={styles.miniArchivoTitulo}
                                numberOfLines={2}
                              >
                                {archivo.titulo}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </Card.Content>
                </Card>

                {/* Decisión Tomada */}
                {reporteSeleccionado.estado === "completado" && (
                  <Card style={styles.modalCard}>
                    <Card.Content>
                      <Text variant="titleMedium" style={styles.sectionTitle}>
                        {getDecisionLabel(reporteSeleccionado)}
                      </Text>
                      {reporteSeleccionado.fechaDecision && (
                        <Text variant="bodySmall" style={styles.subtitle}>
                          {reporteSeleccionado.fechaDecision}
                        </Text>
                      )}
                    </Card.Content>
                  </Card>
                )}

                {/* Información de la denuncia */}
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Información del Reporte
                    </Text>
                    <Divider style={styles.divider} />
                  </Card.Content>

                  <List.Item
                    title="Total de reportes"
                    right={() => <Chip compact>{reporteSeleccionado.totalReportes}</Chip>}
                  />
                  <Divider />

                  <List.Item
                    title="Motivo"
                    right={() => <Chip compact>{reporteSeleccionado.ultimoMotivo}</Chip>}
                  />
                  <Divider />

                  <List.Item
                    title="Última fecha"
                    description={reporteSeleccionado.ultimaFecha}
                  />
                  <Divider />

                  <List.Item
                    title="Strikes del autor"
                    right={() => <Chip compact>{reporteSeleccionado.strikesAutor}</Chip>}
                  />
                </Card>

                {/* Denunciantes */}
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      {reporteSeleccionado.reportadores.length === 1
                        ? "Denunciante"
                        : `Denunciantes (${reporteSeleccionado.reportadores.length})`}
                    </Text>
                    <Divider style={styles.divider} />
                  </Card.Content>

                  {reporteSeleccionado.reportadores.slice(0, 5).map((rep, index, array) => (
                    <View key={index}>
                      <List.Item
                        title={rep.usuario}
                        description={`${rep.motivo} • ${rep.fecha}`}
                        left={(props) => <List.Icon {...props} icon="account-circle" />}
                      />
                      {index < array.length - 1 && <Divider />}
                    </View>
                  ))}

                  {reporteSeleccionado.reportadores.length > 5 && (
                    <Card.Content>
                      <Text variant="bodySmall" style={styles.masReportadores}>
                        +{reporteSeleccionado.reportadores.length - 5} denunciante
                        {reporteSeleccionado.reportadores.length - 5 !== 1 ? "s" : ""} más
                      </Text>
                    </Card.Content>
                  )}
                </Card>

                {/* Administración */}
                {reporteSeleccionado.estado !== "completado" && (
                  <View style={styles.accionesContainer}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Administración
                    </Text>

                    <Button
                      mode="contained"
                      icon="check-circle"
                      onPress={quitarReporte}
                      style={styles.actionButton}
                    >
                      Quitar Reporte
                    </Button>
                    
                    <Button
                      mode="contained-tonal"
                      icon="delete"
                      onPress={eliminarPublicacion}
                      style={styles.actionButton}
                    >
                      Eliminar Publicación + Strike
                    </Button>

                    <Button
                      mode="outlined"
                      icon="cancel"
                      onPress={banearUsuario}
                      disabled={reporteSeleccionado.strikesAutor < 2}
                      style={styles.actionButton}
                    >
                      Banear Usuario del Sistema
                    </Button>
                    <Text variant="bodySmall" style={styles.buttonSubtext}>
                      {reporteSeleccionado.strikesAutor < 2
                        ? "Se requieren al menos 2 strikes"
                        : "No podrá volver a acceder al sistema"}
                    </Text>
                  </View>
                )}

                <Button mode="text" onPress={cerrarModal} style={styles.closeButton}>
                  Cerrar
                </Button>
              </>
            )}
          </ScrollView>
        </Modal>
        <CustomAlert
          visible={alertVisible}
          onDismiss={() => setAlertVisible(false)}
          title={alertTitle}
          message={alertMessage}
          type={alertType}
          buttons={alertButtons}
        />
      </Portal>
    </View>
  );
}