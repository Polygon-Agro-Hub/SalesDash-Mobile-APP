import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Linking,
  Keyboard,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Alert,
  StatusBar,
  Image,
} from "react-native";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AntIcons from "react-native-vector-icons/Feather";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import axios from "axios";
import environment from "@/environment/environment";
import { Entypo, FontAwesome, Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";

type ViewCustomerScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewCustomerScreen"
>;
type ViewCustomerScreenRouteProp = RouteProp<
  RootStackParamList,
  "ViewCustomerScreen"
>;

interface Order {
  orderId: string;
  customerId: string;
  deliveryType: string;
  sheduleDate: string;
  sheduleTime: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  status: string;
  createdAt: string;
  InvNo: string;
  fullTotal: string | null;
  fullDiscount: string | null;
  reportStatus: string | null;
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  message?: string;
  totalCount?: number;
  hasMore?: boolean;
}

type ViewCustomerScreenProps = {
  route: ViewCustomerScreenRouteProp;
  navigation: ViewCustomerScreenNavigationProp;
};

const ViewCustomerScreen: React.FC<ViewCustomerScreenProps> = ({
  route,
  navigation,
}) => {
  const ORDERS_PER_PAGE = 5;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Ordered");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);
  const isMounted = useRef(true);
  const { name, number, id, customerId, title } = route.params;

  useFocusEffect(
    React.useCallback(() => {
      const resetStates = () => {
        setSearchText("");
        setSelectedFilter("Ordered");
        setOrders([]);
        setCurrentPage(1);
        setHasMore(true);
        setLoading(true);
        setLoadingMore(false);
        setError(null);
        setSearchError(null);
      };

      resetStates();
      loadOrders(1, true, false);
      getUserProfile();

      return () => {};
    }, [id, customerId]),
  );

  const getUserProfile = async () => {
    try {
      setLoadingCustomerData(true);
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return null;
      }

      const response = await axios.get(
        `${environment.API_BASE_URL}api/customer/customerData/${customerId}`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

      if (response.data) {
        const lat = Number(response.data.latitude);
        const lng = Number(response.data.longitude);

        if (!isNaN(lat) && !isNaN(lng)) {
          setLatitude(lat);
          setLongitude(lng);
        } else {
          setLatitude(null);
          setLongitude(null);
        }

        const locationName =
          `${title || ""} ${response.data.firstName || ""} ${response.data.lastName || ""}`.trim();
        setSelectedLocationName(locationName || "Customer Location");
      }

      return storedToken;
    } catch (error) {
      Alert.alert("Error", "Failed to fetch customer location data");
      console.error("Error fetching customer data:", error);
      return null;
    } finally {
      setLoadingCustomerData(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("CustomersScreen" as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation]),
  );

  const loadOrders = async (
    page = 1,
    showFullLoading = true,
    isLoadMore = false,
  ) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      }

      setError(null);

      const response = await axios.get<OrdersResponse>(
        `${environment.API_BASE_URL}api/orders/get-order-bycustomerId/${id}?page=${page}&limit=${ORDERS_PER_PAGE}`,
      );

      if (response.data.success) {
        const newOrders = response.data.data;

        if (isLoadMore) {
          setOrders((prevOrders) => {
            const combined = [...prevOrders, ...newOrders];
            return combined;
          });
        } else {
          setOrders(newOrders);
        }
        setHasMore(response.data.hasMore || false);
        setCurrentPage(page);
      } else {
        setError(response.data.message || "Failed to load orders");
      }
    } catch (err: any) {
      console.log("Error fetching orders:", err);

      if (err.response && err.response.status === 404) {
        setOrders([]);
        setError(null);
        setHasMore(false);
      } else {
        console.error("Actual error fetching orders:", err);
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreOrders = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = currentPage + 1;
      loadOrders(nextPage, false, true);
    } else {
      console.log(
        `Cannot load more - loadingMore: ${loadingMore}, hasMore: ${hasMore}, loading: ${loading}`,
      );
    }
  };

  const handleRefresh = () => {
    setCurrentPage(1);
    setHasMore(true);
    setOrders([]);
    loadOrders(1, true, false);
  };

  // Check for search results when search text or filter changes
  useEffect(() => {
    if (searchText.trim() === "") {
      setSearchError(null);
    } else {
      // Check if the search returns any results
      const results = orders.filter(
        (order) =>
          order.InvNo &&
          order.InvNo.toLowerCase().includes(searchText.toLowerCase()) &&
          (selectedFilter === "All" || order.status === selectedFilter),
      );

      if (results.length === 0) {
        setSearchError(`No order found with number "${searchText}"`);
      } else {
        setSearchError(null);
      }
    }
  }, [searchText, selectedFilter, orders]);

  const handleGetACall = () => {
    const phoneNumber = `tel:${number}`;
    Linking.openURL(phoneNumber).catch((err) =>
      console.error("Error opening dialer", err),
    );
  };

  const filters = [
    "Ordered",
    "Processing",
    "Out For Delivery",
    "Collected",
    "Hold",
    "On the way",
    "Delivered",
    "Cancelled",
    "Return",
  ];

  const formatsheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}/${month}/${day}`;
  };

  const handleSearch = () => {
    // This function can be kept for manual search trigger if needed
    // But the search logic now happens automatically in useEffect
  };

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedFilter === "All" || order.status === selectedFilter;
    const matchesSearch =
      !searchText ||
      (order.InvNo &&
        order.InvNo.toLowerCase().includes(searchText.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  // Reset pagination state when customer ID changes
  const resetPaginationState = () => {
    setOrders([]);
    setCurrentPage(1);
    setHasMore(true);
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setSearchError(null);
  };

  useEffect(() => {
    // Reset pagination state when customer changes
    resetPaginationState();

    // Set up listeners
    const unsubscribe = navigation.addListener("focus", () => {
      if (isMounted.current) {
        resetPaginationState();
        loadOrders(1, true, false);
      }
    });

    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    // Initial load
    loadOrders(1, true, false);

    // Cleanup function
    return () => {
      isMounted.current = false;
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation, id]);

  const renderFooter = () => {
    if (!loadingMore) return null;

    return <LoadingPage message="Loading More Orders..." fullScreen={false} />;
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <CustomHeader
        title={`${title}. ${name}`}
        titleColor="#000000"
        showBackButton={true}
        navigation={navigation}
        transparent
        onBackPress={() => navigation.navigate("CustomersScreen")}
        rightComponent={
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditCustomerScreen", {
                id,
                customerId,
                name,
                title,
              })
            }
          >
            <MaterialIcons name="edit" size={24} color="#6839CF" />
          </TouchableOpacity>
        }
      />
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <View className="mt-14">
          <View className="bg-white flex-row rounded-b-[35px] items-center justify-between z-50 shadow-lg px-5">
            <View className="flex-1 justify-center items-center gap-1">
              <Text
                className="text-gray-500 text-base"
                style={{ textAlign: "center" }}
              >
                Customer ID: {customerId}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("ExcludeItemEditSummery", {
                    id: id,
                    customerId: customerId,
                    name: name,
                    title: title,
                  })
                }
              >
                <View className="flex-row justify-center items-center gap-2">
                  <Text className="text-[#7240D3] underline">
                    Exclude Item List
                  </Text>
                  <AntIcons name="external-link" size={20} color="#6C3CD1" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  if (latitude !== null && longitude !== null) {
                    navigation.navigate("ViewLocationScreen", {
                      latitude: latitude,
                      longitude: longitude,
                      locationName: selectedLocationName,
                    });
                  } else {
                    Alert.alert(
                      "Location Unavailable",
                      "Customer location data is not available.",
                    );
                  }
                }}
              >
                <View className="flex-row justify-center items-center gap-1 mb-3">
                  <Text className="text-[#FF0000] underline">
                    {loadingCustomerData
                      ? "Loading Location"
                      : "View Geo Location"}
                  </Text>

                  <Entypo name="location-pin" size={20} color="#FF0000" />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="bg-[#F1E8FF] rounded-b-[35px] pt-3 shadow-md mt-[-20] items-center z-5">
            <View className="flex-row justify-between mb-4 gap-x-4">
              <TouchableOpacity
                onPress={handleGetACall}
                className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5"
              >
                <Ionicons name="call" size={20} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Get a Call
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() =>
                  navigation.navigate("SelectOrderType" as any, {
                    id,
                    customerId: customerId,
                    name: name,
                    title: title,
                    number: number,
                    customerscreencustomerid: customerId,
                  })
                }
                className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5"
              >
                <Ionicons name="add-circle" size={24} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  New Order
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search and Filters */}
        <View className="mx-6">
          <View className="flex-row items-center bg-[#F5F1FC] px-4 border border-[#6B3BCF] rounded-full mt-4 shadow-sm">
            <TextInput
              placeholder="Search By Order Number"
              placeholderTextColor="#6839CF"
              className="flex-1 text-sm text-gray-700 h-11 py-0"
              onChangeText={(text) => {
                const numericOnly = text.replace(/[^0-9]/g, "");
                setSearchText(numericOnly);
              }}
              value={searchText}
              style={{ fontStyle: "italic" }}
              keyboardType="numeric"
            />
            <TouchableOpacity onPress={handleSearch}>
              <FontAwesome name="search" size={22} color="#884EDC" />
            </TouchableOpacity>
          </View>

          {/* Search Error Message - Show when typing and no results found */}
          {searchError && (
            <View className="flex-1 justify-center items-center">
              <Image
                source={require("@/assets/images/public/no-data.webp")}
                style={{
                  width: wp("60%"),
                  height: hp("30%"),
                  resizeMode: "contain",
                }}
              />
              <Text className="text-black text-i text-center mt-4">
                No data Found
              </Text>
            </View>
          )}
        </View>

        {!searchError && (
          <View className="mt-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row flex-wrap mt-[2%] mb-[1%] mx-5"
              contentContainerStyle={{ paddingHorizontal: wp("1%") }}
            >
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  className={`px-4 py-2 rounded-full border mr-2 ${
                    selectedFilter === filter
                      ? "bg-[#6B3BCF] border-[#6B3BCF]"
                      : "border-[#6B3BCF]"
                  }`}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text
                    className={`text-center text-sm ${
                      selectedFilter === filter
                        ? "text-white font-bold"
                        : "text-[#6B3BCF]"
                    }`}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View className="flex-1 mt-3">
          {/* Orders List */}
          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#6B3BCF" />
              <Text className="text-[#6B3BCF] mt-2">Loading orders...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 justify-center items-center px-4">
              <Text className="text-red-500 text-center">{error}</Text>
              <TouchableOpacity
                className="mt-4 bg-[#6B3BCF] px-4 py-2 rounded-full"
                onPress={handleRefresh}
              >
                <Text className="text-white font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : searchError ? null : filteredOrders.length > 0 ? (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.orderId.toString()}
              renderItem={({ item }) => (
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
                      backgroundColor: "#FFFFFF",
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                      marginHorizontal: 16,
                      marginTop: 16,
                      borderWidth: 1,
                      borderColor: "#E5E7EB",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.06,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row justify-between items-center">
                      <Text className="text-lg font-semibold text-gray-900">
                        Order: #{item.InvNo || "N/A"}
                      </Text>
                      <View
                        className={`px-3 py-1 rounded-full ${
                          item.status === "Ordered"
                            ? "bg-[#F5FF85]"
                            : item.status === "Processing"
                              ? "bg-[#CFE1FF]"
                              : item.status === "Out For Delivery"
                                ? "bg-[#FCD4FF]"
                                : item.status === "Collected"
                                  ? "bg-[#F8FEA5]"
                                  : item.status === "On the way"
                                    ? "bg-[#FFEDCF]"
                                    : item.status === "Hold"
                                      ? "bg-[#FFEDCF]"
                                      : item.status === "Delivered"
                                        ? "bg-[#BBFFC6]"
                                        : item.status === "Cancelled"
                                          ? "bg-[#DFDFDF]"
                                          : item.status === "Return"
                                            ? "bg-[#FFDCDA]"
                                            : "bg-[#EAEAEA]"
                        }`}
                      >
                        <Text
                          className={`text-xs font-semibold ${
                            item.status === "Ordered"
                              ? "text-[#878216]"
                              : item.status === "Processing"
                                ? "text-[#3B82F6]"
                                : item.status === "Out For Delivery"
                                  ? "text-[#80118A]"
                                  : item.status === "Collected"
                                    ? "text-[#7E8700]"
                                    : item.status === "On the way"
                                      ? "text-[#D17A00]"
                                      : item.status === "Hold"
                                        ? "text-[#D17A00]"
                                        : item.status === "Delivered"
                                          ? "text-[#308233]"
                                          : item.status === "Cancelled"
                                            ? "text-[#5C5C5C]"
                                            : item.status === "Return"
                                              ? "text-[#FF1100]"
                                              : "text-[#393939]"
                          }`}
                        >
                          {item.status}
                        </Text>
                      </View>
                    </View>

                    <Text className="text-sm text-[#808FA2] mt-1">
                      Scheduled to: {formatsheduleDate(item.sheduleDate)}
                    </Text>
                    <Text className="text-sm text-[#808FA2]">
                      {item.sheduleTime}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              onEndReached={loadMoreOrders}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              refreshControl={
                <RefreshControl
                  refreshing={loading}
                  onRefresh={handleRefresh}
                  colors={["#6B3BCF"]}
                />
              }
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          ) : (
            <View className="flex-1 justify-center items-center px-4">
              <View className="flex-1 justify-center items-center">
                <Image
                  source={require("@/assets/images/public/no-data.webp")}
                  style={{
                    width: wp("60%"),
                    height: hp("30%"),
                    resizeMode: "contain",
                  }}
                />
                <Text className="text-black text-i text-center mt-4">
                  {orders.length === 0
                    ? "No orders found"
                    : searchText
                      ? "No matching orders found"
                      : `No orders found with status "${selectedFilter}"`}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;
