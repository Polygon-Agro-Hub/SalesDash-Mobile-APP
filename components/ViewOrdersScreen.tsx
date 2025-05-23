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

type ViewOrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewOrdersScreen">;

interface ViewOrdersScreenProps {
  navigation: ViewOrdersScreenNavigationProp;
}

interface Order {
  orderId: number;
  customerId: number;
  deliveryType: string;
  scheduleDate: string;
  scheduleTimeSlot: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
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
  data: Order[];
}

const ViewOrdersScreen: React.FC<ViewOrdersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [orders, setOrders] = useState<Order[]>([]);
  const isMounted = useRef(true);


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

  const loadOrders = async (showFullLoading = true) => {
    if (showFullLoading) safeSetLoading(true);
    
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        if (isMounted.current) {
          navigation.navigate("LoginScreen" as any);
        }
        return;
      }
      
      const response = await axios.get<OrdersResponse>(
        `${environment.API_BASE_URL}api/orders/get-orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.data.success && response.data.data) {
        safeSetOrders(response.data.data);
        console.log("Orders loaded:", response.data.data.length);
      } else {
        safeSetOrders([]);
        console.log("No orders data or success is false");
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      safeSetOrders([]);
      
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        if (isMounted.current) {
          navigation.navigate("LoginScreen" as any);
        }
      }
    } finally {
      if (showFullLoading) safeSetLoading(false);
      safeSetRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    safeSetRefreshing(true);
    loadOrders(false);
  }, []);

  useEffect(() => {
    console.log("Component mounted");
    
    // Set up listeners
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Screen focused - loading orders");
      loadOrders();
    });

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    // Initial load
    loadOrders();

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
          const orderDate = new Date(order.scheduleDate);
          
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
                <Text className="text-white text-lg font-bold mt-[-4]">Total Orders: <Text className="font-bold">{(orders && Array.isArray(orders)) ? orders.length : 0}</Text></Text>
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
              <Image source={require("../assets/images/search.png")} className="w-6 h-6" resizeMode="contain" />
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
                item.orderStatus === "Ordered" ? "#EAEAEA" :
                item.orderStatus === "On the way" ? "#FFFD99" :
                item.orderStatus === "Processing" ? "#CFE1FF" : 
                 item.orderStatus === "Delivered" ? "#CCFBF1" : 
                item.orderStatus === "Cancelled" ? "#FCE7F3" : "#EAEAEA",
            }}>
              <Text style={{
                fontSize: wp(3),
                fontWeight: "600",
                color:
                  item.orderStatus === "Ordered" ? "#393939" :
                  item.orderStatus === "On the way" ? "#A6A100" :
                  item.orderStatus === "Processing" ? "#3B82F6" : 
                   item.orderStatus === "Delivered" ? "#0D9488" : 
                  item.orderStatus === "Cancelled" ? "#BE185D" : "#393939",
              }}>
                {item.orderStatus}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: wp(3.6), color: "#808FA2" }}>
            Schedule to: {formatDate(item.scheduleDate)}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
            {/* Customer name */}
            <Text style={{ fontSize: wp(3.6), color: "#808FA2", marginTop: hp(0.5) }}>
              Within : {item.scheduleTimeSlot}
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