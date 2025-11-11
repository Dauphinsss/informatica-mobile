import { PublicationFilters, SortBy, SortOrder } from "@/app/components/filters/PublicationFilters";
import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import {
  escucharPublicacionesPorAutor,
  obtenerPublicacionesPorAutor
} from "@/scripts/services/Publications";
import { eliminarPublicacionYArchivos } from "@/scripts/services/Reports";
import { Publicacion } from "@/scripts/types/Publication.type";
import { likesService } from "@/services/likes.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, FlatList, Pressable, useWindowDimensions, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Card,
  Chip,
  Searchbar,
  Text,
  TouchableRipple
} from "react-native-paper";
import CustomAlert from "../../components/ui/CustomAlert";
import getStyles from "./MisPublicacionesScreen.styles";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PublicationCardProps = {
  pub: PublicacionConMateria;
  selectionMode: boolean;
  isSelected: boolean;
  onPress: (pub: PublicacionConMateria) => void;
  onToggleSelect: (e: any, pub: PublicacionConMateria) => void;
  onLike: (pub: PublicacionConMateria) => void;
  onComment: (pub: PublicacionConMateria) => void;
  styles: ReturnType<typeof getStyles>;
  primaryColor: string;
};

const PublicationCard = React.memo(function PublicationCard({ pub, selectionMode, isSelected, onPress, onToggleSelect, onLike, onComment, styles, primaryColor }: PublicationCardProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isSelected ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isSelected, anim]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] });
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });

  return (
    <Pressable onPress={() => onPress(pub)}>
      <Animated.View style={[styles.card, { transform: [{ scale }, { translateY }] }] }>
        <Card>
          <Card.Content>
            <View style={styles.cardContent}>
              {pub.autorFoto ? (
                <Avatar.Image size={44} source={{ uri: pub.autorFoto }} />
              ) : (
                <Avatar.Text size={44} label={pub.autorNombre?.charAt(0).toUpperCase() || "?"} />
              )}
              <Text
                variant="bodySmall"
                style={styles.fecha}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {pub.fechaPublicacion ? pub.fechaPublicacion.toLocaleDateString("es-BO", { year: "numeric", month: "short", day: "numeric" }) : ''}
              </Text>
              <View style={styles.autorContainer}>
                <Text
                  variant="titleMedium"
                  style={styles.titulo}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {pub.titulo}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={styles.descripcion}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {pub.descripcion}
                </Text>
              </View>
            </View>
            <Text
              variant="bodyMedium"
              style={styles.materiaNombre}
              numberOfLines={1}
            >
              {pub.materiaNombre} - Sem {pub.materiaSemestre}
            </Text>
            <View style={styles.statsContainer}>
              <Chip icon="eye" compact style={styles.statChip} textStyle={styles.statText}>
                {pub.vistas > 0 ? pub.vistas : ""}
              </Chip>

              <TouchableRipple
                onPress={(e) => { e.stopPropagation(); onLike(pub); }}
                style={styles.actionButton}
              >
                <Chip
                  icon="heart"
                  compact
                  style={styles.statChip}
                  textStyle={styles.statText}
                >
                  {pub.totalCalificaciones > 0 ? pub.totalCalificaciones : ""}
                </Chip>
              </TouchableRipple>

              <TouchableRipple
                onPress={(e) => { e.stopPropagation(); onComment(pub); }}
                style={styles.actionButton}
              >
                <Chip
                  icon="comment"
                  compact
                  style={styles.statChip}
                  textStyle={styles.statText}
                >
                  {pub.totalComentarios > 0 ? pub.totalComentarios : ""}
                </Chip>
              </TouchableRipple>
            </View>
          </Card.Content>
        </Card>

        <Animated.View pointerEvents="none" style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: primaryColor,
          opacity: anim,
        }} />

        <Animated.View pointerEvents="none" style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: primaryColor,
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
          opacity: anim,
        }}>
          <MaterialCommunityIcons name="check" size={14} color="#fff" />
        </Animated.View>
    </Animated.View>
    </Pressable>
  );
}, (prev, next) => {
  return prev.selectionMode === next.selectionMode && prev.isSelected === next.isSelected && prev.pub.id === next.pub.id;
});

interface Materia {
  id: string;
  nombre: string;
  semestre: number;
}

type PublicacionConMateria = Publicacion & { 
  materiaNombre: string; 
  materiaSemestre: number;
  userLiked?: boolean;
};

type ProfileStackParamList = {
  ProfileMain: undefined;
  MisPublicacionesScreen: undefined;
  PublicationDetail: { publicacionId: string; materiaNombre: string };
  FileGallery: any;
};

export default function MisPublicacionesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const user = auth.currentUser;
  const [publicaciones, setPublicaciones] = useState<PublicacionConMateria[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);
  const [successDeleteVisible, setSuccessDeleteVisible] = useState(false);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('fecha');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const insets = useSafeAreaInsets();

  const handleFilterChange = useCallback((newSortBy: SortBy, newSortOrder: SortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);
  
  const { width } = useWindowDimensions();

  const handlePress = useCallback((pub: PublicacionConMateria) => {
    if (selectionMode) {
      setSelectedIds(prev => {
        if (prev.includes(pub.id)) return prev.filter(id => id !== pub.id);
        return [...prev, pub.id];
      });
      return;
    }
    navigation.navigate('PublicationDetail', {
      publicacionId: pub.id,
      materiaNombre: pub.materiaNombre,
    });
  }, [selectionMode, navigation]);

  const handleLike = useCallback(async (publicacion: PublicacionConMateria) => {
    if (!user) return;
    try {
      await likesService.darLike(user.uid, publicacion.id);
    } catch (error) {
      console.error("Error al dar like:", error);
    }
  }, [user]);

  const handleCommentPress = useCallback((publicacion: PublicacionConMateria) => {
    navigation.navigate('PublicationDetail', {
      publicacionId: publicacion.id,
      materiaNombre: publicacion.materiaNombre,
    });
  }, [navigation]);

  const toggleSelect = useCallback((e: any, pub: PublicacionConMateria) => {
    e?.stopPropagation?.();
    setSelectedIds(prev => {
      if (prev.includes(pub.id)) return prev.filter(id => id !== pub.id);
      return [...prev, pub.id];
    });
  }, []);

  const onDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    setConfirmDeleteVisible(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    const count = selectedIds.length;
    try {
      for (const id of selectedIds) {
        await eliminarPublicacionYArchivos(id);
      }
      setPublicaciones(prev => prev.filter(p => !selectedIds.includes(p.id)));
      setSelectedIds([]);
      setSelectionMode(false);
      setDeletedCount(count);
      setSuccessDeleteVisible(true);
    } catch (error) {
      console.error("Error al eliminar publicaciones seleccionadas:", error);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteVisible(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;
    
    const fetchMaterias = async () => {
      setCargando(true);
      const snap = await getDocs(collection(db, "materias"));
      const mats = snap.docs.map((doc: any) => {
        const data = doc.data();
        return {
          id: doc.id,
          nombre: data.nombre,
          semestre: data.semestre,
        } as Materia;
      });
      
      if (!isMounted) return;
      setMaterias(mats);

      if (user) {
        const pubs = await obtenerPublicacionesPorAutor(user.uid);
        if (!isMounted) return;
        
        const publicacionesConMateria = pubs.map(pub => {
          const materia = mats.find((m: Materia) => m.id === pub.materiaId);
          return {
            ...pub,
            materiaNombre: materia?.nombre || "Materia",
            materiaSemestre: materia?.semestre || 0,
          };
        }) as PublicacionConMateria[];

        setPublicaciones(publicacionesConMateria);
        
        unsubscribe = escucharPublicacionesPorAutor(user.uid, (pubs) => {
          if (!isMounted) return;
          const publicacionesActualizadas = pubs.map(pub => {
            const materia = mats.find((m: Materia) => m.id === pub.materiaId);
            return {
              ...pub,
              materiaNombre: materia?.nombre || "Materia",
              materiaSemestre: materia?.semestre || 0,
            };
          }) as PublicacionConMateria[];
          
          setPublicaciones(publicacionesActualizadas);
        });
      }
      setCargando(false);
    };
    
    fetchMaterias();
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  function normalizar(texto: string) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }

  const filtered = React.useMemo(() => {
    const s = normalizar(search);
    let list = publicaciones.filter(pub => {
      return (
        normalizar(pub.titulo).includes(s) ||
        normalizar(pub.descripcion).includes(s) ||
        normalizar(pub.materiaNombre).includes(s)
      );
    });

    if (sortBy === 'fecha') {
      list = list.sort((a, b) => sortOrder === 'desc'
        ? b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
        : a.fechaPublicacion.getTime() - b.fechaPublicacion.getTime()
      );
    } else if (sortBy === 'vistas') {
      list = list.sort((a, b) => sortOrder === 'desc'
        ? (b.vistas || 0) - (a.vistas || 0)
        : (a.vistas || 0) - (b.vistas || 0)
      );
    } else if (sortBy === 'semestre') {
      list = list.sort((a, b) => {
        if (a.materiaSemestre !== b.materiaSemestre) {
          return sortOrder === 'desc' ? b.materiaSemestre - a.materiaSemestre : a.materiaSemestre - b.materiaSemestre;
        }
        if (a.materiaNombre !== b.materiaNombre) {
          return sortOrder === 'desc'
            ? b.materiaNombre.localeCompare(a.materiaNombre)
            : a.materiaNombre.localeCompare(b.materiaNombre);
        }
        return sortOrder === 'desc'
          ? b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
          : a.fechaPublicacion.getTime() - b.fechaPublicacion.getTime();
      });
    } else if (sortBy === 'likes') {
      list = list.sort((a, b) => sortOrder === 'desc'
        ? (b.totalCalificaciones || 0) - (a.totalCalificaciones || 0)
        : (a.totalCalificaciones || 0) - (b.totalCalificaciones || 0)
      );
    } else if (sortBy === 'comentarios') {
      list = list.sort((a, b) => sortOrder === 'desc'
        ? (b.totalComentarios || 0) - (a.totalComentarios || 0)
        : (a.totalComentarios || 0) - (b.totalComentarios || 0)
      );
    }

    return list;
  }, [publicaciones, search, sortBy, sortOrder]);

  const styles = getStyles(theme);


  return (
    <View style={[styles.container]}>
      <Appbar.Header>
        {!selectionMode ? (
          <Appbar.Content title="Mis Publicaciones" />
        ) : (
          <Appbar.Content title={`${selectedIds.length} seleccionada${selectedIds.length !== 1 ? 's' : ''}`} />
        )}
        {selectionMode ? (
          <>
            <Appbar.Action icon="delete" onPress={() => onDeleteSelected()} disabled={selectedIds.length === 0} />
            <Appbar.Action icon="close" onPress={() => { setSelectionMode(false); setSelectedIds([]); }} />
          </>
        ) : (
          <Appbar.Action
            icon="select-multiple"
            onPress={() => {
              setSelectedIds([]);
              setSelectionMode(true);
            }}
          />
        )}
      </Appbar.Header>
      <View style={{ flex: 1 }}>
        <View style={styles.searchContainer}>
          <View style={styles.searchbarWrapper}>
            <Searchbar
              placeholder="Buscar publicación..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchbar}
              inputStyle={styles.searchbarInput}
              iconColor={theme.colors.onBackground}
            />
          </View>
        </View>
        {cargando ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator style={styles.loadingIndicator} />
          </View>
        ) : filtered.length === 0 ? (
          <Text variant="bodyLarge" style={styles.emptyText}>
            No tienes publicaciones aún.
          </Text>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            removeClippedSubviews={true}
            ListHeaderComponent={
              <PublicationFilters
                sortBy={sortBy}
                sortOrder={sortOrder}
                onFilterChange={handleFilterChange}
                theme={theme}
                showSemestreFilter={true}
              />
            }
            renderItem={({ item: pub }) => (
              <PublicationCard
                pub={pub}
                selectionMode={selectionMode}
                isSelected={selectedIds.includes(pub.id)}
                onPress={handlePress}
                onToggleSelect={toggleSelect}
                onLike={handleLike}
                onComment={handleCommentPress}
                  styles={styles}
                  primaryColor={theme.colors.primary}
              />
            )}
          />
        )}
        <CustomAlert
          visible={confirmDeleteVisible}
          onDismiss={() => setConfirmDeleteVisible(false)}
          title="Eliminar publicaciones"
          message={`¿Eliminar ${selectedIds.length} publicación${selectedIds.length !== 1 ? 'es' : ''}? Esta acción no se puede deshacer.`}
          type="confirm"
          buttons={[
            { text: 'Cancelar', onPress: () => setConfirmDeleteVisible(false), mode: 'text' },
            { text: 'Eliminar', onPress: handleConfirmDelete, mode: 'contained', preventDismiss: true },
          ]}
        />
        <CustomAlert
          visible={successDeleteVisible}
          onDismiss={() => setSuccessDeleteVisible(false)}
          title="Publicaciones eliminadas"
          message={deletedCount != null ? `Se eliminaron ${deletedCount} publicación${deletedCount !== 1 ? 'es' : ''} correctamente.` : 'Se eliminaron las publicaciones correctamente.'}
          type="info"
          buttons={[{ text: 'OK', onPress: () => setSuccessDeleteVisible(false), mode: 'contained' }]}
        />
      </View>
    </View>
  );
}