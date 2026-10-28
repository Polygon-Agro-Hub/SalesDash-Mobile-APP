import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { Circle } from "react-native-progress";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { RootStackParamList } from "../types/types";
import environment from "@/environment/environment";
import CustomHeader from "../common/CustomHeader";
import Pagination from "../common/Pagination";

type MonthlyOrdersTargetsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "MonthlyOrdersTargets"
>;

interface MonthlyOrdersTargetsProps {
  navigation: MonthlyOrdersTargetsNavigationProp;
}

interface DailyRecord {
  date: string;
  completed: number;
  target: number;
}

interface TodayStats {
  target: number;
  completed: number;
  progress: number;
}

const PAGE_SIZE = 5;

const MONTH_NAMES = [
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

/* Builds [1, 2, "...", last-1, last] style page list */
const getPageItems = (current: number, total: number): (number | "...")[] => {
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

const formatLongDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const MonthlyOrdersTargets: React.FC<MonthlyOrdersTargetsProps> = ({
  navigation,
}) => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth()); // 0-11
  const [year, setYear] = useState(now.getFullYear());
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [today, setToday] = useState<TodayStats>({
    target: 10,
    completed: 0,
    progress: 0,
  });
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // true when the selected month is the current month -> block "next"
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  const fetchToday = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const res = await axios.get(
        `${environment.API_BASE_URL}api/orders/sales-agent`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const d = res.data?.data?.daily;
      if (d) {
        setToday({
          target: d.target ?? 10,
          completed: d.completed ?? 0,
          progress: d.progress ?? 0,
        });
      }
    } catch (e) {
      console.error("Today stats fetch error:", e);
    }
  }, []);

  const fetchRecords = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;
      const res = await axios.get(
        `${environment.API_BASE_URL}api/orders/daily-targets?month=${
          month + 1
        }&year=${year}&page=${page}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setRecords(Array.isArray(res.data?.data) ? res.data.data : []);
      setTotalPages(res.data?.totalPages ?? 1);
    } catch (e) {
      console.error("Daily targets fetch error:", e);
      setRecords([]);
      setTotalPages(1);
    }
  }, [month, year, page]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([fetchToday(), fetchRecords()]);
      setLoading(false);
    })();
  }, [fetchToday, fetchRecords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchToday(), fetchRecords()]);
    setRefreshing(false);
  };

  const changeMonth = (delta: number) => {
    if (delta > 0 && isCurrentMonth) return;

    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
    setPage(1);
  };

  const remaining = Math.max(today.target - today.completed, 0);
  const percent = Math.round(
    (today.target > 0 ? Math.min(today.completed / today.target, 1) : 0) * 100,
  );

  const cardShadow = {
    shadowColor: "#8B5CF6",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  } as const;

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Monthly Orders Target"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#854BDA"]}
            tintColor="#854BDA"
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 70 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ---------- Daily target card ---------- */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#DAE2FD",
            padding: 14,
            ...cardShadow,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: "#EAE1FF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <FontAwesome6 name="bullseye" size={20} color="#7C3AED" />
            </View>
            <View>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: "#64748B",
                  letterSpacing: 0.8,
                }}
              >
                DAILY TARGET
              </Text>
              <Text
                style={{ fontSize: 15, fontWeight: "700", color: "#0F172A" }}
              >
                {today.target} Orders / day
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 12,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#6B3BCF",
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 12 }}>Today</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "baseline",
                  marginTop: 4,
                }}
              >
                <Text
                  style={{ fontSize: 24, fontWeight: "800", color: "#6B3BCF" }}
                >
                  {today.completed}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#0F172A",
                    marginLeft: 6,
                  }}
                >
                  / {today.target} Orders
                </Text>
              </View>
              <Text style={{ fontSize: 11, color: "#657489", marginTop: 4 }}>
                {remaining > 0
                  ? `${remaining} orders needed to achieve today's goal`
                  : "Today's goal achieved!"}
              </Text>
            </View>

            <Circle
              size={52}
              progress={percent / 100}
              thickness={5}
              color="#6D28D9"
              unfilledColor="#E9E3F8"
              borderWidth={0}
              showsText
              formatText={() => `${percent}%`}
              textStyle={{ fontSize: 11, fontWeight: "700", color: "#6D28D9" }}
            />
          </View>
        </View>

        {/* ---------- Month selector ---------- */}
        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: "#6B3BCF",
            borderRadius: 12,
            paddingHorizontal: 12,
            paddingVertical: 10,
            backgroundColor: "#FFFFFF",
          }}
        >
          <TouchableOpacity onPress={() => changeMonth(-1)} hitSlop={10}>
            <Ionicons name="chevron-back" size={16} color="#475569" />
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <FontAwesome6 name="calendar-days" size={16} color="#6D3FD0" />
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#0F172A" }}>
              {MONTH_NAMES[month]} {year}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => changeMonth(1)}
            disabled={isCurrentMonth}
            hitSlop={10}
          >
            <Ionicons
              name="chevron-forward"
              size={16}
              color={isCurrentMonth ? "#CBD5E1" : "#475569"}
            />
          </TouchableOpacity>
        </View>

        {/* ---------- Daily list ---------- */}
        <View style={{ marginTop: 16, minHeight: 300 }}>
          {loading ? (
            <ActivityIndicator
              size="large"
              color="#854BDA"
              style={{ marginTop: 40 }}
            />
          ) : records.length === 0 ? (
            <Text
              style={{
                textAlign: "center",
                color: "#999",
                fontSize: 14,
                marginTop: 40,
              }}
            >
              No records for this month
            </Text>
          ) : (
            records.map((r) => {
              const achieved = r.completed >= r.target;
              const ratio =
                r.target > 0 ? Math.min(r.completed / r.target, 1) : 0;
              return (
                <View
                  key={r.date}
                  style={{
                    backgroundColor: "#FFFFFF",
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: "#DFE8FF",
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    ...cardShadow,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 10 }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#131B2E",
                      }}
                      numberOfLines={1}
                    >
                      {formatLongDate(r.date)}
                    </Text>
                    <View
                      style={{
                        alignSelf: "flex-start",
                        marginTop: 6,
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        backgroundColor: achieved ? "#EAE1FF" : "#FFF1D7",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: "500",
                          color: achieved ? "#6B3BCF" : "#633B48",
                        }}
                      >
                        {achieved ? "Target Achieved" : "Target Missed"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: "#6B3BCF",
                      }}
                    >
                      {r.completed}/{r.target}
                    </Text>
                    <View
                      style={{
                        marginTop: 6,
                        width: 70,
                        height: 5,
                        borderRadius: 3,
                        backgroundColor: "#EEF0F6",
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          width: `${ratio * 100}%`,
                          height: "100%",
                          backgroundColor: "#6D28D9",
                          borderRadius: 3,
                        }}
                      />
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
        {/* ---------- Pagination ---------- */}
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </ScrollView>
    </View>
  );
};

export default MonthlyOrdersTargets;
