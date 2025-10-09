import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { styles, LILAC_BG, LILAC_BORDER, LILAC_TEXT } from './ReportsScreen.styles';
import { Report, FilterType } from "../../scripts/types/Reports.type";
import { 
  obtenerReportes,
  completarReportesDePublicacion,
  eliminarPublicacion as eliminarPublicacionFirestore,
  aplicarStrikeAlAutor,
  banearUsuarioPorNombre,
 } from '@/scripts/services/Reports';
import {
    Modal,
    ScrollView,
    StatusBar,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function ReportsScreen() {
  const navigation = useNavigation();
  const [filtroActivo, setFiltroActivo] = useState<FilterType>('pendientes');
  const [modalVisible, setModalVisible] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<Report | null>(null);
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
    .filter(reporte => {
      if (filtroActivo === 'pendientes') return reporte.estado === 'pendiente';
      if (filtroActivo === 'completados') return reporte.estado === 'completado';
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.ultimaFecha.split('/').reverse().join('-'));
      const dateB = new Date(b.ultimaFecha.split('/').reverse().join('-'));
      return dateB.getTime() - dateA.getTime();
    });

  const abrirDetalles = (reporte: Report) => {
    setReporteSeleccionado(reporte);
    setModalVisible(true);
  };

  const getDecisionLabel = (r: Report) => {
    const text = (r.decision || '').toLowerCase();
    if (text.includes('bane') || text.includes('usuario baneado') || text.includes('baneado')) return 'BAN';
    if (text.includes('elimin') || text.includes('eliminada')) return 'Eliminado';
    if (text.includes('descart') || text.includes('descartado') || text.includes('rechaz')) return 'Rechazado';
    return 'Resuelto';
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setReporteSeleccionado(null);
  };

  const quitarReporte = async () => {
    if (!reporteSeleccionado) return;
    const fecha = await completarReportesDePublicacion(
      reporteSeleccionado.publicacionId,
      "Reporte descartado - publicación en orden"
    );
    const fechaStr = fecha.toLocaleDateString();
    setReportes(prev =>
      prev.map(r =>
      r.publicacionId === reporteSeleccionado.publicacionId
        ? { ...r, estado: "completado", decision: "Reporte descartado - publicación en orden", fechaDecision: fechaStr }
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
    setReportes(prev =>
      prev.map(r =>
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
    setReportes(prev =>
      prev.map(r =>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Reportes</Text>
        
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtrosContainer}>
        <TouchableOpacity
          style={[styles.filtroBtn, filtroActivo === 'pendientes' && styles.filtroBtnActivo]}
          onPress={() => setFiltroActivo('pendientes')}
        >
          <Text style={[styles.filtroText, filtroActivo === 'pendientes' && styles.filtroTextActivo]}>
            Pendientes
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filtroBtn, filtroActivo === 'completados' && styles.filtroBtnActivo]}
          onPress={() => setFiltroActivo('completados')}
        >
          <Text style={[styles.filtroText, filtroActivo === 'completados' && styles.filtroTextActivo]}>
            Completados
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filtroBtn, filtroActivo === 'todos' && styles.filtroBtnActivo]}
          onPress={() => setFiltroActivo('todos')}
        >
          <Text style={[styles.filtroText, filtroActivo === 'todos' && styles.filtroTextActivo]}>
            Todos
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de reportes */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        >
        {cargando ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="cloud-download-outline" size={64} color="#a78bfa" />
                <Text style={styles.emptyText}>Cargando reportes...</Text>
                <ActivityIndicator size="large" color="#a78bfa" style={{ marginTop: 12 }} />
            </View>
        ) : reportesFiltrados.length === 0 ? (
            <View style={styles.emptyContainer}>
                <Ionicons name="checkmark-circle-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No hay denuncias {filtroActivo}</Text>
            </View>
        ) : (
            <View style={styles.cardsGrid}>
            {reportesFiltrados.map((reporte) => (
                <TouchableOpacity
                key={reporte.id}
                style={styles.card}
                onPress={() => abrirDetalles(reporte)}
                activeOpacity={0.7}
                >
                <Text style={styles.cardTitulo} numberOfLines={2}>
                  {reporte.titulo}
                </Text>
                
                <View style={styles.cardInfo}>
                  <Text style={styles.cardAutor} numberOfLines={1}>
                    By {reporte.autor}
                  </Text>
                  <View style={styles.cardFecha}>
                    <Ionicons name="time-outline" size={12} color="#666" />
                    <Text style={styles.cardFechaText}>{reporte.ultimaFecha}</Text>
                  </View>
                </View>
                
                <View style={styles.cardFooter}>
                  <View style={styles.motivoBadge}>
                    <Ionicons name="flag-outline" size={12} color="#666" />
                    <Text style={styles.motivoText} numberOfLines={1}>
                      {reporte.ultimoMotivo}
                    </Text>
                  </View>

                  {reporte.estado === 'completado' ? (
                    <View style={[styles.reportesBadge, { backgroundColor: LILAC_BG, borderColor: LILAC_BORDER }] }>
                      <Text style={[styles.reportesText, { color: LILAC_TEXT }]}>{getDecisionLabel(reporte)}</Text>
                    </View>
                  ) : (
                    <View style={styles.reportesBadge}>
                      <Ionicons name="alert-circle" size={12} color="#ef4444" />
                      <Text style={styles.reportesText}>
                        {reporte.totalReportes} {reporte.totalReportes === 1 ? 'reporte' : 'reportes'}
                      </Text>
                    </View>
                  )}
                </View>
                </TouchableOpacity>
            ))}
            </View>
        )}
        </ScrollView>

      {/* Modal de detalles */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={cerrarModal}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop} 
            activeOpacity={1} 
            onPress={cerrarModal}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalles del Reporte</Text>
              <TouchableOpacity onPress={cerrarModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScroll}
              showsVerticalScrollIndicator={false}
            >
              {reporteSeleccionado && (
                <>
                  {/* Información de la publicación */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Publicación</Text>
                    <View style={styles.publicacionCard}>
                      <Text style={styles.modalPublicacionTitulo}>
                        {reporteSeleccionado.titulo}
                      </Text>
                      <Text style={styles.modalAutor}>
                        Autor: {reporteSeleccionado.autor}
                      </Text>
                      <Text style={styles.modalContenido}>
                        {reporteSeleccionado.contenido}
                      </Text>
                    </View>
                  </View>

                    {/* Decisión Tomada(si está completado) */}
                    {reporteSeleccionado.estado === 'completado' && (
                      <View style={{
                        backgroundColor: LILAC_BG,
                        borderColor: LILAC_BORDER,
                        borderWidth: 1,
                        padding: 10,
                        borderRadius: 8,
                        marginVertical: 8,
                      }}>
                        <Text style={{ color: LILAC_TEXT, fontWeight: '700' }}>{getDecisionLabel(reporteSeleccionado)}</Text>
                        {reporteSeleccionado.fechaDecision && (
                          <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>{reporteSeleccionado.fechaDecision}</Text>
                        )}
                      </View>
                    )}

                    {/* Información del reporte */}
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Información del Reporte</Text>
                    <View style={styles.infoCard}>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Total de reportes:</Text>
                        <View style={[styles.badgeCount, { backgroundColor: LILAC_BG, borderColor: LILAC_BORDER }] }>
                          <Text style={[styles.modalInfoValue, { color: LILAC_TEXT }]}>
                            {reporteSeleccionado.totalReportes}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Último motivo:</Text>
                        <Text style={[styles.modalInfoValue, styles.motivoValue, { backgroundColor: LILAC_BG, borderColor: LILAC_BORDER, color: LILAC_TEXT, padding: 6, borderRadius: 6 }]}>
                          {reporteSeleccionado.ultimoMotivo}
                        </Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Última fecha:</Text>
                        <Text style={styles.modalInfoValue}>
                          {reporteSeleccionado.ultimaFecha}
                        </Text>
                      </View>
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Strikes del autor:</Text>
                        <View style={[
                          styles.strikesBadge,
                          reporteSeleccionado.strikesAutor >= 2 && styles.strikesBadgeDanger
                        ]}>
                          <Text style={[
                            styles.strikesText,
                            reporteSeleccionado.strikesAutor >= 2 && styles.strikesTextDanger
                          ]}>
                            {reporteSeleccionado.strikesAutor}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                    {/* Lista de reportadores */}
                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>
                        Reportadores ({reporteSeleccionado.reportadores.length})
                      </Text>
                      <View style={styles.reportadoresCard}>
                        {reporteSeleccionado.reportadores.slice(0, 5).map((rep, index) => (
                          <View
                            key={index}
                            style={[
                              styles.reportadorItem,
                              index === reporteSeleccionado.reportadores.slice(0, 5).length - 1 && styles.reportadorItemLast,
                            ]}
                          >
                            <View style={styles.reportadorInfo}>
                              <View style={styles.reportadorHeader}>
                                <Ionicons name="person-circle-outline" size={16} color="#666" />
                                <Text style={styles.reportadorNombre}>{rep.usuario}</Text>
                              </View>
                              <View style={styles.reportadorMotivoContainer}>
                                <Ionicons name="flag" size={12} color="#ef4444" />
                                <Text style={styles.reportadorMotivo}>{rep.motivo}</Text>
                              </View>
                            </View>
                            <Text style={styles.reportadorFecha}>{rep.fecha}</Text>
                          </View>
                        ))}
                        {reporteSeleccionado.reportadores.length > 5 && (
                          <View style={styles.masReportadoresContainer}>
                            <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
                            <Text style={styles.masReportadores}>
                              +{reporteSeleccionado.reportadores.length - 5} reportador{reporteSeleccionado.reportadores.length - 5 !== 1 ? 'es' : ''} más
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Acciones del administrador (solo para reportes pendientes) */}
                  <View style={styles.accionesContainer}>
                    {reporteSeleccionado.estado !== 'completado' ? (
                      <>
                        <Text style={styles.accionesTitle}>Acciones de Administrador</Text>

                        <TouchableOpacity
                          style={styles.btnQuitar}
                          onPress={quitarReporte}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                          <Text style={styles.btnQuitarText}>Quitar Reporte</Text>
                          <Text style={styles.btnSubtext}>La publicación está en orden</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.btnEliminar}
                          onPress={eliminarPublicacion}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="trash-outline" size={20} color="#f59e0b" />
                          <Text style={styles.btnEliminarText}>Eliminar Publicación + Strike</Text>
                          <Text style={styles.btnSubtext}>Quita de la materia y penaliza al autor</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.btnBanear,
                            reporteSeleccionado.strikesAutor < 2 && styles.btnBanearDisabled,
                          ]}
                          onPress={banearUsuario}
                          disabled={reporteSeleccionado.strikesAutor < 2}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="ban"
                            size={20}
                            color={reporteSeleccionado.strikesAutor < 2 ? '#9ca3af' : '#ef4444'}
                          />
                          <Text
                            style={[
                              styles.btnBanearText,
                              reporteSeleccionado.strikesAutor < 2 && styles.btnBanearTextDisabled,
                            ]}
                          >
                            Banear Usuario del Sistema
                          </Text>
                          <Text
                            style={[
                              styles.btnSubtext,
                              reporteSeleccionado.strikesAutor < 2 && styles.btnSubtextDisabled,
                            ]}
                          >
                            {reporteSeleccionado.strikesAutor < 2
                              ? 'Se requieren al menos 2 strikes'
                              : 'No podrá volver a acceder al sistema'}
                          </Text>
                        </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}