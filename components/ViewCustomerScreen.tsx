import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  Image, 
  Linking, 
  Keyboard, 
  Platform, 
  KeyboardAvoidingView, 
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  BackHandler,
  Alert
} from "react-native";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import AntIcons from "react-native-vector-icons/Feather";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import { AntDesign, Entypo, Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ViewCustomerScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewCustomerScreen">;
type ViewCustomerScreenRouteProp = RouteProp<RootStackParamList, "ViewCustomerScreen">;

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
  reportStatus:string |null;
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

const ViewCustomerScreen: React.FC<ViewCustomerScreenProps> = ({ route, navigation }) => {
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
  const [totalCount, setTotalCount] = useState(0);
    const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState<string>("");
  const [loadingCustomerData, setLoadingCustomerData] = useState(false);
  const isMounted = useRef(true);

  console.log("222222222222222",latitude,longitude,selectedLocationName)

  const ORDERS_PER_PAGE = 5;

 // console.log("111111111111111111111",orders)

  const { name, number, id, customerId, title } = route.params;
  console.log("parid",id)

//   useFocusEffect(
//   React.useCallback(() => {
//     console.log("Screen focused - resetting states");
//     const resetStates = () => {
//       setSearchText("");
//       setSelectedFilter("Ordered");
//       setOrders([]);
//       setCurrentPage(1);
//       setHasMore(true);
//       setTotalCount(0);
//       setLoading(true);
//       setLoadingMore(false);
//       setError(null);
//       setSearchError(null);
//     };

//     resetStates();
//     loadOrders(1, true, false);

//     return () => {
//       console.log("Screen unfocused - cleanup");
//       // Any cleanup if needed when screen loses focus
//     };
//   }, [id]) // Re-run when customer id changes
// );

useFocusEffect(
  React.useCallback(() => {
    console.log("Screen focused - resetting states");
    const resetStates = () => {
      setSearchText("");
      setSelectedFilter("Ordered");
      setOrders([]);
      setCurrentPage(1);
      setHasMore(true);
      setTotalCount(0);
      setLoading(true);
      setLoadingMore(false);
      setError(null);
      setSearchError(null);
    };

    resetStates();
    loadOrders(1, true, false);
    getUserProfile(); // Add this line to fetch customer data

    return () => {
      console.log("Screen unfocused - cleanup");
    };
  }, [id, customerId]) // Add customerId to dependencies
);


const getUserProfile = async () => {
  try {
    setLoadingCustomerData(true);
    const storedToken = await AsyncStorage.getItem("authToken");  
    if (!storedToken) {
      Alert.alert("Error", "No authentication token found");
      return null;  
    }

    console.log("11111111111",)
    
    const response = await axios.get(
      `${environment.API_BASE_URL}api/customer/customerData/${customerId}`, 
      {
        headers: { Authorization: `Bearer ${storedToken}` },
      }
    );
    
    console.log("Customer data response:", response.data);
    
    // Store the latitude and longitude from response
    // if (response.data) {
    //   setLatitude(response.data.latitude);
    //   setLongitude(response.data.longitude);
      
    //   // Create location name from customer details
    //   const locationName = `${title || ''} ${response.data.firstName || ''} ${response.data.lastName || ''}`.trim();
    //   setSelectedLocationName(locationName || "Customer Location");
    // }
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

  const locationName = `${title || ''} ${response.data.firstName || ''} ${response.data.lastName || ''}`.trim();
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
          // Navigate to ViewCustomerScreen instead of going back to main dashboard
          navigation.navigate("CustomersScreen" as any);
          return true; // Prevent default back behavior
        };
  
        const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
  
        return () => backHandler.remove(); // Cleanup on unmount
      }, [navigation])
    );
  

  const loadOrders = async (page = 1, showFullLoading = true, isLoadMore = false) => {
    try {
      console.log(`Loading orders for customer ${id}, page ${page}, isLoadMore: ${isLoadMore}`);
      
      if (showFullLoading) {
        setLoading(true);
      } else if (isLoadMore) {
        setLoadingMore(true);
      }
      
      setError(null);
      
      const response = await axios.get<OrdersResponse>(
        `${environment.API_BASE_URL}api/orders/get-order-bycustomerId/${id}?page=${page}&limit=${ORDERS_PER_PAGE}`
      );

      console.log("Orders response:", {
        customerId: id,
        page,
        ordersCount: response.data.data?.length || 0,
        totalCount: response.data.totalCount,
        hasMore: response.data.hasMore
      });

      if (response.data.success) {
        const newOrders = response.data.data;
        
        if (isLoadMore) {
          // Append new orders to existing ones
          setOrders(prevOrders => {
            const combined = [...prevOrders, ...newOrders];
            console.log(`Combined orders count: ${combined.length}`);
            return combined;
          });
        } else {
          // Replace orders for initial load or refresh
          setOrders(newOrders);
          console.log(`Set new orders count: ${newOrders.length}`);
        }
        
        // Update pagination state
        setTotalCount(response.data.totalCount || 0);
        setHasMore(response.data.hasMore || false);
        setCurrentPage(page);
        
        console.log(`Pagination state updated - hasMore: ${response.data.hasMore}, totalCount: ${response.data.totalCount}`);
        
      } else {
        setError(response.data.message || "Failed to load orders");
      }
    } catch (err: any) {
      console.log("Error fetching orders:", err);
      
      // Handle 404 as "no orders found" instead of an error
      if (err.response && err.response.status === 404) {
        console.log("No orders found for this customer (404) - this is normal");
        setOrders([]); // Set empty orders array
        setError(null); // Don't set error for 404
        setHasMore(false);
        setTotalCount(0);
      } else {
        // For other errors, show error message
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
      console.log(`Loading more orders - next page: ${nextPage}`);
      loadOrders(nextPage, false, true);
    } else {
      console.log(`Cannot load more - loadingMore: ${loadingMore}, hasMore: ${hasMore}, loading: ${loading}`);
    }
  };

  const handleRefresh = () => {
    console.log("Refreshing orders for customer:", id);
    setCurrentPage(1);
    setHasMore(true);
    setOrders([]); // Clear existing orders
    loadOrders(1, true, false);
  };

  // Check for search results when search text or filter changes
  useEffect(() => {
    if (searchText.trim() === "") {
      setSearchError(null);
    } else {
      // Check if the search returns any results
      const results = orders.filter(order => 
        order.InvNo && order.InvNo.toLowerCase().includes(searchText.toLowerCase()) &&
        (selectedFilter === "All" || order.status === selectedFilter)
      );
      
      if (results.length === 0) {
        setSearchError(`No order found with number "${searchText}"`);
      } else {
        setSearchError(null);
      }
    }
  }, [searchText, selectedFilter, orders]);


  console.log("nameeeeeeeee", name)

  const handleGetACall = () => {
    const phoneNumber = `tel:${number}`;
    Linking.openURL(phoneNumber).catch((err) => console.error("Error opening dialer", err));
  };

  const filters = ["Ordered", "Processing","Out For Delivery",  "Collected" , "Hold", "On the way", "Delivered","Cancelled","Return"];

  const formatsheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  const handleSearch = () => {
    // This function can be kept for manual search trigger if needed
    // But the search logic now happens automatically in useEffect
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedFilter === "All" || order.status === selectedFilter;
    const matchesSearch = !searchText || 
      (order.InvNo && order.InvNo.toLowerCase().includes(searchText.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

  const isEmpty = filteredOrders.length === 0;

  // Reset pagination state when customer ID changes
  const resetPaginationState = () => {
    setOrders([]);
    setCurrentPage(1);
    setHasMore(true);
    setTotalCount(0);
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setSearchError(null);
  };

  useEffect(() => {
    console.log("Component mounted or customer changed");
    
    // Reset pagination state when customer changes
    resetPaginationState();
    
    // Set up listeners
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Screen focused - loading orders");
      if (isMounted.current) {
        resetPaginationState();
        loadOrders(1, true, false);
      }
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
  }, [navigation, id]); // Added 'id' dependency to reset when customer changes

  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View className="py-4 justify-center items-center">
        <ActivityIndicator size="small" color="#6B3BCF" />
        <Text className="text-[#6B3BCF] mt-2 text-sm">Loading more orders...</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      style={{flex: 1}}
    >
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <View className="relative">
          <View className="bg-white flex-row rounded-b-[35px] items-center justify-between h-28 z-50 shadow-lg px-5">
            <View className="mt-[-8%] ml-[-2%]">
              <TouchableOpacity 
                style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
                onPress={() => navigation.navigate("CustomersScreen")}>
                <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                  <AntDesign name="left" size={20} color="black" />
                </View>
              </TouchableOpacity> 
            </View> 

            <View className="flex-1 justify-center items-center mt-[3%]">
              <Text className="text-lg font-bold text-gray-800" style={{ textAlign: 'center' }}>
                {title}.{name}
              </Text>
              <Text className="text-gray-500 text-base" style={{ textAlign: 'center' }}>
                Customer ID: {customerId}
              </Text>

<TouchableOpacity
//  onPress={() => navigation.navigate("Main", {
//   screen: "ExcludeItemEditSummery",
//   params: {
//     id,
//     customerId: customerId,
//     name: name,
//     title: title
//   }
// })}
 onPress={() => navigation.navigate("ExcludeItemEditSummery", { 
                id:id,                   
                customerId: customerId,
                name: name,
                title: title 
              })}
>
  <View className="flex-row justify-center items-center gap-2 mt-[%]">
    <Text className=" text-base font-semibold text-[#7240D3] underline">Exclude Item List</Text>
    <AntIcons name="external-link" size={20} color="#6C3CD1" />
  </View>
</TouchableOpacity>

<TouchableOpacity
  onPress={() => {
    // Only navigate if we have valid latitude and longitude
    if (latitude !== null && longitude !== null) {
      navigation.navigate("ViewLocationScreen", {
        latitude: latitude,
        longitude: longitude,
        locationName: selectedLocationName,
      });
    } else {
      // Show an alert or handle the case when location data is not available
      Alert.alert("Location Unavailable", "Customer location data is not available.");
    }
  }}
 // disabled={!latitude || !longitude || loadingCustomerData}
>
  <View className="flex-row justify-center items-center gap-1 mb-[1%]">
    <Entypo name="location-pin" size={20} color="#FF0000" />
    <Text className="text-base font-semibold text-[#FF0000] underline">
      {loadingCustomerData ? "Loading Location..." : "View Geo Location"}
    </Text>
  </View>
</TouchableOpacity>
          

            </View>

        

            <TouchableOpacity 
              className="px-6 mt-[-9%] mr-[-10%]"
              onPress={() => navigation.navigate("EditCustomerScreen", { 
                id,                   
                customerId: customerId,
                name: name,
                title: title 
              })}
            >
              <MaterialIcons name="edit" size={28} color="#6839CF" />
            </TouchableOpacity>
            
          </View>


          {/* Action Buttons */}
          <View className="bg-[#F1E8FF] rounded-b-[25px] pt-6 pb-3 shadow-md mt-[-20] items-center z-5">
            <View className="flex-row justify-between mb-4 px-5 mx-5">
              <TouchableOpacity 
                onPress={handleGetACall} 
                className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5 mx-4"
              >
                <Image source={require("../assets/images/call.webp")} className="w-5 h-5 mr-2" />
                <Text className="text-white font-bold">Get a Call</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.navigate("SelectOrderType" as any, { 
                  id,    
                  customerId: customerId,
                  name: name,
                  title: title  
                })}
                className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5 mx-4"
              >
                <Image source={require("../assets/images/newOrder.webp")} className="w-5 h-5 mr-2" />
                <Text className="text-white font-bold">New Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search and Filters */}
        <View className="mx-5">
          <View className="flex-row items-center bg-[#F5F1FC] px-8 py-2 border border-[#6B3BCF] rounded-full mt-4 shadow-sm">
            {/* <TextInput
              placeholder="Search By Order Number"
              placeholderTextColor="#000000"
              className="flex-1 text-sm text-black"
              onChangeText={setSearchText}
              value={searchText}
              style={{ fontStyle: 'italic' }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              
            /> */}
             <TextInput
    placeholder="Search By Order Number"
    placeholderTextColor="#6839CF"
    className="flex-1 text-sm text-purple"
    onChangeText={(text) => {
      // Only allow numbers - remove all letters, special characters, and spaces
      const numericOnly = text.replace(/[^0-9]/g, '');
      setSearchText(numericOnly);
    }}
    value={searchText}
    style={{ fontStyle: 'italic' }}
    keyboardType="numeric" // This shows numeric keyboard on mobile
  />
            <TouchableOpacity onPress={handleSearch}>
              <Image source={require("../assets/images/search.webp")} className="w-8 h-8" />
            </TouchableOpacity>
          </View>
          
          {/* Search Error Message - Show when typing and no results found */}
          {searchError && (
            <View>
             
              <View className="justify-center items-center mt-4">
                <LottieView
                                          source={require("../assets/images/NoComplaints.json")}
                                          style={{ width: wp(50), height: hp(50) }}
                                          autoPlay
                                          loop
                                        />
                                     
                                      </View>
                                      <View className="mt-[-80]">
                                        <Text className="text-red-600 text-center text-base">No data Found</Text>
                                      </View>
            </View>
          )}
        </View>

        {/* <View className="mt-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="flex-row flex-wrap mt-[2%] mb-[1%] mx-[2%]"
            contentContainerStyle={{ paddingHorizontal: wp('1%') }}
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
                <Text className={`text-center text-sm ${
                  selectedFilter === filter 
                    ? "text-white font-bold" 
                    : "text-[#6B3BCF]"
                }`}>
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View> */}
        { !searchError && (
  <View className="mt-4">
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      className="flex-row flex-wrap mt-[2%] mb-[1%] mx-[2%]"
      contentContainerStyle={{ paddingHorizontal: wp('1%') }}
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
          <Text className={`text-center text-sm ${
            selectedFilter === filter 
              ? "text-white font-bold" 
              : "text-[#6B3BCF]"
          }`}>
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
            // Search error is already displayed above, don't show anything here
            null
          ) : filteredOrders.length > 0 ? (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.orderId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  onPress={() => navigation.navigate("View_CancelOrderScreen" as any, { 
                    orderId: item.orderId,
                    status:item.status,
                   reportStatus:item.reportStatus
                  })}
                >
                  <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 mx-4 shadow-sm mt-4">
                    <View className="flex-row justify-between items-center">
                      <Text className="text-lg font-semibold text-gray-900">
                        Order: #{item.InvNo || "N/A"}
                      </Text>
                      <View className={`px-3 py-1 rounded-full ${
                        item.status === "Ordered" ? "bg-[#F5FF85]"                   
                        : item.status === "Processing" ? "bg-[#CFE1FF]"
                        : item.status === "Out For Delivery" ? "bg-[#FCD4FF]"
                         : item.status === "Collected" ? "bg-[#F8FEA5]"
                         : item.status === "On the way" ? "bg-[#FFEDCF]"
                          : item.status === "Hold" ? "bg-[#FFEDCF]"
                        : item.status === "Delivered" ? "bg-[#BBFFC6]"
                        : item.status === "Cancelled" ? "bg-[#DFDFDF]"
                        : item.status === "Return" ? "bg-[#FFDCDA]"
                        : "bg-[#EAEAEA]"
                      }`}>
                        <Text className={`text-xs font-semibold ${
                          item.status === "Ordered" ? "text-[#878216]"                     
                          : item.status === "Processing" ? "text-[#3B82F6]"
                          : item.status === "Out For Delivery" ? "text-[#80118A]"
                           : item.status === "Collected" ? "text-[#7E8700]"
                            : item.status === "On the way" ? "text-[#D17A00]"
                           : item.status === "Hold" ? "text-[#D17A00]"
                          : item.status === "Delivered" ? "text-[#308233]"
                          : item.status === "Cancelled" ? "text-[#5C5C5C]"
                          : item.status === "Return" ? "text-[#FF1100]"
                          : "text-[#393939]"
                        }`}>
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
                  colors={['#6B3BCF']}
                />
              }
              contentContainerStyle={{ paddingBottom: 100 }}
            />
          ) : (
            // Show Lottie animation when no filtered results (whether it's no orders at all, or filter has no results)
            <View className="flex-1 justify-center items-center px-4">
              <LottieView
                source={require("../assets/images/NoComplaints.json")}
                style={{ width: wp(50), height: hp(50) }}
                autoPlay
                loop
              />
              <Text className="text-gray-500 mt-4 text-center">
                {orders.length === 0 
                  ? "No orders found" 
                  : searchText 
                    ? "No matching orders found" 
                    : `No orders found with status "${selectedFilter}"`
                }
              </Text>
            </View>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;