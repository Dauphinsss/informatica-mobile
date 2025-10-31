// src/screens/MisPublicacionesScreen.tsx
import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import {
  escucharPublicacionesPorAutor,
  obtenerPublicacionesPorAutor
} from "@/scripts/services/Publications";
import { Publicacion } from "@/scripts/types/Publication.type";
import { likesService } from "@/services/likes.service";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { collection, getDocs } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { ScrollView, useWindowDimensions, View } from "react-native";
import {
  ActivityIndicator,
  Appbar,
  Avatar,
  Card,
  Chip,
  IconButton,
  Searchbar,
  Text,
  TouchableRipple
} from "react-native-paper";
import getStyles from "./MisPublicacionesScreen.styles";

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
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [cargando, setCargando] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'fecha' | 'vistas' | 'semestre' | 'likes' | 'comentarios'>("fecha");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");

  const handleFilterChange = useCallback((newSortBy: 'fecha' | 'vistas' | 'semestre' | 'likes' | 'comentarios', newSortOrder: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  }, []);
  
  const { width } = useWindowDimensions();

  const handlePress = (pub: PublicacionConMateria) => {
    navigation.navigate('PublicationDetail', {
      publicacionId: pub.id,
      materiaNombre: pub.materiaNombre,
    });
  };

  // ✅ FUNCIÓN CORREGIDA: Usa el servicio existente de likes
  const handleLike = async (publicacion: PublicacionConMateria) => {
    if (!user) return;
    
    try {
      await likesService.darLike(user.uid, publicacion.id);
      // El snapshot listener actualizará automáticamente el estado
    } catch (error) {
      console.error("Error al dar like:", error);
    }
  };

  // ✅ FUNCIÓN NUEVA: Navegar a detalle para comentar
  const handleCommentPress = (publicacion: PublicacionConMateria) => {
    navigation.navigate('PublicationDetail', {
      publicacionId: publicacion.id,
      materiaNombre: publicacion.materiaNombre,
    });
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
        
        // ✅ CORREGIDO: Usa autorUid y totalCalificaciones según tu tipo
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

  let filtered = publicaciones.filter(pub => {
    const s = normalizar(search);
    return (
      normalizar(pub.titulo).includes(s) ||
      normalizar(pub.descripcion).includes(s) ||
      normalizar(pub.materiaNombre).includes(s)
    );
  });

  // ✅ FILTROS CORREGIDOS: Usa totalCalificaciones y totalComentarios
  if (sortBy === 'fecha') {
    filtered = filtered.sort((a, b) => sortOrder === 'desc'
      ? b.fechaPublicacion.getTime() - a.fechaPublicacion.getTime()
      : a.fechaPublicacion.getTime() - b.fechaPublicacion.getTime()
    );
  } else if (sortBy === 'vistas') {
    filtered = filtered.sort((a, b) => sortOrder === 'desc'
      ? (b.vistas || 0) - (a.vistas || 0)
      : (a.vistas || 0) - (b.vistas || 0)
    );
  } else if (sortBy === 'semestre') {
    filtered = filtered.sort((a, b) => {
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
    filtered = filtered.sort((a, b) => sortOrder === 'desc'
      ? (b.totalCalificaciones || 0) - (a.totalCalificaciones || 0)
      : (a.totalCalificaciones || 0) - (b.totalCalificaciones || 0)
    );
  } else if (sortBy === 'comentarios') {
    filtered = filtered.sort((a, b) => sortOrder === 'desc'
      ? (b.totalComentarios || 0) - (a.totalComentarios || 0)
      : (a.totalComentarios || 0) - (b.totalComentarios || 0)
    );
  }

  const styles = getStyles(theme);
  
  function formatearFecha(fecha: Date) {
    return fecha.toLocaleDateString("es-BO", { year: "numeric", month: "short", day: "numeric" });
  }

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Mis Publicaciones" />
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
          <FiltroFlotante
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChange={handleFilterChange}
            theme={theme}
          />
        </View>
        <ScrollView style={styles.scrollView}>
          {cargando ? (
            <ActivityIndicator style={styles.loadingIndicator} />
          ) : filtered.length === 0 ? (
            <Text variant="bodyLarge" style={styles.emptyText}>
              No tienes publicaciones aún.
            </Text>
          ) : (
            filtered.map((pub: PublicacionConMateria) => (
              <Card 
                key={pub.id} 
                style={styles.card}
                onPress={() => handlePress(pub)}
              >
                
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
                        {formatearFecha(pub.fechaPublicacion)}
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
                        {pub.vistas > 0 ? pub.vistas : "0"}
                      </Chip>
                      
                      {/* ✅ LIKE CORREGIDO: Usa totalCalificaciones y servicio existente */}
                      <TouchableRipple 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleLike(pub);
                        }}
                        style={styles.actionButton}
                      >
                        <Chip 
                          icon="heart" 
                          compact 
                          style={styles.statChip} 
                          textStyle={styles.statText}
                        >
                          {pub.totalCalificaciones > 0 ? pub.totalCalificaciones : "0"}
                        </Chip>
                      </TouchableRipple>

                      {/* ✅ COMENTARIO CORREGIDO: Navega al detalle */}
                      <TouchableRipple 
                        onPress={(e) => {
                          e.stopPropagation();
                          handleCommentPress(pub);
                        }}
                        style={styles.actionButton}
                      >
                        <Chip 
                          icon="comment" 
                          compact 
                          style={styles.statChip} 
                          textStyle={styles.statText}
                        >
                          {pub.totalComentarios > 0 ? pub.totalComentarios : "0"}
                        </Chip>
                      </TouchableRipple>
                    </View>
                  </Card.Content>
              </Card>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

type FiltroFlotanteProps = {
  sortBy: 'fecha' | 'vistas' | 'semestre' | 'likes' | 'comentarios';
  sortOrder: 'asc' | 'desc';
  onChange: (sortBy: 'fecha' | 'vistas' | 'semestre' | 'likes' | 'comentarios', sortOrder: 'asc' | 'desc') => void;
  theme: any;
};

function FiltroFlotante({ sortBy, sortOrder, onChange, theme }: FiltroFlotanteProps) {
  const [visible, setVisible] = React.useState(false);
  const styles = getStyles(theme);
  
  return (
    <View style={styles.filtroContainer}>
      <IconButton
        icon="tune"
        size={28}
        onPress={() => setVisible(v => !v)}
        style={styles.filtroButton}
        iconColor={theme.colors.onBackground}
        accessibilityLabel="Abrir filtros"
      />
      {visible && (
        <View style={styles.filtroMenu}>
          <TouchableRipple onPress={() => { onChange('fecha', sortOrder); setVisible(false); }} style={styles.filtroRipple}>
            <View style={sortBy === 'fecha' ? styles.filtroItemActive : styles.filtroItem}>
              <Text style={sortBy === 'fecha' ? styles.filtroTextActive : styles.filtroText}>
                Por fecha
              </Text>
            </View>
          </TouchableRipple>
          <TouchableRipple onPress={() => { onChange('vistas', sortOrder); setVisible(false); }} style={styles.filtroRipple}>
            <View style={sortBy === 'vistas' ? styles.filtroItemActive : styles.filtroItem}>
              <Text style={sortBy === 'vistas' ? styles.filtroTextActive : styles.filtroText}>
                Por vistas
              </Text>
            </View>
          </TouchableRipple>
          <TouchableRipple onPress={() => { onChange('semestre', sortOrder); setVisible(false); }} style={styles.filtroRipple}>
            <View style={sortBy === 'semestre' ? styles.filtroItemActive : styles.filtroItem}>
              <Text style={sortBy === 'semestre' ? styles.filtroTextActive : styles.filtroText}>
                Por semestre
              </Text>
            </View>
          </TouchableRipple>
          <TouchableRipple onPress={() => { onChange('likes', sortOrder); setVisible(false); }} style={styles.filtroRipple}>
            <View style={sortBy === 'likes' ? styles.filtroItemActive : styles.filtroItem}>
              <Text style={sortBy === 'likes' ? styles.filtroTextActive : styles.filtroText}>
                Por likes
              </Text>
            </View>
          </TouchableRipple>
          <TouchableRipple onPress={() => { onChange('comentarios', sortOrder); setVisible(false); }} style={styles.filtroRipple}>
            <View style={sortBy === 'comentarios' ? styles.filtroItemActive : styles.filtroItem}>
              <Text style={sortBy === 'comentarios' ? styles.filtroTextActive : styles.filtroText}>
                Por comentarios
              </Text>
            </View>
          </TouchableRipple>
          <TouchableRipple onPress={() => { onChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc'); setVisible(false); }} style={styles.filtroRipple}>
            <View style={styles.filtroItem}>
              <Text style={styles.filtroText}>
                {sortOrder === 'asc' ? 'Ascendente ▲' : 'Descendente ▼'}
              </Text>
            </View>
          </TouchableRipple>
        </View>
      )}
    </View>
  );
}