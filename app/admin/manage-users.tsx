import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Divider, List, Text } from 'react-native-paper';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const navigation = useNavigation();
  const adminUsers = users.filter(user => user.rol === 'admin');
  const normalUsers = users.filter(user => user.rol === 'user');

  { /* Función para obtener los usuarios de Firestore */}
  const fetchUsers = async () => {
    const usersCollection = collection(db, 'usuarios');
    const userSnapshot = await getDocs(usersCollection);
    const usersList = userSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id }));
    setUsers(usersList);
  }

  { /* Función para actualizar el estado de un usuario (activo, suspendido, baneado) */}
  const handleChangeStatus = (userId: string, newStatus: string) => {
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
        
        {/* Card para Admins */}
        {adminUsers.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Administradores
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Total de administradores: {adminUsers.length}
              </Text>
              <Divider style={styles.divider} />
            </Card.Content>
            {adminUsers.map(user => (
              <View key={user.uid}>
                <List.Item
                  title={user.nombre}  // Mostrar el nombre del usuario
                  description={user.correo}  // Mostrar el correo del usuario
                  left={props => <List.Icon {...props} icon="account" />}
                  right={() => (
                    <>
                      {/* Botón para cambiar el estado del usuario */}
                      <Button 
                        mode="contained-tonal" 
                        onPress={() => handleChangeStatus(user.uid, 'suspendido')} 
                        buttonColor="#ffebee"
                        textColor="#c62828"
                      >
                        Suspender
                      </Button>
                    </>
                  )}
                />
                <Divider />
              </View>
            ))}
          </Card>
        )}

        {/* Card para Users */}
        {normalUsers.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Usuarios
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Total de usuarios: {normalUsers.length}
              </Text>
              <Divider style={styles.divider} />
            </Card.Content>
            {normalUsers.map(user => (
              <View key={user.uid}>
                <List.Item
                  title={user.nombre}  // Mostrar el nombre del usuario
                  description={user.correo}  // Mostrar el correo del usuario
                  left={props => <List.Icon {...props} icon="account" />}
                  right={() => (
                    <>
                      {/* Botón para cambiar el estado del usuario */}
                      <Button 
                        mode="contained-tonal" 
                        onPress={() => handleChangeStatus(user.uid, 'suspendido')} 
                        buttonColor="#ffebee"
                        textColor="#c62828"
                      >
                        Suspender
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
});

export default ManageUsers;