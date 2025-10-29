import { useTheme } from "@/contexts/ThemeContext";
import { auth, db } from "@/firebase";
import { Publicacion } from "@/scripts/types/Publication.type";
import { getDocs, collection } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
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
import { obtenerPublicacionesPorAutor,
  escucharPublicacionesPorAutor
} from "@/scripts/services/Publications";

interface Materia {
  id: string;
  nombre: string;
  semestre: number;
}

type PublicacionConMateria = Publicacion & { materiaNombre: string; materiaSemestre: number };

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
  const [sortBy, setSortBy] = useState<'fecha' | 'vistas' | 'semestre'>("fecha");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>("desc");

  const handleFilterChange = useCallback((newSortBy: 'fecha' | 'vistas' | 'semestre', newSortOrder: 'asc' | 'desc') => {
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
        setPublicaciones(
          pubs.map(pub => {
            const materia = mats.find((m: Materia) => m.id === pub.materiaId);
            return {
              ...pub,
              materiaNombre: materia?.nombre || "Materia",
              materiaSemestre: materia?.semestre || 0,
            };
          }) as (Publicacion & { materiaNombre: string; materiaSemestre: number })[]
        );
        unsubscribe = escucharPublicacionesPorAutor(user.uid, (pubs) => {
          if (!isMounted) return;
          setPublicaciones(
            pubs.map(pub => {
              const materia = mats.find((m: Materia) => m.id === pub.materiaId);
              return {
                ...pub,
                materiaNombre: materia?.nombre || "Materia",
                materiaSemestre: materia?.semestre || 0,
              };
            }) as (Publicacion & { materiaNombre: string; materiaSemestre: number })[]
          );
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
                      {pub.vistas > 0 ? pub.vistas : ""}
                    </Chip>
                    {pub.totalComentarios > 0 && (
                      <Chip icon="comment" compact style={styles.statChip} textStyle={styles.statText}>{pub.totalComentarios}</Chip>
                    )}
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
  sortBy: 'fecha' | 'vistas' | 'semestre';
  sortOrder: 'asc' | 'desc';
  onChange: (sortBy: 'fecha' | 'vistas' | 'semestre', sortOrder: 'asc' | 'desc') => void;
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