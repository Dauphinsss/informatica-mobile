import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { Appbar, Button, Card, Dialog, Divider, List, Paragraph, Portal, Searchbar, Text } from 'react-native-paper';
import { auth, db } from '../../firebase';

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigation = useNavigation();
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<'activate' | 'suspend'>('suspend');
 
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

  const handleToggleExpand = (userId: string) => {
    setExpandedUser(prevState => (prevState === userId ? null : userId));
  };

  const handleCloseCollapse = () => {
    setExpandedUser(null);
  };

  const openConfirmDialog = (user: any, action: 'activate' | 'suspend') => {
    setSelectedUser(user);
    setActionType(action);
    setDialogVisible(true);
  };

  const confirmAction = async () => {
    if (!selectedUser) return;

    const newStatus = actionType === 'activate' ? 'activo' : 'suspendido';
    
    try {
      const userRef = doc(db, 'usuarios', selectedUser.uid);
      await updateDoc(userRef, { estado: newStatus });
      
      setUsers(users.map(user =>
        user.uid === selectedUser.uid ? { ...user, estado: newStatus } : user
      ));
      
      setDialogVisible(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error al actualizar el estado del usuario:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <TouchableWithoutFeedback onPress={handleCloseCollapse}>
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
                  <TouchableWithoutFeedback>
                    <View>
                      <List.Item
                        title={user.nombre}
                        description={`${user.correo} • Estado: ${user.estado || 'activo'}`}
                        left={props => <List.Icon {...props} icon="account" />}
                        right={props => (
                          <TouchableOpacity onPress={() => handleToggleExpand(user.uid)}>
                            <MaterialCommunityIcons 
                              name={expandedUser === user.uid ? "chevron-up" : "chevron-down"} 
                              size={24} 
                              color="#666" 
                            />
                          </TouchableOpacity>
                        )}
                        onPress={() => handleToggleExpand(user.uid)}
                      />
                      
                      {/* Collapse personalizado */}
                      {expandedUser === user.uid && (
                        <TouchableWithoutFeedback>
                          <View style={styles.collapseContent}>
                            <Text variant="bodySmall" style={styles.actionsLabel}>
                              Acciones de usuario:
                            </Text>
                            <View style={styles.actionButtons}>
                              <Button
                                mode="contained"
                                onPress={() => openConfirmDialog(user, 'suspend')}
                                disabled={user.estado === 'suspendido' || user.uid === auth.currentUser?.uid}
                                buttonColor="#ffebee"
                                textColor="#c62828"
                                style={styles.actionButton}
                                icon="account-cancel"
                              >
                                Suspender
                              </Button>
                              <Button
                                mode="contained"
                                onPress={() => openConfirmDialog(user, 'activate')}
                                disabled={user.estado === 'activo' || user.uid === auth.currentUser?.uid}
                                buttonColor="#e8f5e8"
                                textColor="#2e7d32"
                                style={styles.actionButton}
                                icon="account-check"
                              >
                                Activar
                              </Button>
                            </View>
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </View>
                  </TouchableWithoutFeedback>
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
                  <TouchableWithoutFeedback>
                    <View>
                      <List.Item
                        title={user.nombre}
                        description={`${user.correo} • Estado: ${user.estado || 'activo'}`}
                        left={props => <List.Icon {...props} icon="shield-account" />}
                        right={props => (
                          <TouchableOpacity onPress={() => handleToggleExpand(user.uid)}>
                            <MaterialCommunityIcons 
                              name={expandedUser === user.uid ? "chevron-up" : "chevron-down"} 
                              size={24} 
                              color="#666" 
                            />
                          </TouchableOpacity>
                        )}
                        onPress={() => handleToggleExpand(user.uid)}
                      />
                      
                      {/* Collapse personalizado */}
                      {expandedUser === user.uid && (
                        <TouchableWithoutFeedback>
                          <View style={styles.collapseContent}>
                            <Text variant="bodySmall" style={styles.actionsLabel}>
                              Acciones de administrador:
                            </Text>
                            <View style={styles.actionButtons}>
                              <Button
                                mode="contained"
                                onPress={() => openConfirmDialog(user, 'suspend')}
                                disabled={user.estado === 'suspendido' || user.uid === auth.currentUser?.uid}
                                buttonColor="#ffebee"
                                textColor="#c62828"
                                style={styles.actionButton}
                                icon="account-cancel"
                              >
                                Suspender
                              </Button>
                              <Button
                                mode="contained"
                                onPress={() => openConfirmDialog(user, 'activate')}
                                disabled={user.estado === 'activo' || user.uid === auth.currentUser?.uid}
                                buttonColor="#e8f5e8"
                                textColor="#2e7d32"
                                style={styles.actionButton}
                                icon="account-check"
                              >
                                Activar
                              </Button>
                            </View>
                          </View>
                        </TouchableWithoutFeedback>
                      )}
                    </View>
                  </TouchableWithoutFeedback>
                  <Divider />
                </View>
              ))}
            </Card>
          )}
          
        </ScrollView>

        {/* Dialog de confirmación */}
        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>
              {actionType === 'activate' ? 'Activar Usuario' : 'Suspender Usuario'}
            </Dialog.Title>
            <Dialog.Content>
              <Text>
                {actionType === 'activate' 
                  ? `¿Estás seguro de que quieres activar a ${selectedUser?.nombre}?`
                  : `¿Estás seguro de que quieres suspender a ${selectedUser?.nombre}?`
                }
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancelar</Button>
              <Button 
                onPress={confirmAction}
                buttonColor={actionType === 'activate' ? '#2e7d32' : '#c62828'}
                textColor="white"
                mode="contained"
              >
                {actionType === 'activate' ? 'Activar' : 'Suspender'}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    </TouchableWithoutFeedback>
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
  },
  
  // Nuevos estilos para collapse
  collapseContent: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#6200ea',
  },
  actionsLabel: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default ManageUsers;