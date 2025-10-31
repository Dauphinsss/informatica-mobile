import { useTheme } from '@/contexts/ThemeContext';
import { comentariosService } from '@/services/comments.service';
import { useHeaderHeight } from '@react-navigation/elements';
import { getAuth } from 'firebase/auth';
import React, { useState } from 'react';
import { Keyboard, StyleSheet, View } from 'react-native';
import { Avatar, IconButton, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

interface CommentInputProps {
  publicacionId: string;
  placeholder?: string;
  onSubmit?: (contenido: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  onCommentAdded?: () => void;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  publicacionId,
  placeholder = "Añade un comentario...",
  onSubmit,
  onCancel,
  autoFocus = false,
  onCommentAdded
}) => {
  const { theme } = useTheme();
  const auth = getAuth();
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const headerHeight = useHeaderHeight();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      paddingBottom: 8,
      backgroundColor: theme.colors.background,
    },
    inputContainer: {
      flex: 1,
      marginLeft: 12,
    },
    input: {
      backgroundColor: theme.colors.surface,
      maxHeight: 100,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 8,
      gap: 8,
    },
    safeArea: {
      backgroundColor: theme.colors.background,
    }
  });

  const handleSubmit = async () => {
    if (!text.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(text.trim());
      } else {
        await comentariosService.crearComentario({
          publicacionId,
          autorUid: auth.currentUser!.uid,
          autorNombre: auth.currentUser?.displayName || 'Usuario',
          autorFoto: auth.currentUser?.photoURL || undefined,
          contenido: text.trim(),
          estado: 'activo',
          likes: 0,
          nivel: 0
        });
      }
      
      setText('');
      Keyboard.dismiss();
      onCommentAdded?.();
    } catch (error) {
      console.error('Error enviando comentario:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setText('');
    Keyboard.dismiss();
    onCancel?.();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <View style={styles.container}>
        <Avatar.Image
          size={36}
          source={{ uri: auth.currentUser?.photoURL || undefined }}
          style={{ backgroundColor: theme.colors.outline }}
        />
        
        <View style={styles.inputContainer}>
          <TextInput
            mode="outlined"
            placeholder={placeholder}
            value={text}
            onChangeText={setText}
            multiline
            style={styles.input}
            autoFocus={autoFocus}
            outlineColor={theme.colors.outline}
            activeOutlineColor={theme.colors.primary}
            placeholderTextColor={theme.colors.onSurfaceVariant}
            dense
          />
          
          <View style={styles.actions}>
            {onCancel && (
              <IconButton
                icon="close"
                size={20}
                onPress={handleCancel}
                disabled={submitting}
                iconColor={theme.colors.onSurfaceVariant}
              />
            )}
            <IconButton
              icon="send"
              size={20}
              onPress={handleSubmit}
              disabled={!text.trim() || submitting}
              iconColor={text.trim() ? theme.colors.primary : theme.colors.onSurfaceDisabled}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};