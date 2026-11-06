import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import Pagination from "../common/Pagination";
import CustomHeader from "../common/CustomHeader";

type TotalValueOfCustomersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TotalValueOfCustomersScreen"
>;

interface TotalValueOfCustomersScreenProps {
  navigation: TotalValueOfCustomersScreenNavigationProp;
}

interface CustomerSummaryItem {
  id: string | number;
  cusId: string;
  title: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  buyerType: "Retail" | "Wholesale";
  companyName?: string | null;
  createdAt?: string;
  totalCompletedSales: number;
  completedOrdersCount: number;
}

interface Counts {
  all: number;
  retail: number;
  wholesale: number;
}

type FilterTab = "all" | "retail" | "wholesale";

const PAGE_SIZE = 5;

const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  return `Rs. ${num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getInitials = (firstName?: string, lastName?: string): string => {
  const f = firstName?.trim() || "";
  const l = lastName?.trim() || "";

  if (f && l) {
    const firstChar = f.charAt(0).toUpperCase();
    const lastParts = l.split(/\s+/).filter(Boolean);
    const lastWord = lastParts[lastParts.length - 1] || "";
    const lastChar =
      lastWord.charAt(0).toUpperCase() || l.charAt(0).toUpperCase();
    return `${firstChar}${lastChar}`;
  }

  const full = `${f} ${l}`.trim();
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return "C";
};

const sortCustomersByName = (
  list: CustomerSummaryItem[],
): CustomerSummaryItem[] => {
  return [...list].sort((a, b) => {
    const nameA = `${a.firstName || ""} ${a.lastName || ""}`
      .trim()
      .toLowerCase();
    const nameB = `${b.firstName || ""} ${b.lastName || ""}`
      .trim()
      .toLowerCase();
    return nameA.localeCompare(nameB);
  });
};

const TotalValueOfCustomersScreen: React.FC<
  TotalValueOfCustomersScreenProps
> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [grandTotalValue, setGrandTotalValue] = useState(0);
  const [counts, setCounts] = useState<Counts>({
    all: 0,
    retail: 0,
    wholesale: 0,
  });
  const [customers, setCustomers] = useState<CustomerSummaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const fetchData = useCallback(
    async (
      currentPage: number,
      currentFilter: FilterTab,
      isRefresh = false,
    ) => {
      try {
        if (!isRefresh) setLoading(true);
        setError(null);
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `${environment.API_BASE_URL}api/orders/customers-total-value?page=${currentPage}&limit=${PAGE_SIZE}&filter=${currentFilter}`,
          {
            headers: { Authorization: `Bearer ${storedToken}` },
          },
        );

        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          setGrandTotalValue(d.grandTotalValue ?? 0);
          if (d.counts) {
            setCounts({
              all: d.counts.all ?? 0,
              retail: d.counts.retail ?? 0,
              wholesale: d.counts.wholesale ?? 0,
            });
          }
          const rawList = Array.isArray(d.customers) ? d.customers : [];
          setCustomers(sortCustomersByName(rawList));
          setTotalPages(d.pagination?.totalPages ?? 1);
        } else {
          setCustomers([]);
          setTotalPages(1);
        }
      } catch (err: any) {
        console.error("Failed to fetch customers total value summary:", err);
        setError("Failed to load customer total value data.");
        setCustomers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setInitialLoaded(true);
      }
    },
    [],
  );

  useEffect(() => {
    fetchData(page, activeTab);
  }, [fetchData, page, activeTab]);

  const handleTabChange = (tab: FilterTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setPage(1);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(page, activeTab, true);
  };

  const formatOrdersText = (count: number) => {
    if (count === 1) return "1 order";
    return `${count} orders`;
  };

 return (
  <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
    {/* Header */}
    <CustomHeader
      title="Total Value of Customers"
      titleColor="#6C3CD1"
      showBackButton={true}
      navigation={navigation}
      onBackPress={() => navigation.goBack()}
    />

    {/* Full screen loader (first load only) */}
    {!initialLoaded && loading ? (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    ) : (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 100,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#6D28D9"]}
            tintColor="#6D28D9"
          />
        }
      >
        {/* Top Total Value Card */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: "#E0EAFF",
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 20,
            ...Platform.select({
              ios: {
                shadowColor: "#0F172A",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
              },
              android: {
                elevation: 2,
              },
            }),
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 16,
              backgroundColor: "#EDE9FE",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
            }}
          >
            <MaterialCommunityIcons name="bullseye" size={28} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 12,
                fontWeight: "700",
                color: "#64748B",
                letterSpacing: 0.5,
              }}
            >
              TOTAL VALUE
            </Text>
            <Text
              style={{
                fontSize: 20,
                fontWeight: "800",
                color: "#0F172A",
                marginTop: 3,
              }}
            >
              {formatCurrency(grandTotalValue)}
            </Text>
          </View>
        </View>

        {/* Filter Pills (All, Retail, Wholesale) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20, flexGrow: 0 }}
          contentContainerStyle={{
            flexDirection: "row",
            alignItems: "center",
            gap: 5,
            paddingRight: 20,
          }}
        >
          {/* All Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange("all")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 24,
              backgroundColor: activeTab === "all" ? "#630ED4" : "#EAE1FF",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: activeTab === "all" ? "#FFFFFF" : "#1E293B",
              }}
            >
              All
            </Text>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                backgroundColor: activeTab === "all" ? "#7C3AED" : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: activeTab === "all" ? "#FFFFFF" : "#334155",
                }}
              >
                {counts.all}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Retail Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange("retail")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 24,
              backgroundColor: activeTab === "retail" ? "#630ED4" : "#EAE1FF",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: activeTab === "retail" ? "#FFFFFF" : "#1E293B",
              }}
            >
              Retail
            </Text>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                backgroundColor: activeTab === "retail" ? "#7C3AED" : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: activeTab === "retail" ? "#FFFFFF" : "#334155",
                }}
              >
                {counts.retail}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Wholesale Tab */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => handleTabChange("wholesale")}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 14,
              paddingVertical: 8,
              borderRadius: 24,
              backgroundColor:
                activeTab === "wholesale" ? "#630ED4" : "#EAE1FF",
              gap: 8,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: activeTab === "wholesale" ? "#FFFFFF" : "#1E293B",
              }}
            >
              Wholesale
            </Text>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 12,
                backgroundColor:
                  activeTab === "wholesale" ? "#7C3AED" : "#FFFFFF",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "700",
                  color: activeTab === "wholesale" ? "#FFFFFF" : "#334155",
                }}
              >
                {counts.wholesale}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>

        {/* Customer List */}
        {loading ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6D28D9" />
          </View>
        ) : error ? (
          <View style={{ paddingVertical: 40, alignItems: "center" }}>
            <Text style={{ color: "#EF4444", marginBottom: 12 }}>{error}</Text>
            <TouchableOpacity
              onPress={() => fetchData(page, activeTab)}
              style={{
                backgroundColor: "#6D28D9",
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : customers.length === 0 ? (
          <View style={{ paddingVertical: 60, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 15,
                color: "#64748B",
                fontStyle: "italic",
              }}
            >
              No customers found.
            </Text>
          </View>
        ) : (
          customers.map((c) => {
            const isWholesale = c.buyerType === "Wholesale";
            const initials = getInitials(c.firstName, c.lastName);
            const fullName = `${c.firstName || ""} ${c.lastName || ""}`.trim();

            return (
              <TouchableOpacity
                key={`cust-${c.id}`}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate("ViewCustomerScreen", {
                    name: fullName,
                    title: c.title,
                    number: c.phoneNumber,
                    customerId: c.cusId,
                    id: String(c.id),
                    buyerType: c.buyerType || "Retail",
                    from: "TotalValueOfCustomersScreen",
                  })
                }
                style={{
                  backgroundColor: "#FFFFFF",
                  borderRadius: 24,
                  borderWidth: 1.5,
                  borderColor: "#E0EAFF",
                  padding: 16,
                  marginBottom: 14,
                  ...Platform.select({
                    ios: {
                      shadowColor: "#0F172A",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                    },
                    android: {
                      elevation: 2,
                    },
                  }),
                }}
              >
                {/* Top Section */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                  }}
                >
                  {/* Avatar */}
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#EDE9FE",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 14,
                      marginTop: 2,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#7C3AED",
                      }}
                    >
                      {initials}
                    </Text>
                  </View>

                  {/* Customer Info */}
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 17,
                        fontWeight: "700",
                        color: "#0F172A",
                        marginBottom: 4,
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {fullName}
                    </Text>

                    {/* Buyer Badge */}
                    <View
                      style={{
                        alignSelf: "flex-start",
                        backgroundColor: "#630ED4",
                        paddingHorizontal: 12,
                        paddingVertical: 2.5,
                        borderRadius: 12,
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: "600",
                        }}
                      >
                        {isWholesale ? "Wholesale" : "Retail"}
                      </Text>
                    </View>

                    {/* Wholesale Company Name */}
                    {isWholesale && !!c.companyName && (
                      <Text
                        style={{
                          fontSize: 13,
                          color: "#475569",
                          fontWeight: "500",
                          marginTop: 1,
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {c.companyName}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Bottom Box: Total Completed Sales & Orders */}
                <View
                  style={{
                    backgroundColor: "#F8F7FF",
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    marginTop: 12,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View>
                    <Text
                      style={{
                        fontSize: 12,
                        color: "#64748B",
                        fontWeight: "500",
                        marginBottom: 3,
                      }}
                    >
                      Total Completed Sales
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: "#6D28D9",
                      }}
                    >
                      {formatCurrency(c.totalCompletedSales)}
                    </Text>
                  </View>

                  <Text
                    style={{
                      fontSize: 13,
                      color: "#64748B",
                      fontWeight: "500",
                    }}
                  >
                    {formatOrdersText(c.completedOrdersCount)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </ScrollView>
    )}
  </View>
);
};

export default TotalValueOfCustomersScreen;
