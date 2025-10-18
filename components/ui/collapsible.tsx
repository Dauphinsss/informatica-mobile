import { IconSymbol } from "@/components/ui/icon-symbol";
import { PropsWithChildren, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "react-native-paper";

export function Collapsible({
  children,
  title,
}: PropsWithChildren & { title: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors, dark } = useTheme();

  return (
    <View>
      <TouchableOpacity
        style={styles.heading}
        onPress={() => setIsOpen((value) => !value)}
        activeOpacity={0.8}
      >
        <IconSymbol
          name="chevron.right"
          size={18}
          weight="medium"
          color={dark ? colors.onSurface : colors.onSurface}
          style={{ transform: [{ rotate: isOpen ? "90deg" : "0deg" }] }}
        />

        <Text variant="titleMedium" style={{ fontWeight: "600" }}>
          {title}
        </Text>
      </TouchableOpacity>
      {isOpen && <View style={styles.content}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  content: {
    marginTop: 6,
    marginLeft: 24,
  },
});
