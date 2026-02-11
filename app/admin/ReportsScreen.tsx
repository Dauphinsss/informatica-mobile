import CommentsModalReadOnly from "@/app/components/comments/CommentsModalReadOnly";
import { useTheme } from "@/contexts/ThemeContext";
import { auth } from "@/firebase";
import { obtenerArchivosConTipo } from "@/scripts/services/Publications";
import {
  aplicarStrikeAlAutor,
  banearUsuarioPorNombre,
  completarReportesDePublicacion,
  eliminarPublicacionYArchivos,
  escucharReportes,
} from "@/scripts/services/Reports";
import { ArchivoPublicacion } from "@/scripts/types/Publication.type";
import { registrarActividadCliente } from "@/services/activity.service";
import { comentariosService } from "@/services/comments.service";
import { openRemoteFileExternally } from "@/services/openExternalFile.service";
import {
  notificarDecisionAdminAutor,
  notificarDecisionAdminDenunciantes,
} from "@/services/notifications";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  Linking,
  ScrollView,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Appbar,
  Button,
  Card,
  Chip,
  Divider,
  IconButton,
  List,
  Modal,
  Portal,
  Text
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import CustomAlert, {
  CustomAlertButton,
  CustomAlertType,
} from "../../components/ui/CustomAlert";
import ReportReasonModal from "../../components/ui/ReportReasonModal";
import { FilterType, Report } from "../../scripts/types/Reports.type";
import { getStyles } from "./ReportsScreen.styles";
import {
  ReportDetailSkeleton,
  ReportsListSkeleton
} from './ReportsSkeleton';
type ReportCardProps = {
  reporte: Report;
  onPress: (reporte: Report) => void;
  styles: any;
  theme: any;
  getDecisionLabel: (r: Report) => string;
};

const ReportCard = React.memo(function ReportCard({
  reporte,
  onPress,
  styles,
  theme,
  getDecisionLabel,
}: ReportCardProps) {
  return (
    <Card key={reporte.id} style={styles.card} onPress={() => onPress(reporte)}>
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
  );
});

export default function ReportsScreen() {
  const [modalMotivoVisible, setModalMotivoVisible] = useState(false);
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState<string>("");
  const [savedMotivo, setSavedMotivo] = useState<string>("");
  const accionPendiente = useRef<null | ((motivo: string) => Promise<void>)>(
    null
  );
  const [tipoAccionMotivo, setTipoAccionMotivo] = useState<
    "quitar" | "strike" | "ban"
  >("quitar");
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState<string | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState<CustomAlertType>("info");
  const [alertButtons, setAlertButtons] = useState<CustomAlertButton[]>([]);
  const navigation = useNavigation();
  const { theme } = useTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const [filtroActivo, setFiltroActivo] = useState<FilterType>("pendientes");
  const [modalVisible, setModalVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Report | null>(
    null
  );
  const [archivos, setArchivos] = useState<ArchivoPublicacion[]>([]);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);
  const [reportes, setReportes] = useState<Report[]>([]);
  const [cargando, setCargando] = useState(true);
  const deviceWidth = Dimensions.get("window").width;
  const modalWidth = Math.min(400, deviceWidth * 0.9);
  const [comentariosDesplegados, setComentariosDesplegados] = useState(false);
  const [numeroComentarios, setNumeroComentarios] = useState(0);
  const [comentarios, setComentarios] = useState<any[]>([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);
  const MOTIVOS_POR_ACCION = {
    quitar: [
      "No infringe las normas",
      "Contenido adecuado",
      "Reporte infundado",
      "No se encontró problema",
      "Otra razón...",
    ],
    strike: [
      "Incumplimiento de normas",
      "Contenido inapropiado",
      "Spam o publicidad",
      "Acoso o lenguaje ofensivo",
      "Publicación duplicada",
      "Otra razón...",
    ],
    ban: [
      "Spam masivo",
      "Reincidencia grave",
      "Acoso reiterado",
      "Falsificación de identidad",
      "Violación grave de normas",
      "Otra razón...",
    ],
  };

  useEffect(() => {
    setCargando(true);
    const unsubscribe = escucharReportes((datos) => {
      setReportes(datos);
      setCargando(false);
    });
    return () => {
      if (typeof unsubscribe === "function") unsubscribe();
    };
  }, []);

  const reportesFiltrados = useMemo(() => {
    return reportes
      .filter((reporte) => {
        if (filtroActivo === "pendientes")
          return reporte.estado === "pendiente";
        if (filtroActivo === "completados")
          return reporte.estado === "completado";
        return true;
      })
      .sort((a, b) => {
        if (!a.ultimaFechaTimestamp) return 1;
        if (!b.ultimaFechaTimestamp) return -1;
        return b.ultimaFechaTimestamp - a.ultimaFechaTimestamp;
      });
  }, [reportes, filtroActivo]);

  const getDecisionLabel = (r: Report) => {
    const text = (r.decision || "").toLowerCase();
    if (
      text.includes("bane") ||
      text.includes("usuario baneado") ||
      text.includes("baneado")
    )
      return "BAN";
    if (text.includes("elimin") || text.includes("eliminada"))
      return "Eliminado";
    if (
      text.includes("descart") ||
      text.includes("descartado") ||
      text.includes("rechaz")
    )
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
    setComentariosDesplegados(false);
    setComentarios([]); // Limpiar comentarios anteriores

    setCargandoArchivos(true);
    try {
      const archivosData = await obtenerArchivosConTipo(reporte.publicacionId);
      setArchivos(archivosData);
      const comentarios =
        await comentariosService.obtenerComentariosPorPublicacion(
          reporte.publicacionId
        );
      setNumeroComentarios(comentarios.length);
    } catch (error) {
      console.error("Error al cargar archivos:", error);
      setArchivos([]);
    } finally {
      setCargandoArchivos(false);
    }
  };
  const cargarComentarios = async () => {
    if (!reporteSeleccionado || comentarios.length > 0) return;

    setCargandoComentarios(true);
    try {
      const comentariosData =
        await comentariosService.obtenerComentariosPorPublicacion(
          reporteSeleccionado.publicacionId
        );
      setComentarios(comentariosData);
    } catch (error) {
      console.error("Error cargando comentarios:", error);
      setComentarios([]);
    } finally {
      setCargandoComentarios(false);
    }
  };
  const formatearFechaComentario = (fecha: Date) => {
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHrs / 24);

    if (diffMin < 1) return "Ahora";
    if (diffMin < 60) return `hace ${diffMin}m`;
    if (diffHrs < 24) return `hace ${diffHrs}h`;
    if (diffDias < 7) return `hace ${diffDias}d`;
    return fecha.toLocaleDateString("es-BO");
  };
  const truncarNombreComentario = (nombreCompleto: string): string => {
    if (!nombreCompleto) return "Usuario";
    if (nombreCompleto.length <= 20) return nombreCompleto;

    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) {
      return nombreCompleto.length > 20
        ? nombreCompleto.substring(0, 17) + "..."
        : nombreCompleto;
    }

    const nombre = partes[0];
    const primerApellido = partes[1];
    const nombreCorto = `${nombre} ${primerApellido}`;

    if (nombreCorto.length <= 20) return nombreCorto;
    if (nombre.length <= 20) return nombre;

    return nombre.length > 20 ? nombre.substring(0, 17) + "..." : nombre;
  };

  const obtenerIconoPorTipo = (tipoNombre: string): string => {
    const tipo = tipoNombre.toLowerCase();
    if (tipo.includes("pdf")) return "file-pdf-box";
    if (tipo.includes("imagen")) return "image";
    if (tipo.includes("video")) return "video";
    if (tipo.includes("zip") || tipo.includes("rar")) return "folder-zip";
    if (tipo.includes("word")) return "file-word";
    if (tipo.includes("excel")) return "file-excel";
    if (tipo.includes("presentación") || tipo.includes("powerpoint"))
      return "file-powerpoint";
    if (tipo.includes("audio") || tipo.includes("mp3")) return "music";
    if (tipo.includes("texto")) return "file-document-outline";
    if (tipo.includes("enlace")) return "link-variant";
    return "file-document";
  };

  const esArchivoVisualizable = (archivo: ArchivoPublicacion): boolean => {
    if (archivo.esEnlaceExterno) return true;

    const tipo = archivo.tipoNombre.toLowerCase();
    return (
      tipo.includes("imagen") ||
      tipo.includes("video") ||
      tipo.includes("audio")
    );
  };

  const esDocumentoAbribleExterno = (archivo: ArchivoPublicacion): boolean => {
    if (archivo.esEnlaceExterno) return false;

    const tipo = archivo.tipoNombre.toLowerCase();
    return (
      tipo.includes("pdf") ||
      tipo.includes("word") ||
      tipo.includes("excel") ||
      tipo.includes("presentación") ||
      tipo.includes("powerpoint") ||
      tipo.includes("texto") ||
      tipo.includes("zip") ||
      tipo.includes("rar")
    );
  };

  const abrirArchivo = async (archivo: ArchivoPublicacion) => {
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

    if (esDocumentoAbribleExterno(archivo)) {
      try {
        setAlertTitle(undefined);
        setAlertMessage("Preparando archivo...");
        setAlertType("info");
        setAlertButtons([]);
        setAlertVisible(true);

        await openRemoteFileExternally({
          url: archivo.webUrl,
          titulo: archivo.titulo,
          tipoNombre: archivo.tipoNombre,
        });

        setAlertVisible(false);
      } catch (error) {
        console.error("Error al abrir documento:", error);
        setAlertVisible(false);
        setAlertTitle("Error");
        setAlertMessage("No se pudo abrir el archivo");
        setAlertType("error");
        setAlertButtons([{ text: "OK", onPress: () => {} }]);
        setAlertVisible(true);
      }
      return;
    }

    if (esArchivoVisualizable(archivo)) {
      const indice = archivos.findIndex((a) => a.id === archivo.id);

      const archivosSerializados = archivos.map((a) => ({
        ...a,
        fechaSubida:
          a.fechaSubida instanceof Date
            ? a.fechaSubida.toISOString()
            : a.fechaSubida,
      }));

      setModalVisible(false);

      (navigation.navigate as any)("FileGallery", {
        archivos: archivosSerializados,
        indiceInicial: indice,
        materiaNombre: "Denuncia",
      });
    } else {
      setAlertTitle("No visualizable");
      setAlertMessage(
        "Este tipo de archivo no se puede previsualizar en la galería"
      );
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

  const pedirMotivoYContinuar = (
    accion: (motivo: string) => Promise<void>,
    tipo: "quitar" | "strike" | "ban" = "quitar"
  ) => {
    accionPendiente.current = accion;
    setTipoAccionMotivo(tipo);
    setMotivoSeleccionado("");
    setMotivoPersonalizado("");
    setModalMotivoVisible(true);
  };

  const confirmarMotivoYAccion = async () => {
    setModalMotivoVisible(false);
    if (accionPendiente.current) {
      const motivo =
        motivoSeleccionado === "Otra razón..."
          ? motivoPersonalizado
          : motivoSeleccionado;
      await accionPendiente.current(motivo);
      accionPendiente.current = null;
    }
  };

  const quitarReporte = () => {
    pedirMotivoYContinuar(async (motivoArg) => {
      if (!reporteSeleccionado) return;
      try {
        const motivo =
          motivoArg && motivoArg.trim().length > 0
            ? motivoArg
            : "Sin motivo especificado";
        const fecha = await completarReportesDePublicacion(
          reporteSeleccionado.publicacionId,
          "Reporte descartado",
          motivo
        );
        
        await registrarActividadCliente(
          'publicacion_aprobada',
          'Publicación aprobada por administrador',
          `La publicación "${reporteSeleccionado.titulo}" de ${reporteSeleccionado.autor} fue aprobada: ${motivo}`,
          auth.currentUser?.uid,
          auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',
          reporteSeleccionado.publicacionId,
          {
            publicacionTitulo: reporteSeleccionado.titulo,
            autorNombre: reporteSeleccionado.autor,
            motivo,
            decision: 'Reporte descartado',
          }
        );
        
        const fechaStr =
          fecha && typeof fecha.toLocaleDateString === "function"
            ? fecha.toLocaleDateString()
            : "";
        setReportes((prev) =>
          prev.map((r) =>
            r.publicacionId === reporteSeleccionado.publicacionId
              ? {
                  ...r,
                  estado: "completado",
                  decision: "Reporte descartado",
                  motivoDecision: motivo,
                  fechaDecision: fechaStr,
                }
              : r
          )
        );
        await notificarDecisionAdminAutor({
          autorUid: reporteSeleccionado.autorUid,
          publicacionTitulo: reporteSeleccionado.titulo,
          motivo,
          decision: "Reporte descartado",
          tipoAccion: "quitar",
        });
        await notificarDecisionAdminDenunciantes({
          reportadores: reporteSeleccionado.reportadores,
          publicacionTitulo: reporteSeleccionado.titulo,
          motivo,
          decision: "Reporte descartado",
          tipoAccion: "quitar",
        });
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
    });
  };

  const eliminarPublicacion = () => {
    pedirMotivoYContinuar(async (motivoArg) => {
      if (!reporteSeleccionado) return;
      try {
        await eliminarPublicacionYArchivos(reporteSeleccionado.publicacionId);
        await aplicarStrikeAlAutor(reporteSeleccionado.autorUid);
        const motivo =
          motivoArg && motivoArg.trim().length > 0
            ? motivoArg
            : "Sin motivo especificado";
        const fecha = await completarReportesDePublicacion(
          reporteSeleccionado.publicacionId,
          "Publicación eliminada + strike",
          motivo
        );
        
        await registrarActividadCliente(
          'publicacion_eliminada',
          'Publicación eliminada',
          `La publicación "${reporteSeleccionado.titulo}" de ${reporteSeleccionado.autor} fue eliminada por ${motivo}`,
          auth.currentUser?.uid,
          auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',
          reporteSeleccionado.publicacionId,
          {
            publicacionTitulo: reporteSeleccionado.titulo,
            autorNombre: reporteSeleccionado.autor,
            motivo,
            decision: 'Publicación eliminada + strike',
          }
        );
        
        const fechaStr =
          fecha && typeof fecha.toLocaleDateString === "function"
            ? fecha.toLocaleDateString()
            : "";
        setReportes((prev) =>
          prev.map((r) =>
            r.publicacionId === reporteSeleccionado.publicacionId
              ? {
                  ...r,
                  estado: "completado",
                  strikesAutor: (r.strikesAutor || 0) + 1,
                  decision: "Publicación eliminada + strike",
                  motivoDecision: motivo,
                  fechaDecision: fechaStr,
                }
              : r
          )
        );
        await notificarDecisionAdminAutor({
          autorUid: reporteSeleccionado.autorUid,
          publicacionTitulo: reporteSeleccionado.titulo,
          motivo,
          decision: "Publicación eliminada + strike",
          tipoAccion: "strike",
        });
        await notificarDecisionAdminDenunciantes({
          reportadores: reporteSeleccionado.reportadores,
          publicacionTitulo: reporteSeleccionado.titulo,
          motivo,
          decision: "Publicación eliminada + strike",
          tipoAccion: "strike",
        });
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
    }, "strike");
  };

  const banearUsuario = () => {
    pedirMotivoYContinuar(async (motivoArg) => {
      if (!reporteSeleccionado) return;
      try {
        await banearUsuarioPorNombre(reporteSeleccionado.autor);
        await eliminarPublicacionYArchivos(reporteSeleccionado.publicacionId);
        const motivo =
          motivoArg && motivoArg.trim().length > 0
            ? motivoArg
            : "Sin motivo especificado";
        const fecha = await completarReportesDePublicacion(
          reporteSeleccionado.publicacionId,
          "Usuario baneado",
          motivo
        );
        
        await registrarActividadCliente(
          'usuario_baneado',
          'Usuario baneado',
          `${reporteSeleccionado.autor} fue baneado por ${motivo}`,
          auth.currentUser?.uid,
          auth.currentUser?.displayName || auth.currentUser?.email || 'Admin',
          reporteSeleccionado.autorUid,
          {
            usuarioNombre: reporteSeleccionado.autor,
            motivo,
            decision: 'Usuario baneado',
          }
        );
        
        const fechaStr =
          fecha && typeof fecha.toLocaleDateString === "function"
            ? fecha.toLocaleDateString()
            : "";
        setReportes((prev) =>
          prev.map((r) =>
            r.publicacionId === reporteSeleccionado.publicacionId
              ? {
                  ...r,
                  estado: "completado",
                  decision: "Usuario baneado",
                  motivoDecision: motivo,
                  fechaDecision: fechaStr,
                }
              : r
          )
        );
        await notificarDecisionAdminAutor({
          autorUid: reporteSeleccionado.autorUid,
          publicacionTitulo: reporteSeleccionado.titulo,
          motivo,
          decision: "Usuario baneado",
          tipoAccion: "ban",
        });
        await notificarDecisionAdminDenunciantes({
          reportadores: reporteSeleccionado.reportadores,
          publicacionTitulo: reporteSeleccionado.titulo,
          motivo,
          decision: "Usuario baneado",
          tipoAccion: "ban",
        });
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
    }, "ban");
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Denuncias" />
      </Appbar.Header>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
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

        {cargando ? (
          <ReportsListSkeleton />
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
            <ReportCard
              key={reporte.id}
              reporte={reporte}
              onPress={abrirDetalles}
              styles={styles}
              theme={theme}
              getDecisionLabel={getDecisionLabel}
            />
          ))
        )}
      </ScrollView>

      {/* Modal de Detalles */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={cerrarModal}
          contentContainerStyle={[styles.modalContent, { maxHeight: "85%" }]}
        >
          <ReportReasonModal
            visible={modalMotivoVisible}
            initialSelection={savedMotivo}
            motives={MOTIVOS_POR_ACCION[tipoAccionMotivo]}
            title="Motivo de la decisión"
            confirmLabel="Confirmar"
            cancelLabel="Cancelar"
            onDismiss={(saved, motivo) => {
              if (saved) {
                setSavedMotivo(motivo || "");
              } else {
                setSavedMotivo("");
              }
              setModalMotivoVisible(false);
            }}
            onConfirm={async (motivo) => {
              setModalMotivoVisible(false);
              if (accionPendiente.current) {
                await accionPendiente.current(motivo);
                accionPendiente.current = null;
              }
            }}
          />

          {reporteSeleccionado && (
            <FlatList
              data={[{ key: "modal-content" }]} // Un solo elemento para renderizar todo el contenido
              renderItem={() => (
                <>
                  <Text variant="headlineSmall" style={styles.modalTitle}>
                    Detalles del Reporte
                  </Text>
                  <Divider style={styles.divider} />

                  {/* Publicación */}
                  <Card style={styles.modalCard}>
                    <Card.Content>
                      <Text
                        variant="titleLarge"
                        style={styles.publicacionTitulo}
                      >
                        {reporteSeleccionado.titulo}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={styles.publicacionAutor}
                      >
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
                        <ReportDetailSkeleton />
                      ) : archivos.length === 0 ? (
                        <Text
                          variant="bodyMedium"
                          style={styles.noArchivosText}
                        >
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
                                  icon={obtenerIconoPorTipo(
                                    archivo.tipoNombre || ""
                                  )}
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
                  <Card style={styles.modalCard}>
                    <Card.Content>
                      <View style={styles.comentariosHeader}>
                        <Text variant="titleMedium" style={styles.sectionTitle}>
                          Comentarios de la Publicación
                        </Text>
                        <IconButton
                          icon={
                            comentariosDesplegados
                              ? "chevron-up"
                              : "chevron-down"
                          }
                          size={20}
                          onPress={() => setCommentsModalVisible(true)}
                        />
                      </View>
                      <Divider style={styles.divider} />

                      <View style={styles.comentariosCollapsed}>
                        <Text
                          variant="bodyMedium"
                          style={styles.comentariosCount}
                        >
                          {numeroComentarios === 0
                            ? "No hay comentarios"
                            : `${numeroComentarios} comentario${
                                numeroComentarios !== 1 ? "s" : ""
                              }`}
                        </Text>
                        <Text
                          variant="bodySmall"
                          style={styles.comentariosHint}
                        >
                          {numeroComentarios > 0
                            ? "Presiona el botón para ver todos los comentarios"
                            : "Esta publicación no tiene comentarios"}
                        </Text>
                      </View>
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
                        {reporteSeleccionado.motivoDecision && (
                          <Text variant="bodySmall" style={{ marginTop: 4 }}>
                            <Text style={{ fontWeight: "bold" }}>Motivo: </Text>
                            {reporteSeleccionado.motivoDecision}
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
                      right={() => (
                        <Chip compact>{reporteSeleccionado.totalReportes}</Chip>
                      )}
                    />
                    <Divider />

                    <List.Item
                      title="Motivo"
                      right={() => (
                        <Chip compact>{reporteSeleccionado.ultimoMotivo}</Chip>
                      )}
                    />
                    <Divider />

                    <List.Item
                      title="Última fecha"
                      description={reporteSeleccionado.ultimaFecha}
                    />
                    <Divider />

                    <List.Item
                      title="Strikes del autor"
                      right={() => (
                        <Chip compact>{reporteSeleccionado.strikesAutor}</Chip>
                      )}
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

                    {reporteSeleccionado.reportadores
                      .slice(0, 5)
                      .map((rep, index, array) => (
                        <View key={index}>
                          <List.Item
                            title={rep.usuario}
                            description={`${rep.motivo} • ${rep.fecha}`}
                            left={(props) => (
                              <List.Icon {...props} icon="account-circle" />
                            )}
                          />
                          {index < array.length - 1 && <Divider />}
                        </View>
                      ))}

                    {reporteSeleccionado.reportadores.length > 5 && (
                      <Card.Content>
                        <Text
                          variant="bodySmall"
                          style={styles.masReportadores}
                        >
                          +{reporteSeleccionado.reportadores.length - 5}{" "}
                          denunciante
                          {reporteSeleccionado.reportadores.length - 5 !== 1
                            ? "s"
                            : ""}{" "}
                          más
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
                      {auth.currentUser &&
                      reporteSeleccionado.autorUid === auth.currentUser.uid ? (
                        <Card
                          style={[
                            styles.modalCard,
                            { marginTop: 12, marginBottom: 12 },
                          ]}
                        >
                          <Card.Content>
                            <Text
                              style={{
                                color: theme.colors.onSurfaceVariant,
                                textAlign: "center",
                              }}
                            >
                              No puedes realizar acciones administrativas sobre
                              denuncias hacia tus propias publicaciones.
                            </Text>
                          </Card.Content>
                        </Card>
                      ) : (
                        <>
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
                          <Text
                            variant="bodySmall"
                            style={styles.buttonSubtext}
                          >
                            {reporteSeleccionado.strikesAutor < 2
                              ? "Se requieren al menos 2 strikes"
                              : "No podrá volver a acceder al sistema"}
                          </Text>
                        </>
                      )}
                    </View>
                  )}

                  <Button
                    mode="text"
                    onPress={cerrarModal}
                    style={styles.closeButton}
                  >
                    Cerrar
                  </Button>
                </>
              )}
              keyExtractor={() => "modal-content"}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: 20, // Espacio adicional al final
              }}
            />
          )}
        </Modal>
        <CommentsModalReadOnly
          visible={commentsModalVisible}
          onDismiss={() => setCommentsModalVisible(false)}
          publicacionId={reporteSeleccionado?.publicacionId || ""}
          autorPublicacionUid={reporteSeleccionado?.autorUid}
        />
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
