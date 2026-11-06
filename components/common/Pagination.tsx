import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  style?: object;
}

export const getPageItems = (
  current: number,
  total: number,
): (number | "...")[] => {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

  const items: (number | "...")[] = [];
  if (current <= 3) {
    items.push(1, 2, 3, "...", total);
  } else if (current >= total - 2) {
    items.push(1, "...", total - 2, total - 1, total);
  } else {
    items.push(1, "...", current, "...", total);
  }
  return items;
};

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  style,
}) => {
  if (totalPages <= 1) return null;

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        disabled={currentPage === 1}
        onPress={() => onPageChange(Math.max(currentPage - 1, 1))}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="arrow-back"
          size={18}
          color={currentPage === 1 ? "#CBD5E1" : "#0F172A"}
        />
      </TouchableOpacity>

      {getPageItems(currentPage, totalPages).map((p, idx) =>
        p === "..." ? (
          <Text key={`dots-${idx}`} style={styles.dotsText}>
            ...
          </Text>
        ) : (
          <TouchableOpacity
            key={`page-${p}`}
            onPress={() => onPageChange(p)}
            style={[
              styles.pageButton,
              p === currentPage && styles.activePageButton,
            ]}
          >
            <Text
              style={[
                styles.pageText,
                p === currentPage && styles.activePageText,
              ]}
            >
              {p}
            </Text>
          </TouchableOpacity>
        ),
      )}

      <TouchableOpacity
        disabled={currentPage === totalPages}
        onPress={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons
          name="arrow-forward"
          size={18}
          color={currentPage === totalPages ? "#CBD5E1" : "#0F172A"}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 14,
    paddingBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
  },
  dotsText: {
    color: "#0F172A",
    fontSize: 14,
    fontWeight: "600",
  },
  pageButton: {
    minWidth: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  activePageButton: {
    backgroundColor: "#1F1B3A",
  },
  pageText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0F172A",
  },
  activePageText: {
    color: "#FFFFFF",
  },
});

export default React.memo(Pagination);
