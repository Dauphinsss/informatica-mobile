import React, { useEffect, useRef, useState } from "react";
import { Dimensions, View } from "react-native";
import { Button, Chip, IconButton, Modal, Portal, Text, TextInput, useTheme } from "react-native-paper";

type Props = {
  visible: boolean;
  
  
  onDismiss: (saved: boolean, motivo?: string) => void;
  onConfirm: (motivo: string) => Promise<void> | void;
  initialSelection?: string;
  motives?: string[]; 
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  maxWidth?: number;
  allowCustomReason?: boolean;
};

const MOTIVOS = [
  "Spam",
  "Contenido inapropiado",
  "Acoso o bullying",
  "Información falsa",
  "Otra razón...",
];

export default function ReportReasonModal({
  visible,
  onDismiss,
  onConfirm,
  initialSelection,
  motives: motivesProp,
  title: titleProp,
  confirmLabel: confirmLabelProp,
  cancelLabel: cancelLabelProp,
  maxWidth: propsMaxWidth,
  allowCustomReason: allowCustomReasonProp,
}: Props) {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  const [loading, setLoading] = useState(false);
  const { colors } = useTheme();
  const dismissedByButton = useRef(false);

  const deviceWidth = Dimensions.get("window").width;
  const modalWidth = Math.min(propsMaxWidth || 400, deviceWidth * 0.9);
  const motivesList = motivesProp && motivesProp.length > 0 ? motivesProp : MOTIVOS;
  const titleText = titleProp || "Selecciona el motivo";
  const confirmText = confirmLabelProp || "Denunciar";
  const cancelText = cancelLabelProp || "Cancelar";
  const allowCustom = allowCustomReasonProp !== false;

  useEffect(() => {
    if (visible) {
      if (initialSelection) {
        if (motivesList.includes(initialSelection)) {
          setMotivoSeleccionado(initialSelection);
          setMotivoPersonalizado("");
        } else {
          setMotivoSeleccionado("Otra razón...");
          setMotivoPersonalizado(initialSelection);
        }
      } else {
        setMotivoSeleccionado("");
        setMotivoPersonalizado("");
      }
    }
  }, [visible, initialSelection]);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      const motivo = motivoSeleccionado === "Otra razón..." ? motivoPersonalizado : motivoSeleccionado;
      await onConfirm(motivo);
      setMotivoSeleccionado("");
      setMotivoPersonalizado("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={() => {
          if (dismissedByButton.current) {
            dismissedByButton.current = false;
            return;
          }
          if (loading) return;
          const motivo = motivoSeleccionado === "Otra razón..." ? motivoPersonalizado : motivoSeleccionado;
          onDismiss(true, motivo);
        }}
        contentContainerStyle={{
          backgroundColor: colors.surface,
          paddingHorizontal: "5%",
          paddingVertical: 20,
          marginHorizontal: "5%",
          marginVertical: 20,
          borderRadius: 12,
          maxHeight: "90%",
          width: modalWidth,
          maxWidth: 400,
          minWidth: 260,
          alignSelf: "center",
        }}
      >
        {motivoSeleccionado === "Otra razón..." ? (
          <>
            <View style={{ minHeight: 40, justifyContent: "center" }}>
              <View style={{ position: "absolute", left: -10, top: -10, zIndex: 10 }}>
                <IconButton
                  icon="arrow-left"
                  size={22}
                  onPress={() => setMotivoSeleccionado("")}
                  style={{ margin: 0, padding: 0, backgroundColor: "transparent" }}
                  iconColor={colors.primary}
                />
              </View>
                <Text variant="titleMedium" style={{ flex: 1, textAlign: "center" }}>
                  {titleText}
                </Text>
            </View>

            <TextInput
              mode="outlined"
              label="Escribe el motivo"
              value={motivoPersonalizado}
              onChangeText={setMotivoPersonalizado}
              style={{ marginBottom: 8, marginTop: 8, minHeight: 36, maxHeight: 120, width: "100%", alignSelf: "center" }}
              maxLength={200}
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 12,  marginBottom: 0, flexWrap: "wrap" }}>
              <Button
                icon="close"
                mode="text"
                onPress={() => {
                  dismissedByButton.current = true;
                  setMotivoSeleccionado("");
                  setMotivoPersonalizado("");
                  onDismiss(false);
                }}
                style={{ marginRight: 8 }}
                disabled={loading}
              >
                {cancelText}
              </Button>
              <Button mode="contained" onPress={handleConfirm} disabled={motivoPersonalizado.trim().length === 0 || loading} loading={loading}>
                {confirmText}
              </Button>
            </View>
          </>
        ) : (
          <>
            <Text variant="titleMedium" style={{ marginBottom: 16, textAlign: "center" }}>
              {titleText}
            </Text>
            <View style={{ flexDirection: "column", marginBottom: 8, alignItems: "center" }}>
              {motivesList.map((motivo) => (
                <Chip
                  key={motivo}
                  selected={motivoSeleccionado === motivo}
                  onPress={() => setMotivoSeleccionado(motivo)}
                  style={{
                    marginBottom: 8,
                    alignSelf: "center",
                    width: "90%",
                    maxWidth: 360,
                    backgroundColor: motivoSeleccionado === motivo ? colors.primary : undefined,
                  }}
                  textStyle={{ color: motivoSeleccionado === motivo ? "#fff" : colors.onSurface }}
                >
                  {motivo}
                </Chip>
              ))}
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", marginTop: 0 }}>
              <Button
                icon="close"
                mode="text"
                onPress={() => {
                  dismissedByButton.current = true;
                  setMotivoSeleccionado("");
                  setMotivoPersonalizado("");
                  onDismiss(false);
                }}
                style={{ marginRight: 8 }}
                disabled={loading}
              >
                {cancelText}
              </Button>
               <Button mode="contained" onPress={handleConfirm} disabled={!motivoSeleccionado || loading} loading={loading}>
                {confirmText}
              </Button>
            </View>
          </>
        )}
      </Modal>
    </Portal>
  );
}