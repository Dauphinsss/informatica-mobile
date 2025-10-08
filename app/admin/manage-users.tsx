import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Card, Divider, List, Text } from 'react-native-paper';
import { USERS_MOCK } from './mock-users';

const ManageUsers = () => {
  const [users, setUsers] = useState(USERS_MOCK);
  const navigation = useNavigation();

  const handleDelete = (userId: number) => {
    setUsers(users.filter(user => user.id !== userId));
  }

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
              <View key={user.id}>
                <List.Item
                  title={user.name}
                  description={user.email}
                  left={props => <List.Icon {...props} icon="account" />}
                  right={() => (
                    <Button 
                      mode="contained-tonal" 
                      onPress={() => handleDelete(user.id)}
                      buttonColor="#ffebee"
                      textColor="#c62828"
                    >
                      Banear
                    </Button>
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