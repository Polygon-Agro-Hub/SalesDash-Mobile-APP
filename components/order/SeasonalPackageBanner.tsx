import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";

interface SeasonalPackageBannerProps {
  packageId?: number | string | null;
  /**
   * Optional fallback package details if available
   */
  initialPackageType?: string;
  initialEndDate?: string;
  containerStyle?: object;
}

const getDeliveryCutoffDate = (endDateStr?: string | null): string | null => {
  if (!endDateStr) return null;
  try {
    let year: number;
    let month: number;
    let day: number;

    const str = String(endDateStr).trim();
    if (str.includes("T") || str.includes("Z")) {
      const d = new Date(str);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    } else if (str.includes("-")) {
      const parts = str.split("T")[0].split("-");
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else {
      const d = new Date(str);
      year = d.getFullYear();
      month = d.getMonth();
      day = d.getDate();
    }

    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

    // Delivery cutoff is [Expire Date] - 2 days
    const cutoffDate = new Date(year, month, day);
    cutoffDate.setDate(cutoffDate.getDate() - 2);

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const displayDay = cutoffDate.getDate();
    const displayMonth = monthNames[cutoffDate.getMonth()];
    const displayYear = cutoffDate.getFullYear();

    return `${displayDay} ${displayMonth} ${displayYear}`;
  } catch (err) {
    console.error("Error calculating delivery cutoff date in SeasonalPackageBanner:", err);
    return null;
  }
};

export const SeasonalPackageBanner: React.FC<SeasonalPackageBannerProps> = ({
  packageId,
  containerStyle,
}) => {
  const [packageType, setPackageType] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const currentFetchIdRef = useRef<number | null>(null);

  const fetchLivePackageData = useCallback(async (pkgIdNum: number) => {
    currentFetchIdRef.current = pkgIdNum;
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) return;

      // Always fetch directly from DB/API with cache buster and no-cache headers
      const response = await axios.get<{
        data: {
          id: number;
          displayName: string;
          packageType?: string;
          startDate?: string;
          endDate?: string;
        };
      }>(
        `${environment.API_BASE_URL}api/packages/marketplace-package/${pkgIdNum}?_t=${Date.now()}`,
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );

      // Verify this is still the active package request
      if (currentFetchIdRef.current !== pkgIdNum) return;

      if (response.data && response.data.data) {
        setPackageType(response.data.data.packageType || null);
        setEndDate(response.data.data.endDate || null);
      } else {
        setPackageType(null);
        setEndDate(null);
      }
    } catch (error) {
      console.warn("Could not fetch fresh package data in SeasonalPackageBanner:", error);
      if (currentFetchIdRef.current === pkgIdNum) {
        setPackageType(null);
        setEndDate(null);
      }
    }
  }, []);

  useEffect(() => {
    // Immediately clear previous package data on package change so stale banner never displays
    setPackageType(null);
    setEndDate(null);

    if (!packageId) {
      currentFetchIdRef.current = null;
      return;
    }

    const pkgIdNum = typeof packageId === "string" ? parseInt(packageId, 10) : packageId;
    if (isNaN(pkgIdNum)) {
      currentFetchIdRef.current = null;
      return;
    }

    // Always fetch fresh data directly from DB whenever package is selected or changes
    fetchLivePackageData(pkgIdNum);
  }, [packageId, fetchLivePackageData]);

  const rawType = (packageType || "").trim().toLowerCase();
  const isOneTimePackage = rawType === "one time" || (rawType.includes("one") && !rawType.includes("recur"));

  const deliveryCutoffDate = getDeliveryCutoffDate(endDate);

  if (!isOneTimePackage || !deliveryCutoffDate) {
    return null;
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.headerRow}>
        <Ionicons
          name="time"
          size={20}
          color="#000000"
          style={styles.headerIcon}
        />
        <Text style={styles.headerTitle}>Seasonal Package</Text>
      </View>

      <Text style={styles.bodyText}>
        This package will no longer be available{"\n"}
        for delivery after this date : {deliveryCutoffDate}.{"\n"}
        We appreciate your understanding and support.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#E3FFEA",
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
  },
  bodyText: {
    fontSize: 13,
    color: "#000000",
    lineHeight: 19,
  },
});

export default SeasonalPackageBanner;
