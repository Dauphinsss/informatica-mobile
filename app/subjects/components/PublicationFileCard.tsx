import React from "react";
import { View } from "react-native";
import { Card, IconButton, ProgressBar, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ArchivoPublicacion } from "@/scripts/types/Publication.type";

type PublicationFileCardProps = {
  archivo: ArchivoPublicacion;
  isMarked?: boolean;
  isDownloading?: boolean;
  isOpening?: boolean;
  fileStatusText?: string;
  downloadProgress?: number;
  openingProgress?: number;
  editMode?: boolean;
  onPress: () => void;
  onDownloadOrOpen?: () => void;
  onDeleteToggle?: () => void;
  renderPreview?: (archivo: ArchivoPublicacion, isDownloading: boolean) => React.ReactNode;
  getOpeningLabel?: (archivo: ArchivoPublicacion) => string;
  styles: any;
  theme: any;
};

export default function PublicationFileCard({
  archivo,
  isMarked = false,
  isDownloading = false,
  isOpening = false,
  fileStatusText,
  downloadProgress = 0,
  openingProgress = 0,
  editMode = false,
  onPress,
  onDownloadOrOpen,
  onDeleteToggle,
  renderPreview,
  getOpeningLabel,
  styles,
  theme,
}: PublicationFileCardProps) {
  const subtitle = isDownloading
    ? `Descargando... ${downloadProgress}%`
    : isOpening
      ? getOpeningLabel?.(archivo) || "Abriendo..."
      : fileStatusText
        ? fileStatusText
        : archivo.esEnlaceExterno
          ? "Enlace"
          : archivo.tipoNombre || "Archivo";

  return (
    <View style={styles.archivoCardWrapper}>
      <Card
        style={[styles.archivoCard, isMarked ? { opacity: 0.45 } : undefined]}
        onPress={onPress}
      >
        <View style={styles.archivoRow}>
          <View style={styles.archivoThumb}>
            {renderPreview ? (
              renderPreview(archivo, isDownloading)
            ) : (
              <View style={styles.iconFallbackContainer}>
                <MaterialCommunityIcons
                  name={archivo.esEnlaceExterno ? "link-variant" : "file-document-outline"}
                  size={22}
                  color={theme.colors.primary}
                />
              </View>
            )}
          </View>

          <View style={styles.archivoMeta}>
            <View style={styles.archivoTitleRow}>
              <Text variant="bodyMedium" style={styles.archivoTitle} numberOfLines={1}>
                {archivo.titulo}
              </Text>
            </View>
            <Text style={styles.archivoSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
            {isDownloading && (
              <ProgressBar
                progress={downloadProgress > 0 ? downloadProgress / 100 : undefined}
                indeterminate={downloadProgress <= 0}
                color={theme.colors.primary}
                style={styles.downloadingProgressBar}
              />
            )}
            {isOpening && (
              <ProgressBar
                progress={openingProgress > 0 ? openingProgress : undefined}
                indeterminate={openingProgress <= 0}
                color={theme.colors.primary}
                style={styles.openingProgressBar}
              />
            )}
            {isMarked && (
              <Text
                style={{ color: theme.colors.error, fontSize: 12, marginTop: 4 }}
                numberOfLines={1}
              >
                Se eliminará al guardar
              </Text>
            )}
          </View>

          {!editMode ? (
            <IconButton
              icon={
                archivo.esEnlaceExterno
                  ? "link-variant"
                  : isDownloading
                    ? "close"
                    : "download"
              }
              size={20}
              onPress={onDownloadOrOpen}
              style={styles.archivoTrailing}
              iconColor={isDownloading ? theme.colors.error : theme.colors.onSurface}
              disabled={isOpening}
            />
          ) : (
            <IconButton
              icon={isMarked ? "check" : "close"}
              size={18}
              onPress={onDeleteToggle}
              style={styles.archivoTrailing}
              iconColor={isMarked ? theme.colors.primary : theme.colors.onSurfaceVariant}
            />
          )}
        </View>
      </Card>
    </View>
  );
}

