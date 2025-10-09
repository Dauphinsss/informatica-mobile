import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Divider, List, Text } from 'react-native-paper';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const ManageUsers = () => {
  const [users, setUsers] = useState<any[]>([]);
  const navigation = useNavigation();

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
    updateDoc(userRef, { status: newStatus });
    setUsers(users.map(user =>
      user.uid === userId ? { ...user, status: newStatus } : user
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
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Usuarios del Sistema
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Total de usuarios: {users.length}
            </Text>
            <Divider style={styles.divider} />
          </Card.Content>

          {users.length === 0 ? (
            <Card.Content>
              <Text>No hay usuarios registrados</Text>
            </Card.Content>
          ) : (
            users.map(user => (
              <View key={user.uid}>
                <List.Item
                  title={user.nombre}
                  description={user.correo}
                  left={props => <List.Icon {...user.foto } icon="account" />}
                  right={() => (
                    <>
                      {/* Botones para cambiar el estado del usuario */}
                      {user.estado === "activo" ? (
                        <Button 
                          mode="contained-tonal" 
                          onPress={() => handleChangeStatus(user.uid, "suspendido")}
                          buttonColor="#ffebee"
                          textColor="#c62828"
                        >
                          Suspender
                        </Button>
                      ) : user.estado === "suspendido" ? (
                        <Button
                          mode="contained-tonal"
                          onPress={() => handleChangeStatus(user.uid, "activo")}
                          buttonColor="#a5d6a7"
                          textColor="#2e7d32"
                        >
                          Restaurar
                        </Button>
                      ) : (
                        <Button
                          mode="contained-tonal"
                          onPress={() => handleChangeStatus(user.uid, "activo")}
                          buttonColor="#a5d6a7"
                          textColor="#2e7d32"
                        >
                          Activar
                        </Button>
                      )}
                    </>
                  )}
                />
                <Divider />
              </View>
            ))
          )}
        </Card>
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