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
import {
  Entypo,
  FontAwesome,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import LoadingPage from "../common/LoadingPage";
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
  isPaid: number;
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

const getDisplayStatus = (status: string) => {
  if (!status) return "";
  const normalizedStatus = status.trim();
  if (normalizedStatus === "Return Received" || normalizedStatus === "Return") {
    return "Return";
  }
  return normalizedStatus;
};

const FILTER_TO_BACKEND_STATUS: Record<string, string> = {
  Return: "Return",
};

const ViewCustomerScreen: React.FC<ViewCustomerScreenProps> = ({
  route,
  navigation,
}) => {
  const ORDERS_PER_PAGE = 5;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [creditBalance, setCreditBalance] = useState<number>(0);
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

  const fullName = `${customerTitle ? customerTitle + ". " : ""}${customerName}`;

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
        setOrders([]);
        setCurrentPage(1);
        setHasMore(true);
        setLoading(true);
        setLoadingMore(false);
        setError(null);
        setSearchError(null);
      };

      resetStates();
      loadOrders(1, true, false, selectedFilter);
      getUserProfile();

      return () => {};
    }, [id, customerId]),
  );

  const [address, setAddress] = useState<string>("Loading...");
  const [savedCount, setSavedCount] = useState<number>(0);

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

        const balance = Number(response.data.creditBalance) || 0;
        setCreditBalance(balance);

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

      try {
        const detailResponse = await axios.get(
          `${environment.API_BASE_URL}api/customer/get-customer-data/${id}`,
        );

        if (detailResponse.status === 200) {
          const building = detailResponse.data.building;
          const customer = detailResponse.data.customer;
          const nearestCity = customer?.nearesCity || "";
          const isApartment = customer?.buildingType === "Apartment";

          if (building) {
            const houseOrBuildingNo = building.houseNo || building.buildingNo;

            const formattedAddress = [
              houseOrBuildingNo ? `No.${houseOrBuildingNo}` : null,
              building.streetName,
              nearestCity,
            ]
              .filter(Boolean)
              .join(", ");

            // Only append "..." for apartments, house stays clean
            setAddress(
              formattedAddress
                ? isApartment
                  ? `${formattedAddress}...`
                  : formattedAddress
                : "No Address Found",
            );
          } else {
            setAddress("No Address Found");
          }

          setSavedCount(Number(detailResponse.data.savedAddressCount) || 0);
        } else {
          setAddress("No Address Found");
          setSavedCount(0);
        }
      } catch (detailError) {
        console.error(
          "Error fetching detailed customer building address:",
          detailError,
        );
        setAddress("No Address Found");
        setSavedCount(0);
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
        navigation.navigate("Main" as any, {
          screen: "CustomersScreen",
        });
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
      console.warn("⚠️ Error fetching orders (handled):", err.message || err);

      if (err.response && err.response.status === 404) {
        setOrders([]);
        setError(null);
        setHasMore(false);
      } else {
        console.error("❌ Actual error fetching orders:", err);
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
          (selectedFilter === "All" ||
            getDisplayStatus(order.status) === selectedFilter),
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

  const filteredOrders = orders.filter((order) => {
    const matchesStatus =
      selectedFilter === "All" ||
      getDisplayStatus(order.status) === selectedFilter;
    const matchesSearch =
      !searchText ||
      (order.InvNo &&
        order.InvNo.toLowerCase().includes(searchText.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

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
      {/* Full-screen linear gradient background: #FBFAFE -> #FFFFFF, top to bottom, 30px corner radius */}
      <LinearGradient
        colors={["#FBFAFE", "#FFFFFF"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1, overflow: "hidden" }}
      >
        {/* Top Header Row */}
        <View
          style={{
            paddingTop: 16,
            paddingHorizontal: 16,
            flexDirection: "row",
            alignItems: "flex-start",
            backgroundColor: "transparent",
            zIndex: 10,
          }}
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Main" as any, {
                screen: "CustomersScreen",
              })
            }
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#F6F6F6",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 2,
              marginTop: 4,
            }}
            activeOpacity={0.7}
          >
            <Entypo name="chevron-left" size={22} color={"black"} />
          </TouchableOpacity>

          {/* Center Title Content */}
          <View style={{ flex: 1, alignItems: "center", marginHorizontal: 12 }}>
            {fullName.length > 25 ? (
              <FixedMarqueeText
                text={fullName}
                style={{ fontSize: 18, fontWeight: "bold", color: "#000" }}
                speed={50}
              />
            ) : (
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#000",
                  textAlign: "center",
                }}
              >
                {fullName}
              </Text>
            )}

            <Text
              style={{
                fontSize: 15,
                color: "#393939",
                marginTop: 6,
                fontWeight: "500",
              }}
            >
              Customer ID : {customerId}
            </Text>

            <TouchableOpacity
              onPress={() =>
                navigation.navigate("ExcludeItemEditSummery", {
                  id,
                  customerId,
                  name: customerName,
                  title: customerTitle,
                  phone: customerNumber,
                })
              }
              style={{ marginTop: 8 }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    color: "#7240D3",
                    textDecorationLine: "underline",
                    fontWeight: "600",
                    fontSize: 14,
                    marginRight: 6,
                  }}
                >
                  Package Preferences
                </Text>
                <AntIcons name="external-link" size={16} color="#7240D3" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Edit button */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Main" as any, {
                screen: "EditCustomerScreen",
                params: {
                  id,
                  customerId,
                  name: customerName,
                  title: customerTitle,
                },
              })
            }
            style={{
              width: 40,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 4,
            }}
            activeOpacity={0.7}
          >
            <MaterialIcons name="edit" size={24} color="#6839CF" />
          </TouchableOpacity>
        </View>

        {/* Address Cards Section */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            marginTop: 20,
            justifyContent: "space-between",
          }}
        >
          {/* Residential Address Card */}
          <View style={{ flex: 1, marginRight: 8 }}>
            {/* Purple curved underline peeking from behind */}
            <View
              style={{
                position: "absolute",
                top: 6,
                left: 4,
                right: 4,
                bottom: -4,
                backgroundColor: "#6938D3",
                borderRadius: 20,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("ResidentialAddress", {
                  customerId: id,
                });
              }}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#EDEDFF",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 6,
                elevation: 2,
                height: 140,
                justifyContent: "space-between",
              }}
            >
              <View>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: "#F5F1FD",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <Entypo name="location-pin" size={18} color="#6B3BCF" />
                </View>
                <Text
                  style={{ fontSize: 13, fontWeight: "bold", color: "#1F2937" }}
                >
                  Residential Address
                </Text>
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginTop: 4,
                    lineHeight: 15,
                  }}
                >
                  {address}
                </Text>
              </View>
              <View style={{ alignSelf: "flex-end" }}>
                <Entypo name="chevron-right" size={16} color="#6B3BCF" />
              </View>
            </TouchableOpacity>
          </View>

          {/* Delivery Address Book Card */}
          <View style={{ flex: 1, marginLeft: 8 }}>
            {/* Purple curved underline peeking from behind */}
            <View
              style={{
                position: "absolute",
                top: 6,
                left: 4,
                right: 4,
                bottom: -4,
                backgroundColor: "#6938D3",
                borderRadius: 20,
              }}
            />
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("DeliveryAddressBooks", {
                  customerId: id,
                });
              }}
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 20,
                padding: 14,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                shadowColor: "#EDEDFF",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 1,
                shadowRadius: 4,
                elevation: 2,
                height: 140,
                justifyContent: "space-between",
              }}
            >
              <View>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: "#F5F1FD",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 10,
                  }}
                >
                  <FontAwesome name="folder-open" size={18} color="#6B3BCF" />
                </View>
                <Text
                  style={{ fontSize: 13, fontWeight: "bold", color: "#1F2937" }}
                >
                  Delivery Address Book
                </Text>
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={{
                    fontSize: 11,
                    color: "#9CA3AF",
                    marginTop: 4,
                    lineHeight: 15,
                  }}
                >
                  {savedCount} Saved
                </Text>
              </View>
              <View style={{ alignSelf: "flex-end" }}>
                <Entypo name="chevron-right" size={16} color="#6B3BCF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Negative Credit Balance Warning */}
        {creditBalance < 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              backgroundColor: "#FEF6F0",
              borderWidth: 1,
              borderColor: "#FDE4D4",
              borderRadius: 14,
              marginHorizontal: 16,
              marginTop: 14,
              padding: 12,
            }}
          >
            <MaterialIcons
              name="warning"
              size={18}
              color="#F5811F"
              style={{ marginRight: 8, marginTop: 7 }}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={{ fontSize: 13, fontWeight: "bold", color: "#000000" }}
              >
                Negative Credit Balance{" "}
                <Text
                  style={{ fontSize: 13, fontWeight: "bold", color: "#FF6400" }}
                >
                  ( -Rs.{" "}
                  {Math.abs(creditBalance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  )
                </Text>
              </Text>
              <Text style={{ fontSize: 12, color: "#5E6089", marginTop: 2 }}>
                Ask the customer to clear the balance first.
              </Text>
            </View>
          </View>
        )}

        {/* Scrollable orders content area */}
        <View style={{ flex: 1, marginTop: 15 }}>
          {/* Search Bar */}
          <View style={{ paddingHorizontal: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FAF9FE",
                paddingHorizontal: 16,
                borderWidth: 1.5,
                borderColor: "#E8E2F7",
                borderRadius: 25,
                height: 48,
              }}
            >
              <TextInput
                placeholder="Search By Order No"
                placeholderTextColor="#A389D4"
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: "#1F2937",
                  height: "100%",
                  fontStyle: "italic",
                }}
                onChangeText={(text) => {
                  const numericOnly = text.replace(/[^0-9]/g, "");
                  setSearchText(numericOnly);
                }}
                value={searchText}
                keyboardType="numeric"
              />
              <TouchableOpacity onPress={handleSearch}>
                <AntIcons name="search" size={20} color="#6B3BCF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Filters List */}
          {!searchError && (
            <View style={{ marginTop: 14 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              >
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 20,
                      borderWidth: 1.5,
                      borderColor: "#6B3BCF",
                      marginRight: 8,
                      backgroundColor:
                        selectedFilter === filter ? "#6B3BCF" : "transparent",
                    }}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={{
                        textAlign: "center",
                        fontSize: 13,
                        fontWeight: "600",
                        color:
                          selectedFilter === filter ? "#FFFFFF" : "#6B3BCF",
                      }}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Orders List */}
          <View style={{ flex: 1, marginTop: 12 }}>
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <ActivityIndicator size="large" color="#6B3BCF" />
                <Text style={{ color: "#6B3BCF", marginTop: 8 }}>
                  Loading orders...
                </Text>
              </View>
            ) : error ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ color: "#EF4444", textAlign: "center" }}>
                  {error}
                </Text>
                <TouchableOpacity
                  style={{
                    marginTop: 16,
                    backgroundColor: "#6B3BCF",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 25,
                  }}
                  onPress={handleRefresh}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Retry
                  </Text>
                </TouchableOpacity>
              </View>
            ) : searchError ? (
              <ScrollView
                contentContainerStyle={{
                  justifyContent: "center",
                  alignItems: "center",
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
                <Text
                  style={{
                    color: "#000000",
                    fontStyle: "italic",
                    textAlign: "center",
                    marginTop: 12,
                  }}
                >
                  {" "}
                  No orders found{" "}
                </Text>
              </ScrollView>
            ) : filteredOrders.length > 0 ? (
              <FlatList
                data={filteredOrders}
                keyExtractor={(item, index) => {
                  const safeOrderId = item.orderId || "unknown";
                  const safeInvNo = item.InvNo || "";
                  const safeCreatedAt = item.createdAt || "";
                  return `${safeOrderId}-${safeInvNo}-${safeCreatedAt}-${index}`;
                }}
                renderItem={({ item }) => {
                  const isPaymentPending =
                    Number(item.isPaid) === 0 &&
                    item.paymentMethod === "Card" &&
                    item.status !== "Cancelled";
                  const displayStatus = getDisplayStatus(item.status);

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
                          backgroundColor: "#FFFFFF",
                          borderRadius: 20,
                          padding: 16,
                          marginBottom: 12,
                          marginHorizontal: 16,
                          borderWidth: 1.5,
                          borderColor: isPaymentPending ? "#EF4444" : "#F3F4F6",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.04,
                          shadowRadius: 8,
                          elevation: 2,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontWeight: "bold",
                              color: "#1F2937",
                              fontSize: SCREEN_HEIGHT > 900 ? 18 : 15,
                            }}
                          >
                            Order : #{item.InvNo || "N/A"}
                          </Text>
                          <View
                            style={{
                              paddingVertical: 4,
                              paddingHorizontal: 12,
                              borderRadius: 12,
                              backgroundColor:
                                displayStatus === "Ordered"
                                  ? "#F5FF85"
                                  : displayStatus === "Processing"
                                    ? "#CFE1FF"
                                    : displayStatus === "Out For Delivery" ||
                                        displayStatus === "Out for Delivery"
                                      ? "#FCD4FF"
                                      : displayStatus === "Collected"
                                        ? "#F8FEA5"
                                        : displayStatus === "On the way"
                                          ? "#FFEDCF"
                                          : displayStatus === "Hold"
                                            ? "#FFEDCF"
                                            : displayStatus === "Delivered"
                                              ? "#BBFFC6"
                                              : displayStatus === "Cancelled"
                                                ? "#DFDFDF"
                                                : displayStatus === "Return"
                                                  ? "#FFDCDA"
                                                  : "#EAEAEA",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              numberOfLines={1}
                              style={{
                                fontSize: 11,
                                fontWeight: "bold",
                                color:
                                  displayStatus === "Ordered"
                                    ? "#878216"
                                    : displayStatus === "Processing"
                                      ? "#3B82F6"
                                      : displayStatus === "Out For Delivery" ||
                                          displayStatus === "Out for Delivery"
                                        ? "#80118A"
                                        : displayStatus === "Collected"
                                          ? "#7E8700"
                                          : displayStatus === "On the way"
                                            ? "#D17A00"
                                            : displayStatus === "Hold"
                                              ? "#D17A00"
                                              : displayStatus === "Delivered"
                                                ? "#308233"
                                                : displayStatus === "Cancelled"
                                                  ? "#5C5C5C"
                                                  : displayStatus === "Return"
                                                    ? "#FF1100"
                                                    : "#393939",
                              }}
                            >
                              {displayStatus}
                            </Text>
                          </View>
                        </View>

                        {isPaymentPending && (
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginTop: 6,
                            }}
                          >
                            <MaterialIcons
                              name="error"
                              size={13}
                              color="#EF4444"
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={{
                                color: "#EF4444",
                                fontWeight: "bold",
                                fontSize: SCREEN_HEIGHT > 900 ? 13 : 11,
                              }}
                            >
                              Payment Pending
                            </Text>
                          </View>
                        )}

                        <Text
                          style={{
                            color: "#9CA3AF",
                            marginTop: 6,
                            fontSize: SCREEN_HEIGHT > 900 ? 14 : 12,
                          }}
                        >
                          Scheduled to : {formatsheduleDate(item.sheduleDate)}
                        </Text>
                        <Text
                          style={{
                            color: "#9CA3AF",
                            marginTop: 2,
                            fontSize: SCREEN_HEIGHT > 900 ? 14 : 12,
                          }}
                        >
                          {item.sheduleTime}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
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
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            ) : (
              <ScrollView
                contentContainerStyle={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingHorizontal: 16,
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
                <Text
                  style={{
                    color: "#000000",
                    fontStyle: "italic",
                    textAlign: "center",
                    marginTop: 1,
                  }}
                >
                  {orders.length === 0
                    ? " No orders found "
                    : searchText
                      ? "No matching orders found"
                      : `No orders found with status "${selectedFilter}"`}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>

        {/* Sticky Bottom Action Buttons */}
        {!isKeyboardVisible && (
          <View
            style={{
              paddingHorizontal: 16,
              paddingVertical: 14,
              backgroundColor: "#F5F2FE",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            {/* Get a Call Button */}
            <TouchableOpacity
              onPress={handleGetACall}
              style={{
                flex: 1,
                flexDirection: "row",
                height: 48,
                borderRadius: 24,
                borderWidth: 1.5,
                borderColor: "#6B3BCF",
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 8,

                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons
                name="call"
                size={18}
                color="#6B3BCF"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{ color: "#6B3BCF", fontWeight: "bold", fontSize: 15 }}
              >
                Get a Call
              </Text>
            </TouchableOpacity>

            {/* New Order Button */}
            <TouchableOpacity
              disabled={creditBalance < 0}
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
              style={{
                flex: 1,
                flexDirection: "row",
                height: 48,
                borderRadius: 24,
                backgroundColor: creditBalance < 0 ? "#B8B8B8" : "#6B3BCF",
                alignItems: "center",
                justifyContent: "center",
                marginLeft: 8,
                opacity: creditBalance < 0 ? 0.7 : 1,

                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons
                name="add-circle"
                size={20}
                color="#FFFFFF"
                style={{ marginRight: 6 }}
              />
              <Text
                style={{ color: "#FFFFFF", fontWeight: "bold", fontSize: 15 }}
              >
                New Order
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;