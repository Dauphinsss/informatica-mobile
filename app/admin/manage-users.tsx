import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Divider, List, Searchbar, Text } from 'react-native-paper';
import { db } from '../../firebase';

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
 
  { /* Función para filtrar usuarios según el filtro seleccionado y la búsqueda */ }
  const getFilteredUsers = () => {
    let filtered = users;
    
    { /* Filtrar por rol */ }
    if (filter === 'admin') {
      filtered = filtered.filter(user => user.rol === 'admin');
    } else if (filter === 'user') {
      filtered = filtered.filter(user => user.rol === 'user');
    }
    
    { /* Filtrar por búsqueda */ }
    if (searchQuery.trim() !== '') {
      filtered = filtered.filter(user => 
        user.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.correo.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  };
  
  const filteredUsers = getFilteredUsers();
  const adminUsers = filteredUsers.filter(user => user.rol === 'admin');
  const normalUsers = filteredUsers.filter(user => user.rol === 'user');
  
  const totalAdmins = users.filter(user => user.rol === 'admin').length;
  const totalUsers = users.filter(user => user.rol === 'user').length;

  { /* Función para obtener los usuarios de Firestore */}
  const fetchUsers = async () => {
    const usersCollection = collection(db, 'usuarios');
    const userSnapshot = await getDocs(usersCollection);
    const usersList = userSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    setUsers(usersList);
  }

  { /* Función para alternar el estado de un usuario entre activo y suspendido */}
  const handleToggleStatus = (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'activo' ? 'suspendido' : 'activo';
    const userRef = doc(db, 'usuarios', userId);
    updateDoc(userRef, { estado: newStatus });
    setUsers(users.map(user =>
      user.uid === userId ? { ...user, estado: newStatus } : user
    ))
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Administrar Usuarios" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        
        {/* Buscador dinámico */}
        <Searchbar
          placeholder="Buscar por nombre o email"
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        
        {/* Filtros de usuarios */}
        <View style={styles.filterButtons}>
          <Button
            mode={filter === 'all' ? 'contained' : 'outlined'}
            onPress={() => setFilter('all')}
            style={styles.filterButton}
            compact
          >
            Todos {users.length}
          </Button>
          <Button
            mode={filter === 'user' ? 'contained' : 'outlined'}
            onPress={() => setFilter('user')}
            style={styles.filterButton}
            compact
          >
            Users {totalUsers}
          </Button>
          <Button
            mode={filter === 'admin' ? 'contained' : 'outlined'}
            onPress={() => setFilter('admin')}
            style={styles.filterButton}
            compact
          >
            Admins {totalAdmins}
          </Button>
        </View>
        
        {/* Card para Users */}
        {normalUsers.length > 0 && (filter === 'all' || filter === 'user') && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Usuarios
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {searchQuery ? `${normalUsers.length} de ${totalUsers} usuarios` : `Total: ${normalUsers.length} usuarios`}
              </Text>
              <Divider style={styles.divider} />
            </Card.Content>
            {normalUsers.map(user => (
              <View key={user.uid}>
                <List.Item
                  title={user.nombre}
                  description={user.correo}
                  left={props => <List.Icon {...props} icon="account" />}
                  right={() => (
                    <>
                      {/* Botón dinámico para cambiar el estado del usuario */}
                      <Button 
                        mode="contained-tonal" 
                        onPress={() => handleToggleStatus(user.uid, user.estado || 'activo')} 
                        buttonColor={user.estado === 'suspendido' ? "#e8f5e8" : "#ffebee"}
                        textColor={user.estado === 'suspendido' ? "#2e7d32" : "#c62828"}
                        compact
                      >
                        {user.estado === 'suspendido' ? 'Activar' : 'Suspender'}
                      </Button>
                    </>
                  )}
                />
                <Divider />
              </View>
            ))}
          </Card>
        )}

        {/* Card para Admins */}
        {adminUsers.length > 0 && (filter === 'all' || filter === 'admin') && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Administradores
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {searchQuery ? `${adminUsers.length} de ${totalAdmins} administradores` : `Total: ${adminUsers.length} administradores`}
              </Text>
              <Divider style={styles.divider} />
            </Card.Content>
            {adminUsers.map(user => (
              <View key={user.uid}>
                <List.Item
                  title={user.nombre}
                  description={user.correo}
                  left={props => <List.Icon {...props} icon="shield-account" />}
                  right={() => (
                    <>
                      {/* Botón dinámico para cambiar el estado del usuario */}
                      <Button 
                        mode="contained-tonal" 
                        onPress={() => handleToggleStatus(user.uid, user.estado || 'activo')} 
                        buttonColor={user.estado === 'suspendido' ? "#e8f5e8" : "#ffebee"}
                        textColor={user.estado === 'suspendido' ? "#2e7d32" : "#c62828"}
                        compact
                      >
                        {user.estado === 'suspendido' ? 'Activar' : 'Suspender'}
                      </Button>
                    </>
                  )}
                />
                <Divider />
              </View>
            ))}
          </Card>
        )}
        
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchbar: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 16,
  },
  filterButton: {
    marginHorizontal: 4,
    flex: 1,
  }
});

export default ManageUsers;