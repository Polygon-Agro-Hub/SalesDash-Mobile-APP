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
import { RootStackParamList } from "../types/types";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import OrderScreenSkeleton from '../Skeleton/OrderScreenSkeleton';
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { useFocusEffect } from '@react-navigation/native';
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
  reportStatus: string |null;
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
        
      } else {
        if (!isLoadMore) {
          safeSetOrders([]);
        }
        if (isMounted.current) {
          setHasMore(false);
        }
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

    
    // Set up listeners
    const unsubscribe = navigation.addListener('focus', () => {
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
      isMounted.current = false;
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation]);

  const filters = ["All", "Today", "Tomorrow", "In 3 Days", "This Week"];

  // Safe implementation with null check
  const filteredOrders = useMemo(() => {
    
    if (!orders || !Array.isArray(orders)) {
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

  useFocusEffect(
  React.useCallback(() => {
 
    // Reset search-related states
    setSearchText("");
    setSelectedFilter("All");
    
    // Reset pagination states
    setCurrentPage(1);
    setHasMore(true);
    
    // Load fresh orders
    loadOrders(1, true, false);

    // Cleanup function (optional)
    return () => {
    };
  }, [])
);
  

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
      style={{flex: 1}}
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
    className="flex-1 text-sm text-purple h-10"
    onChangeText={(text) => {
      // Only allow numbers - remove all letters, special characters, and spaces
      const numericOnly = text.replace(/[^0-9]/g, '');
      setSearchText(numericOnly);
    }}
    value={searchText}
    style={{ fontStyle: 'italic' }}
    keyboardType="numeric" 
  />
  <Image source={require("../../assets/images/search.webp")} className="w-6 h-6" resizeMode="contain" />
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
                <View className="">
                <View className="flex-1 justify-center items-center px-4 mt-[60%]">
                  <LottieView
                    source={require("../../assets/images/NoComplaints.json")}
                    style={{ width: wp(50), height: hp(50) }}
                    autoPlay
                    loop
                  />

   
                </View>
                <View className="justify-center items-center px-4 mt-[20%]">
                             <Text className="text-gray-500 ">No Data Found</Text>
                             </View>
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
                      onPress={() => navigation.navigate("View_CancelOrderScreen" as any, { orderId: item.orderId , status:item.status , reportStatus:item.reportStatus})} 
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
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
                        className=""
                        >
                          <Text style={{ fontSize: wp(4.5), fontWeight: "600", color: "#393939" }}>Order: {item.InvNo}</Text>
<View style={{
  paddingHorizontal: wp(3),
  paddingVertical: hp(0.5),
  borderRadius: wp(5),
  minWidth: wp(24), // Fixed minimum width for consistency
  alignItems: 'center', // Center the text
  backgroundColor:
    item.status === "Ordered" ? "#F5FF85" :
    item.status === "On the way" ? "#FFEDCF" :
    item.status === "Processing" ? "#CFE1FF" : 
    item.status === "Delivered" ? "#BBFFC6" : 
    item.status === "Collected" ? "#F8FEA5" :
    item.status === "Hold" ? "#FFEDCF" : 
    item.status === "Out For Delivery" ? "#FCD4FF" :
    item.status === "Return" ? "#FFDCDA" : 
    item.status === "Cancelled" ? "#DFDFDF" : "#EAEAEA",
}}>
  <Text style={{
    fontSize: wp(3),
    fontWeight: "600",
    textAlign: 'center', // Center align text
    color:
      item.status === "Ordered" ? "#878216" :
      item.status === "On the way" ? "#D17A00" :
      item.status === "Processing" ? "#3B82F6" : 
      item.status === "Delivered" ? "#308233" : 
      item.status === "Collected" ? "#7E8700" : 
      item.status === "Hold" ? "#D17A00" : 
      item.status === "Cancelled" ? "#5C5C5C" :
      item.status === "Return" ? "#FF1100" : 
      item.status === "Out For Delivery" ? "#80118A" : "#393939"
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