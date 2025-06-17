import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
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
 
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import OrderScreenSkeleton from '../components/Skeleton/OrderScreenSkeleton';
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";

// ViewOrdersScreen.tsx - Updated with Pagination
type ViewOrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewOrdersScreen">;

interface ViewOrdersScreenProps {
  navigation: ViewOrdersScreenNavigationProp;
}

interface Order {
  orderId: number;
  customerId: number;
  deliveryType: string;
  sheduleDate: string;
  sheduleTime: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  status: string;
  createdAt: string;
  InvNo: string;
  reportStatus: string;
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

const ViewOrdersScreen: React.FC<ViewOrdersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const isMounted = useRef(true);

  const ORDERS_PER_PAGE = 5;

  const safeSetOrders = (data: Order[]) => {
    if (isMounted.current) {
      setOrders(data);
    }
  };

  const safeSetLoading = (value: boolean) => {
    if (isMounted.current) {
      setLoading(value);
    }
  };

  const safeSetRefreshing = (value: boolean) => {
    if (isMounted.current) {
      setRefreshing(value);
    }
  };

  const safeSetLoadingMore = (value: boolean) => {
    if (isMounted.current) {
      setLoadingMore(value);
    }
  };

  const loadOrders = async (page = 1, showFullLoading = true, isLoadMore = false) => {
    if (showFullLoading) safeSetLoading(true);
    if (isLoadMore) safeSetLoadingMore(true);
    
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        if (isMounted.current) {
          navigation.navigate("LoginScreen" as any);
        }
        return;
      }
      
      const response = await axios.get<OrdersResponse>(
        `${environment.API_BASE_URL}api/orders/get-orders?page=${page}&limit=${ORDERS_PER_PAGE}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("data", response.data);
      
      if (response.data.success && response.data.data) {
        if (isLoadMore) {
          // Append new orders to existing ones
          if (isMounted.current) {
            setOrders(prevOrders => [...prevOrders, ...response.data.data]);
          }
        } else {
          // Replace orders (for initial load or refresh)
          safeSetOrders(response.data.data);
        }
        
        if (isMounted.current) {
          setHasMore(response.data.hasMore);
          setCurrentPage(response.data.currentPage);
          setTotalCount(response.data.totalCount);
        }
        
        console.log("Orders loaded:", response.data.data.length);
      } else {
        if (!isLoadMore) {
          safeSetOrders([]);
        }
        if (isMounted.current) {
          setHasMore(false);
        }
        console.log("No orders data or success is false");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      if (!isLoadMore) {
        safeSetOrders([]);
      }
      if (isMounted.current) {
        setHasMore(false);
      }
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        if (isMounted.current) {
          navigation.navigate("LoginScreen" as any);
        }
      }
    } finally {
      if (showFullLoading) safeSetLoading(false);
      if (isLoadMore) safeSetLoadingMore(false);
      safeSetRefreshing(false);
    }
  };

  const loadMoreOrders = () => {
    if (!loadingMore && hasMore) {
      loadOrders(currentPage + 1, false, true);
    }
  };

  const onRefresh = useCallback(() => {
    safeSetRefreshing(true);
    if (isMounted.current) {
      setCurrentPage(1);
      setHasMore(true);
    }
    loadOrders(1, false, false);
  }, []);

  useEffect(() => {
    console.log("Component mounted");
    
    // Set up listeners
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Screen focused - loading orders");
      if (isMounted.current) {
        setCurrentPage(1);
        setHasMore(true);
      }
      loadOrders(1, true, false);
    });

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    // Initial load
    loadOrders(1, true, false);

    // Cleanup function
    return () => {
      console.log("Component unmounting");
      isMounted.current = false;
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation]);

  const filters = ["All", "Today", "Tomorrow", "In 3 Days", "This Week"];

  // Safe implementation with null check
  const filteredOrders = useMemo(() => {
    console.log("Computing filtered orders. Orders length:", orders?.length || 0);
    
    if (!orders || !Array.isArray(orders)) {
      console.log("Orders is undefined or not an array");
      return [];
    }
    
    return orders.filter((order) => {
      try {
        const matchesFilter = () => {
          if (selectedFilter === "All") return true;
          
          const today = new Date();
          const orderDate = new Date(order.sheduleDate);
          
          if (selectedFilter === "Today") {
            return orderDate.toDateString() === today.toDateString();
          }
          
          if (selectedFilter === "Tomorrow") {
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            return orderDate.toDateString() === tomorrow.toDateString();
          }
          
          if (selectedFilter === "In 3 Days") {
            const in3Days = new Date();
            in3Days.setDate(today.getDate() + 3);
            return orderDate.toDateString() === in3Days.toDateString();
          }
          
          if (selectedFilter === "This Week") {
            const startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - today.getDay());
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            
            return orderDate >= startOfWeek && orderDate <= endOfWeek;
          }
          
          return false;
        };
        
        return matchesFilter() && (!searchText || (order.InvNo && order.InvNo.toLowerCase().includes(searchText.toLowerCase())));
      } catch (error) {
        console.error("Error filtering order:", error);
        return false;
      }
    });
  }, [orders, selectedFilter, searchText]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const isEmpty = filteredOrders.length === 0;

  const renderFooter = () => {
    if (!hasMore && orders.length > 0) {
      return (
        <View className="py-4 items-center">
          <Text className="text-gray-500 text-sm"></Text>
        </View>
      );
    }

    if (loadingMore) {
      return (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#884EDC" />
          <Text className="text-gray-500 text-sm mt-2">Loading more orders...</Text>
        </View>
      );
    }

    if (hasMore && orders.length >= ORDERS_PER_PAGE) {
      return (
        <TouchableOpacity 
          onPress={loadMoreOrders}
          className="py-4 items-center bg-gray-50 mx-4 rounded-lg mb-4"
        >
          <Text className="text-purple-600 font-semibold">Load More Orders</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1"
    >
      <View className="flex-1 bg-white">
        {/* Loading Animation */}
        {loading ? (
          <OrderScreenSkeleton />
        ) : (
          <>
            {/* Header */}
            <LinearGradient colors={["#884EDC", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
              <View className="flex-row items-center">
                <Text className="text-white text-lg font-bold mt-[-4]">
                  Total Orders: <Text className="font-bold">{totalCount}</Text>
                  {orders.length < totalCount && (
                    <Text className="font-normal text-sm"> </Text>
                  )}
                </Text>
              </View>
            </LinearGradient>

            {/* Search Bar */}
            <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mx-auto w-[90%] shadow-md mt-[-22]">
              <TextInput
                placeholder="Search By Order Number"
                placeholderTextColor="#6839CF"
                className="flex-1 text-sm text-purple"
                onChangeText={(text) => setSearchText(text)}
                value={searchText}
                style={{ fontStyle: 'italic' }}
              />
              <Image source={require("../assets/images/search.webp")} className="w-6 h-6" resizeMode="contain" />
            </View>

            {/* Horizontal Scrollable Filters */}
            <View>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ 
                  paddingHorizontal: 16,
                  height: 40, 
                  marginBottom: 5
                }}
                className="my-2"
              >
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter}
                    style={{
                      paddingHorizontal: 12, 
                      paddingVertical: 6,    
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "#6B3BCF",
                      backgroundColor: selectedFilter === filter ? "#6B3BCF" : "transparent",
                      marginHorizontal: 4,   
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: 32,          
                      minWidth: 80,        
                    }}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text style={{
                      fontSize: 14,
                      fontWeight: selectedFilter === filter ? "bold" : "normal",
                      color: selectedFilter === filter ? "white" : "#6B3BCF",
                    }}>
                      {filter}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="py-[-12%] mb-[60%]">
              {isEmpty ? (
                <View className="flex-1 justify-center items-center px-4 mt-[60%]">
                  <LottieView
                    source={require("../assets/images/NoComplaints.json")}
                    style={{ width: wp(50), height: hp(50) }}
                    autoPlay
                    loop
                  />
                </View>
              ) : (
                <FlatList
                  data={filteredOrders}
                  className="p-4 mb-10"
                  keyExtractor={(item) => item.orderId.toString()}
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
                  onEndReachedThreshold={0.1}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      onPress={() => navigation.navigate("View_CancelOrderScreen" as any, { orderId: item.orderId })} 
                      activeOpacity={0.7}
                    >
                      <View style={{
                        backgroundColor: "white",
                        borderRadius: wp(4),
                        padding: wp(4),
                        marginBottom: hp(2),
                        borderWidth: 1,
                        borderColor: "#EAEAEA",
                        marginHorizontal: wp(4),
                        shadowColor: "#0000001A",
                        shadowOpacity: 0.2,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: 5,
                        elevation: 5,
                      }}>
                        {/* Order number and status */}
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <Text style={{ fontSize: wp(4.5), fontWeight: "600", color: "#393939" }}>Order: {item.InvNo}</Text>
                          <View style={{
                            paddingHorizontal: wp(3),
                            paddingVertical: hp(0.5),
                            borderRadius: wp(5),
                            backgroundColor:
                              item.status === "Ordered" ? "#EAEAEA" :
                              item.status === "On the way" ? "#FFFD99" :
                              item.status === "Processing" ? "#CFE1FF" : 
                              item.status === "Delivered" ? "#CCFBF1" : 
                              item.status === "Cancelled" ? "#FCE7F3" : "#EAEAEA",
                          }}>
                            <Text style={{
                              fontSize: wp(3),
                              fontWeight: "600",
                              color:
                                item.status === "Ordered" ? "#393939" :
                                item.status === "On the way" ? "#A6A100" :
                                item.status === "Processing" ? "#3B82F6" : 
                                item.status === "Delivered" ? "#0D9488" : 
                                item.status === "Cancelled" ? "#BE185D" : "#393939",
                            }}>
                              {item.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={{ fontSize: wp(3.6), color: "#808FA2" }}>
                          Schedule to: {formatDate(item.sheduleDate)}
                        </Text>

                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          {/* Customer name */}
                          <Text style={{ fontSize: wp(3.6), color: "#808FA2", marginTop: hp(0.5) }}>
                            Within : {item.sheduleTime}
                          </Text>
                          <Text style={{ fontSize: wp(3.6), color: "#FF4C4C" }}> {item.reportStatus}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                  contentContainerStyle={{ paddingBottom: hp(5) }}
                />
              )}
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ViewOrdersScreen;