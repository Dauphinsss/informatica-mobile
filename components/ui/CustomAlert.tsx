import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, IconButton, Modal, Portal, Text, useTheme } from "react-native-paper";

export type CustomAlertButton = {
  text: string;
  onPress: () => void | Promise<void>;
  mode?: "text" | "outlined" | "contained";
  color?: string;
  preventDismiss?: boolean;
};

export type CustomAlertType = "info" | "success" | "error" | "warning" | "confirm";

interface CustomAlertProps {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  message: string;
  type?: CustomAlertType;
  buttons?: CustomAlertButton[];
}


const ICONS: Record<CustomAlertType, string> = {
  info: "information",
  success: "check-circle",
  error: "alert-circle",
  warning: "alert",
  confirm: "help-circle",
};

export default function CustomAlert({
  visible,
  onDismiss,
  title,
  message,
  type = "info",
  buttons = [
    {
      text: "OK",
      onPress: onDismiss,
      mode: "contained",
    },
  ],
}: CustomAlertProps) {

  const theme = useTheme();
  const lilacStrong = theme.dark ? (theme.colors.secondaryContainer || '#b39ddb') : (theme.colors.primary || '#7c43bd');
  const lilacLight = theme.dark ? (theme.colors.secondary || '#d1b3ff') : (theme.colors.secondaryContainer || '#ede7f6');
  const buttonLilac = theme.dark ? lilacLight : lilacStrong;
  const buttonText = theme.colors.background;
  const colorMap: Record<CustomAlertType, string> = {
    info: buttonLilac,
    success: buttonLilac,
    error: buttonLilac,
    warning: buttonLilac,
    confirm: buttonLilac,
  };
  const iconBgMap: Record<CustomAlertType, string> = {
    info: theme.colors.surfaceVariant || theme.colors.surface,
    success: theme.colors.surfaceVariant || theme.colors.surface,
    error: theme.colors.surfaceVariant || theme.colors.surface,
    warning: theme.colors.surfaceVariant || theme.colors.surface,
    confirm: theme.colors.surfaceVariant || theme.colors.surface,
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.container,
          {
            backgroundColor: theme.colors.elevation?.level1 || theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            minWidth: 280,
            maxWidth: 400,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <IconButton
            icon={ICONS[type]}
            size={24}
            iconColor={colorMap[type]}
            style={{ margin: 0, marginRight: 8, backgroundColor: 'transparent' }}
            disabled
          />
          {title && (
            <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}> {title} </Text>
          )}
        </View>
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant || theme.colors.onSurface }]}> {message} </Text>
        <View style={styles.buttonRow}>
            {buttons.map((btn, idx) => {
              const mode = type === 'success' && !btn.mode ? 'text' : (btn.mode || 'contained');
              return (
                <Button
                  key={idx}
                  mode={mode}
                  onPress={async () => {
                    try {
                      await btn.onPress();
                    } catch (err) {
                      console.error('Error en CustomAlert button onPress:', err);
                    }
                    if (!btn.preventDismiss) onDismiss();
                  }}
                  style={styles.button}
                  buttonColor={mode === 'contained' ? (buttonLilac || btn.color) : undefined}
                  textColor={mode === 'contained' ? buttonText : (btn.color || buttonLilac)}
                >
                  {btn.text}
                </Button>
              );
            })}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 32,
    borderRadius: 12,
    padding: 20,
    alignItems: "flex-start",
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    minWidth: 280,
    maxWidth: 400,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  title: {
    fontWeight: "bold",
    flexShrink: 1,
    fontSize: 18,
    letterSpacing: 0.1,
  },
  message: {
    marginBottom: 18,
    textAlign: "center",
    fontSize: 15,
    letterSpacing: 0.05,
    color: undefined,
    width: '100%',
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    width: '100%',
  },
  button: {
    marginHorizontal: 2,
    minWidth: 90,
    borderRadius: 8,
  },
});