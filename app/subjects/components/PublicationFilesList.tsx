import React from "react";
import { View } from "react-native";
import { Card, IconButton, Text } from "react-native-paper";
import PublicationFileCard from "./PublicationFileCard";
import { ArchivoPublicacion } from "@/scripts/types/Publication.type";

type StagedAddItem = {
  id: string;
  file?: { name?: string };
  name?: string;
  nombreEnlace?: string;
  url?: string;
  esEnlaceExterno?: boolean;
  subiendo?: boolean;
  progreso?: number;
};

type PublicationFilesListProps = {
  files: ArchivoPublicacion[];
  styles: any;
  theme: any;
  editMode?: boolean;
  downloadProgress?: number;
  openingProgress?: number;
  isMarked?: (archivo: ArchivoPublicacion) => boolean;
  isDownloading?: (archivo: ArchivoPublicacion) => boolean;
  isOpening?: (archivo: ArchivoPublicacion) => boolean;
  fileStatusText?: (archivo: ArchivoPublicacion) => string | undefined;
  onPressFile: (archivo: ArchivoPublicacion) => void;
  onDownloadOrOpen: (archivo: ArchivoPublicacion) => void;
  onDeleteToggle?: (archivo: ArchivoPublicacion) => void;
  renderPreview?: (archivo: ArchivoPublicacion, isDownloading: boolean) => React.ReactNode;
  getOpeningLabel?: (archivo: ArchivoPublicacion) => string;
  stagedAdds?: StagedAddItem[];
  onRemoveStagedAdd?: (id: string) => void;
  showAddCard?: boolean;
  onPressAddFiles?: () => void;
  fileProcessing?: boolean;
};

export default function PublicationFilesList({
  files,
  styles,
  theme,
  editMode = false,
  downloadProgress = 0,
  openingProgress = 0,
  isMarked,
  isDownloading,
  isOpening,
  fileStatusText,
  onPressFile,
  onDownloadOrOpen,
  onDeleteToggle,
  renderPreview,
  getOpeningLabel,
  stagedAdds = [],
  onRemoveStagedAdd,
  showAddCard = false,
  onPressAddFiles,
  fileProcessing = false,
}: PublicationFilesListProps) {
  return (
    <View style={styles.archivosGrid}>
      {files.map((archivo) => {
        const marked = isMarked ? isMarked(archivo) : false;
        const downloading = isDownloading ? isDownloading(archivo) : false;
        const opening = isOpening ? isOpening(archivo) : false;
        const status = fileStatusText ? fileStatusText(archivo) : undefined;

        return (
          <PublicationFileCard
            key={archivo.id}
            archivo={archivo}
            isMarked={marked}
            isDownloading={downloading}
            isOpening={opening}
            fileStatusText={status}
            downloadProgress={downloadProgress}
            openingProgress={openingProgress}
            editMode={editMode}
            onPress={() => onPressFile(archivo)}
            onDownloadOrOpen={() => onDownloadOrOpen(archivo)}
            onDeleteToggle={onDeleteToggle ? () => onDeleteToggle(archivo) : undefined}
            renderPreview={renderPreview}
            getOpeningLabel={getOpeningLabel}
            styles={styles}
            theme={theme}
          />
        );
      })}

      {stagedAdds.map((s) => (
        <View key={s.id} style={styles.archivoCardWrapper}>
          <Card style={[styles.archivoCard]}>
            <View style={styles.archivoRow}>
              <View style={styles.archivoThumb}>
                <View style={styles.iconFallbackContainer}>
                  <IconButton
                    icon={s.esEnlaceExterno ? "link-variant" : "file-document"}
                    size={28}
                    iconColor={theme.colors.primary}
                    style={{ margin: 0 }}
                  />
                </View>
              </View>

              <View style={styles.archivoMeta}>
                <Text variant="bodyMedium" style={styles.archivoTitle} numberOfLines={1}>
                  {s.name || s.nombreEnlace || s.file?.name || "Nuevo archivo"}
                </Text>
                {s.esEnlaceExterno && s.url ? (
                  <Text style={styles.archivoSubtitle} numberOfLines={1}>
                    {s.url}
                  </Text>
                ) : (
                  <Text style={styles.archivoSubtitle} numberOfLines={1}>
                    {s.subiendo
                      ? `Subiendo... ${s.progreso || 0}%`
                      : s.progreso === 100
                        ? "Subido"
                        : "Pendiente"}
                  </Text>
                )}
              </View>

              <IconButton
                icon="close"
                size={18}
                onPress={() => onRemoveStagedAdd?.(s.id)}
                style={styles.archivoTrailing}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </View>
          </Card>
        </View>
      ))}

      {showAddCard && (
        <View style={styles.archivoCardWrapper}>
          <Card
            style={[
              styles.addFileCard,
              { backgroundColor: theme.colors.elevation.level1 },
            ]}
            onPress={onPressAddFiles}
          >
            <View style={styles.addFileRow}>
              <IconButton
                icon="plus"
                size={20}
                disabled={fileProcessing}
                iconColor={theme.colors.primary}
                style={{ margin: 0 }}
              />
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurface, fontWeight: "600" }}
              >
                Agregar archivos
              </Text>
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}

