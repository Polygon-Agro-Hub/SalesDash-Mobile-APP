import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import OrderScreenSkeleton from "./OrderScreenSkeleton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { FontAwesome } from "@expo/vector-icons";

type ViewOrdersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewOrdersScreen"
>;

interface ViewOrdersScreenProps {
  navigation: ViewOrdersScreenNavigationProp;
}

interface Order {
  orderId: number;
  processId?: number;
  customerId: number;
  deliveryType: string;
  sheduleDate: string;
  sheduleTime: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  isPaid: number;
  status: string;
  createdAt: string;
  InvNo: string;
  reportStatus: string | null;
  fullTotal: string | null;
  fullDiscount: string | null;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  buildingType: string;
  fullAddress: string;
}

interface OrdersResponse {
  success: boolean;
  count: number;
  totalCount: number;
  hasMore: boolean;
  currentPage: number;
  data: Order[];
}

interface LoadOptions {
  page?: number;
  showFullLoading?: boolean; // full-screen skeleton (first load / screen focus)
  showSearching?: boolean; // small spinner in list area (search / filter change)
  isLoadMore?: boolean;
  search?: string;
  filter?: string;
}

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ORDERS_PER_PAGE = 10;
const FILTERS = ["All", "Today", "Tomorrow", "In 3 Days", "This Week"];

const STATUS_BG: Record<string, string> = {
  Ordered: "bg-[#F5FF85]",
  Processing: "bg-[#CFE1FF]",
  "Out For Delivery": "bg-[#FCD4FF]",
  Collected: "bg-[#F8FEA5]",
  "On the way": "bg-[#FFEDCF]",
  Hold: "bg-[#FFEDCF]",
  Delivered: "bg-[#BBFFC6]",
  Cancelled: "bg-[#DFDFDF]",
  Return: "bg-[#FFDCDA]",
};

const STATUS_TEXT: Record<string, string> = {
  Ordered: "#878216",
  "On the way": "#D17A00",
  Processing: "#3B82F6",
  Delivered: "#308233",
  Collected: "#7E8700",
  Hold: "#D17A00",
  Cancelled: "#5C5C5C",
  Return: "#FF1100",
  "Out For Delivery": "#80118A",
};

const getDisplayStatus = (status: string) => {
  if (status === "Return Received") return "Return";
  return status;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid date";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}/${month}/${day}`;
};

// Local (device) date as YYYY-MM-DD
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

// Convert the selected filter chip into a date range for the server
const getDateRange = (filter: string): { from: string; to: string } | null => {
  const today = new Date();

  if (filter === "Today") {
    return { from: toYMD(today), to: toYMD(today) };
  }

  if (filter === "Tomorrow") {
    const d = new Date(today);
    d.setDate(today.getDate() + 1);
    return { from: toYMD(d), to: toYMD(d) };
  }

  if (filter === "In 3 Days") {
    const d = new Date(today);
    d.setDate(today.getDate() + 3);
    return { from: toYMD(d), to: toYMD(d) };
  }

  if (filter === "This Week") {
    const start = new Date(today);
    const dayOffset = (today.getDay() + 6) % 7; // Monday start
    start.setDate(today.getDate() - dayOffset);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: toYMD(start), to: toYMD(end) };
  }

  return null; // "All"
};

const orderKey = (o: Order) => `${o.orderId}-${o.processId ?? o.InvNo}`;

const ViewOrdersScreen: React.FC<ViewOrdersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isMounted = useRef(true);
  const requestIdRef = useRef(0); // ignore responses from outdated requests
  const lastFetchKeyRef = useRef<string | null>(null); // "search|filter" of last page-1 fetch
  const searchRef = useRef("");
  const filterRef = useRef("All");

  // keep refs in sync so callbacks always see the latest values
  searchRef.current = searchText;
  filterRef.current = selectedFilter;

  const loadOrders = useCallback(
    async (opts: LoadOptions = {}) => {
      const {
        page = 1,
        showFullLoading = false,
        showSearching = false,
        isLoadMore = false,
        search = "",
        filter = "All",
      } = opts;

      // A new page-1 request invalidates every older request.
      // A load-more request just reuses the current id.
      const requestId = isLoadMore
        ? requestIdRef.current
        : ++requestIdRef.current;

      if (!isLoadMore) {
        lastFetchKeyRef.current = `${search}|${filter}`;
        if (isMounted.current) {
          setLoading(showFullLoading);
          setSearching(showSearching);
          setLoadingMore(false);
        }
      } else if (isMounted.current) {
        setLoadingMore(true);
      }

      try {
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          if (isMounted.current) navigation.navigate("LoginScreen" as any);
          return;
        }

        const params: Record<string, string | number> = {
          page,
          limit: ORDERS_PER_PAGE,
        };
        const trimmed = search.trim();
        if (trimmed) params.search = trimmed;
        const range = getDateRange(filter);
        if (range) {
          params.dateFrom = range.from;
          params.dateTo = range.to;
        }

        const response = await axios.get<OrdersResponse>(
          `${environment.API_BASE_URL}api/orders/get-orders`,
          {
            params,
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        // a newer request started while we were waiting - drop this result
        if (requestId !== requestIdRef.current || !isMounted.current) return;

        if (response.data.success && response.data.data) {
          const incoming = response.data.data;

          if (isLoadMore) {
            setOrders((prev) => {
              const seen = new Set(prev.map(orderKey));
              return [...prev, ...incoming.filter((o) => !seen.has(orderKey(o)))];
            });
          } else {
            setOrders(incoming);
          }

          setHasMore(response.data.hasMore);
          setCurrentPage(response.data.currentPage);
          setTotalCount(response.data.totalCount);
        } else {
          if (!isLoadMore) setOrders([]);
          setHasMore(false);
        }
      } catch (error) {
        if (requestId !== requestIdRef.current || !isMounted.current) return;

        console.error("Failed to fetch orders:", error);
        if (!isLoadMore) setOrders([]);
        setHasMore(false);

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await AsyncStorage.removeItem("authToken");
          navigation.navigate("LoginScreen" as any);
        }
      } finally {
        if (requestId === requestIdRef.current && isMounted.current) {
          setLoading(false);
          setSearching(false);
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [navigation],
  );

  const loadMoreOrders = () => {
    if (loading || searching || loadingMore || refreshing || !hasMore) return;
    loadOrders({
      page: currentPage + 1,
      isLoadMore: true,
      search: searchRef.current,
      filter: filterRef.current,
    });
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders({
      page: 1,
      search: searchRef.current,
      filter: filterRef.current,
    });
  }, [loadOrders]);

  // Keyboard listeners + unmount cleanup
  useEffect(() => {
    isMounted.current = true;

    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false),
    );

    return () => {
      isMounted.current = false;
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Every time the screen gains focus: reset search/filter and reload page 1
  useFocusEffect(
    useCallback(() => {
      setSearchText("");
      setSelectedFilter("All");
      setCurrentPage(1);
      setHasMore(true);
      loadOrders({ page: 1, showFullLoading: true, search: "", filter: "All" });
      return () => {};
    }, [loadOrders]),
  );

  // Search / filter changed -> debounce, then re-fetch from page 1 on the server
  useEffect(() => {
    const key = `${searchText}|${selectedFilter}`;
    if (key === lastFetchKeyRef.current) return; // already fetched with these values

    const timer = setTimeout(() => {
      setCurrentPage(1);
      setHasMore(true);
      loadOrders({
        page: 1,
        showSearching: true,
        search: searchText,
        filter: selectedFilter,
      });
    }, 400);

    return () => clearTimeout(timer);
  }, [searchText, selectedFilter, loadOrders]);

  const isEmpty = orders.length === 0;

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#884EDC" />
          <Text className="text-gray-500 text-sm mt-2">
            Loading more orders...
          </Text>
        </View>
      );
    }

    if (hasMore && orders.length > 0) {
      return (
        <TouchableOpacity
          onPress={loadMoreOrders}
          className="py-4 items-center bg-gray-50 mx-4 rounded-lg mb-4"
        >
          <Text className="text-purple-600 font-semibold">
            Load More Orders
          </Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderOrder = ({ item }: { item: Order }) => {
    const displayStatus = getDisplayStatus(item.status);
    const paymentPending =
      item.isPaid === 0 &&
      item.paymentMethod === "Card" &&
      item.status !== "Cancelled";

    return (
      <TouchableOpacity
        activeOpacity={1}
        onPress={() =>
          navigation.navigate("View_CancelOrderScreen" as any, {
            orderId: item.orderId,
            status: item.status,
            reportStatus: item.reportStatus,
          })
        }
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            borderWidth: paymentPending ? 1.5 : 1,
            borderColor: paymentPending ? "#FF4C4C" : "#E0E0E0",
            shadowColor: "#0000001A",
            shadowOpacity: 0.12,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 10,
            elevation: 4,
          }}
          className="mx-6"
        >
          {/* Order number and status */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: SCREEN_HEIGHT > 900 ? 20 : 16,
                fontWeight: "600",
                color: "#393939",
              }}
            >
              Order : #{item.InvNo}
            </Text>
            <View
              className={`px-3 py-1 rounded-full ${
                STATUS_BG[displayStatus] ?? "bg-[#EAEAEA]"
              }`}
              style={{ width: 110, alignItems: "center" }}
            >
              <Text
                style={{
                  fontSize: SCREEN_HEIGHT > 900 ? 14 : 12,
                  fontWeight: "600",
                  textAlign: "center",
                  color: STATUS_TEXT[displayStatus] ?? "#393939",
                }}
              >
                {displayStatus}
              </Text>
            </View>
          </View>

          {paymentPending && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <FontAwesome
                name="exclamation-circle"
                size={14}
                color="#FF4C4C"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: SCREEN_HEIGHT > 900 ? 14 : 12,
                  fontWeight: "600",
                  color: "#FF4C4C",
                }}
              >
                Payment Pending
              </Text>
            </View>
          )}

          <Text
            style={{
              fontSize: SCREEN_HEIGHT > 900 ? 16 : 14,
              color: "#808FA2",
              marginTop: 4,
            }}
          >
            Scheduled to : {formatDate(item.sheduleDate)}
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text
              style={{
                fontSize: SCREEN_HEIGHT > 900 ? 16 : 14,
                color: "#808FA2",
              }}
            >
              {item.sheduleTime}
            </Text>
            <Text
              style={{
                fontSize: SCREEN_HEIGHT > 900 ? 16 : 14,
                color: "#FF4C4C",
              }}
            >
              {item.reportStatus}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <LinearGradient
          colors={["#854BDA", "#6E3DD1"]}
          className="shadow-md px-4 items-center justify-center"
          style={{
            paddingBottom: 24,
            height: 80,
            justifyContent: "center",
          }}
        >
          <View className="w-full max-w-[500px] items-center">
            <Text
              className="text-white font-semibold"
              style={{ fontSize: SCREEN_HEIGHT > 900 ? 20 : 18 }}
            >
              Total Orders:{" "}
              <Text className="font-bold">
                {String(totalCount).padStart(2, "0")}
              </Text>
            </Text>
          </View>
        </LinearGradient>

        {/* Loading Animation (first load / screen focus only) */}
        {loading ? (
          <OrderScreenSkeleton />
        ) : (
          <View className="flex-1 mx-auto w-full max-w-[500px]">
            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F5F1FC] px-4 h-[50px] border border-[#6B3BCF] rounded-full mt-[-6%] shadow-sm mx-6">
              <TextInput
                placeholder="Search By Order Number"
                placeholderTextColor="#6839CF"
                className="flex-1 text-gray-700 h-11 py-0"
                style={{
                  fontStyle: "italic",
                  fontSize: SCREEN_HEIGHT > 900 ? 16 : 14,
                }}
                onChangeText={(text) => {
                  const numericOnly = text.replace(/[^0-9]/g, "");
                  setSearchText(numericOnly);
                }}
                value={searchText}
                keyboardType="numeric"
              />
              <FontAwesome name="search" size={22} color="#884EDC" />
            </View>

            {/* Horizontal Scrollable Filters */}
            <View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  height: 44,
                  alignItems: "center",
                  marginBottom: 5,
                  marginTop: 14,
                }}
                className="my-2"
              >
                {FILTERS.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "#6B3BCF",
                      backgroundColor:
                        selectedFilter === filter ? "#6B3BCF" : "transparent",
                      marginHorizontal: 6,
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: 36,
                      minWidth: 80,
                    }}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={{
                        fontSize: SCREEN_HEIGHT > 900 ? 16 : 14,
                        fontWeight:
                          selectedFilter === filter ? "bold" : "normal",
                        color: selectedFilter === filter ? "white" : "#6B3BCF",
                        textAlign: "center",
                        includeFontPadding: false,
                        lineHeight: 20,
                      }}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="flex-1 mb-[5%]">
              {searching ? (
                <View className="items-center mt-20">
                  <ActivityIndicator size="large" color="#884EDC" />
                </View>
              ) : isEmpty ? (
                <View className="flex justify-center items-center mt-20">
                  <Image
                    source={require("@/assets/images/public/no-data.webp")}
                    style={{
                      width: wp("60%"),
                      height: hp("30%"),
                      resizeMode: "contain",
                    }}
                  />
                  <Text
                    className="text-black italic text-center mt-4"
                    style={{ fontSize: SCREEN_HEIGHT > 900 ? 18 : 14 }}
                  >
                    {" "}
                    No orders found{" "}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={orders}
                  className="flex-1"
                  keyboardShouldPersistTaps="handled"
                  keyExtractor={(item, index) =>
                    `${item.orderId}-${item.processId ?? item.InvNo ?? index}`
                  }
                  refreshControl={
                    <RefreshControl
                      refreshing={refreshing}
                      onRefresh={onRefresh}
                      colors={["#884EDC"]}
                      tintColor="#884EDC"
                    />
                  }
                  ListFooterComponent={renderFooter}
                  onEndReached={loadMoreOrders}
                  onEndReachedThreshold={0.3}
                  renderItem={renderOrder}
                  contentContainerStyle={{
                    paddingBottom: hp(5),
                    paddingTop: 4,
                    paddingHorizontal: 2,
                  }}
                />
              )}
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ViewOrdersScreen;