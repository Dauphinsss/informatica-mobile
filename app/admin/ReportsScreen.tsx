import {
  aplicarStrikeAlAutor,
  banearUsuarioPorNombre,
  completarReportesDePublicacion,
  eliminarPublicacion as eliminarPublicacionFirestore,
  obtenerReportes,
} from "@/scripts/services/Reports";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Chip,
  Divider,
  List,
  Modal,
  Portal,
  Text,
} from "react-native-paper";
import { FilterType, Report } from "../../scripts/types/Reports.type";
import { styles } from "./ReportsScreen.styles";

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [filtroActivo, setFiltroActivo] = useState<FilterType>("pendientes");
  const [modalVisible, setModalVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Report | null>(
    null
  );
  const [reportes, setReportes] = useState<Report[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarReportes = async () => {
      setCargando(true);
      const datos = await obtenerReportes();
      setReportes(datos);
      setCargando(false);
    };

    cargarReportes();
  }, []);

  const reportesFiltrados = reportes
    .filter((reporte) => {
      if (filtroActivo === "pendientes") return reporte.estado === "pendiente";
      if (filtroActivo === "completados")
        return reporte.estado === "completado";
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.ultimaFecha.split("/").reverse().join("-"));
      const dateB = new Date(b.ultimaFecha.split("/").reverse().join("-"));
      return dateB.getTime() - dateA.getTime();
    });

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
  };

  const abrirDetalles = (reporte: Report) => {
    setReporteSeleccionado(reporte);
    setModalVisible(true);
  };

  const quitarReporte = async () => {
    if (!reporteSeleccionado) return;
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
  };

  const eliminarPublicacion = async () => {
    if (!reporteSeleccionado) return;
    await eliminarPublicacionFirestore(reporteSeleccionado.publicacionId);
    await aplicarStrikeAlAutor(reporteSeleccionado.autorUid);
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
  };

  const banearUsuario = async () => {
    if (!reporteSeleccionado) return;
    await banearUsuarioPorNombre(reporteSeleccionado.autor);
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

      {/* Lista de reportes */}
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

      {/* Detalles */}
      <Portal>
        <Modal
          visible={modalVisible}
          onDismiss={cerrarModal}
          contentContainerStyle={styles.modalContent}
        >
          <ScrollView>
            {reporteSeleccionado && (
              <>
                <Text variant="headlineSmall" style={styles.modalTitle}>
                  Detalles del Reporte
                </Text>
                <Divider style={styles.divider} />

                {/* Publicación */}
                <Card style={styles.modalCard}>
                  <Card.Content>
                    <Text
                      variant="headlineMedium"
                      style={styles.publicacionTitulo}
                    >
                      {reporteSeleccionado.titulo}
                    </Text>
                    <Text variant="bodyMedium" style={styles.publicacionAutor}>
                      Autor: {reporteSeleccionado.autor}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={styles.publicacionContenido}
                    >
                      {reporteSeleccionado.contenido}
                    </Text>
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
                    .map((rep, index) => (
                      <View key={index}>
                        <List.Item
                          title={rep.usuario}
                          description={`${rep.motivo} • ${rep.fecha}`}
                          left={(props) => (
                            <List.Icon {...props} icon="account-circle" />
                          )}
                        />
                        <Divider />
                      </View>
                    ))}

                  {reporteSeleccionado.reportadores.length > 5 && (
                    <Card.Content>
                      <Text variant="bodySmall" style={styles.masReportadores}>
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

                <Button
                  mode="text"
                  onPress={cerrarModal}
                  style={styles.closeButton}
                >
                  Cerrar
                </Button>
              </>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}
