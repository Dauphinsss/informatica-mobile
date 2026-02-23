
import React from "react";
import type { MD3Theme } from "react-native-paper";
import { SortOption, SortableChips, SortOrder } from "./SortableChips";

export type SortBy = "fecha" | "vistas" | "likes" | "comentarios" | "semestre";

interface PublicationFiltersProps {
  sortBy: SortBy;
  sortOrder: SortOrder;
  onFilterChange: (sortBy: SortBy, sortOrder: SortOrder) => void;
  theme: MD3Theme;
  styles?: any;
  showSemestreFilter?: boolean;
}

export const PublicationFilters: React.FC<PublicationFiltersProps> = ({
  sortBy,
  sortOrder,
  onFilterChange,
  theme,
  showSemestreFilter = false,
}) => {
  const baseFilterOptions: SortOption<SortBy>[] = [
    { key: "fecha", label: "Fecha" },
    { key: "vistas", label: "Vistas" },
    { key: "likes", label: "Likes" },
    { key: "comentarios", label: "Comentarios" },
  ];

  let filterOptions = [...baseFilterOptions];

  if (showSemestreFilter) {
    filterOptions.splice(2, 0, { key: "semestre", label: "Semestre" });
  }

  return (
    <SortableChips
      sortBy={sortBy}
      sortOrder={sortOrder}
      onFilterChange={onFilterChange}
      options={filterOptions}
      theme={theme}
    />
  );
};
