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
  Image,
  Dimensions,
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingPage from "../common/LoadingPage";
import CustomHeader from "../common/CustomHeader";
import FixedMarqueeText from "../common/MarqueeText";

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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const {
    name: initialName,
    number: initialNumber,
    id,
    customerId,
    title: initialTitle,
  } = route.params;
  const [customerName, setCustomerName] = useState(initialName);
  const [customerTitle, setCustomerTitle] = useState(initialTitle);
  const [customerNumber, setCustomerNumber] = useState(initialNumber);
  const isFirstRender = useRef(true);

  useEffect(() => {
    setCustomerName(initialName || "");
    setCustomerTitle(initialTitle || "");
    setCustomerNumber(initialNumber || "");
  }, [initialName, initialTitle, initialNumber]);

  useFocusEffect(
    React.useCallback(() => {
      isFirstRender.current = true;

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
      loadOrders(1, true, false, "Ordered");
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
        { headers: { Authorization: `Bearer ${storedToken}` } },
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

        const freshFirstName = response.data.firstName || "";
        const freshLastName = response.data.lastName || "";
        const freshTitle = response.data.title || "";
        const freshPhone = response.data.phoneNumber || initialNumber;

        setCustomerName(
          `${freshFirstName} ${freshLastName}`.trim() || initialName,
        );
        setCustomerTitle(freshTitle || initialTitle);
        setCustomerNumber(freshPhone);

        const locationName =
          `${freshTitle} ${freshFirstName} ${freshLastName}`.trim();
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
    statusFilter = selectedFilter,
  ) => {
    try {
      if (showFullLoading) {
        setLoading(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      }

      setError(null);

      const response = await axios.get<OrdersResponse>(
        `${environment.API_BASE_URL}api/orders/get-order-bycustomerId/${id}?page=${page}&limit=${ORDERS_PER_PAGE}&status=${encodeURIComponent(statusFilter)}`,
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
    loadOrders(1, true, false, selectedFilter);
  };

  useEffect(() => {
    if (searchText.trim() === "") {
      setSearchError(null);
    } else {
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
    const phoneNumber = `tel:${customerNumber}`;
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

  const handleSearch = () => {};

  const filteredOrders = orders.filter(
    (order) =>
      !searchText ||
      (order.InvNo &&
        order.InvNo.toLowerCase().includes(searchText.toLowerCase())),
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setOrders([]);
    setCurrentPage(1);
    setHasMore(true);
    setSearchText("");
    loadOrders(1, true, false, selectedFilter);
  }, [selectedFilter]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
      <View className="flex-1 bg-white">
        <View
          style={{
            paddingTop: 12,
            paddingHorizontal: 12,
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "transparent",
          }}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("CustomersScreen")}
            style={{
              width: 45,
              height: 45,
              borderRadius: 25,
              backgroundColor: "#F6F6F680",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginLeft: 10,
              zIndex: 1,
            }}
            activeOpacity={0.7}
          >
            <Entypo name="chevron-left" size={25} color={"black"} />
          </TouchableOpacity>

          <View
            style={{
              flex: 1,
              alignItems: "center",
              overflow: "hidden",
              marginHorizontal: 8,
            }}
          >
            {(() => {
              const fullDisplayName =
                `${customerTitle}. ${customerName}`.trim();
              return fullDisplayName.length > 25 ? (
                <FixedMarqueeText
                  key={fullDisplayName}
                  text={fullDisplayName}
                  style={{ fontSize: 16, fontWeight: "bold" }}
                  speed={50}
                />
              ) : (
                <Text
                  key={fullDisplayName}
                  style={{
                    fontSize: 16,
                    fontWeight: "bold",
                    color: "#000",
                    textAlign: "center",
                  }}
                >
                  {fullDisplayName}
                </Text>
              );
            })()}
          </View>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditCustomerScreen", {
                id,
                customerId,
                name: customerName,
                title: customerTitle,
              })
            }
            style={{
              width: 45,
              height: 45,

              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginRight: 10,
              zIndex: 1,
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={22} color="#6839CF" />
          </TouchableOpacity>
        </View>
        {/* Header Section */}

        <View className="bg-white flex-row rounded-b-[35px] items-center justify-between z-50  px-5">
          <View className="flex-1 justify-center items-center gap-1">
            <Text
              className="text-[#393939] text-base"
              style={{ textAlign: "center", fontSize: 16 }}
            >
              Customer ID: {customerId}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ExcludeItemEditSummery", {
                  id,
                  customerId,
                  name: customerName,
                  title: customerTitle,
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
          <View className="flex-row justify-between mb-4 gap-x-4 mt-2">
            <TouchableOpacity
              onPress={handleGetACall}
              className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
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
                  customerId,
                  name: customerName,
                  title: customerTitle,
                  number: customerNumber,
                  customerscreencustomerid: customerId,
                })
              }
              className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 4,
              }}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                New Order
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-1 mx-auto w-full max-w-[500px]">
          {/* Search and Filters */}
          <View className="mx-6">
            <View className="flex-row items-center bg-[#F5F1FC] px-4 border border-[#6B3BCF] rounded-full mt-4 ">
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
            ) : searchError ? (
              <ScrollView
                contentContainerStyle={{
                  alignItems: "center",
                  marginTop: hp("8%"),
                  flexGrow: 1,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={handleRefresh}
                    colors={["#6B3BCF"]}
                  />
                }
              >
                <Image
                  source={require("@/assets/images/public/no-data.webp")}
                  style={{
                    width: wp("60%"),
                    height: hp("30%"),
                    resizeMode: "contain",
                  }}
                />
                <Text className="text-black italic text-center mt-3">
                  No orders found
                </Text>
              </ScrollView>
            ) : filteredOrders.length > 0 ? (
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
                        marginBottom: 8,
                        marginHorizontal: 16,
                        marginTop: 4,
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
                        <Text
                          className="font-semibold text-gray-900"
                          style={{ fontSize: SCREEN_HEIGHT > 900 ? 20 : 16 }}
                        >
                          Order: #{item.InvNo || "N/A"}
                        </Text>
                        <View
                          className={`min-w-[200px]  py-1 rounded-full ${
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
                            className={`text-xs font-semibold mx-auto ${
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

                      <Text
                        className="text-[#808FA2] mt-1"
                        style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                      >
                        Scheduled to: {formatsheduleDate(item.sheduleDate)}
                      </Text>
                      <Text
                        className="text-[#808FA2]"
                        style={{ fontSize: SCREEN_HEIGHT > 900 ? 16 : 14 }}
                      >
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
              <ScrollView
                contentContainerStyle={{
                  alignItems: "center",
                  paddingHorizontal: 16,
                  marginTop: hp("4%"),
                  flexGrow: 1,
                }}
                refreshControl={
                  <RefreshControl
                    refreshing={loading}
                    onRefresh={handleRefresh}
                    colors={["#6B3BCF"]}
                  />
                }
              >
                <Image
                  source={require("@/assets/images/public/no-data.webp")}
                  style={{
                    width: wp("60%"),
                    height: hp("30%"),
                    resizeMode: "contain",
                  }}
                />
                <Text className="text-black italic text-center mt-4">
                  {orders.length === 0
                    ? "No orders found"
                    : searchText
                      ? "No matching orders found"
                      : `No orders found with status "${selectedFilter}"`}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;
