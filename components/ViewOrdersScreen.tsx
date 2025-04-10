import React, { useEffect, useState, useCallback } from "react";
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
  Alert
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import OrderScreenSkeleton from '../components/Skeleton/OrderScreenSkeleton';
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ViewOrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewOrdersScreen">;

interface ViewOrdersScreenProps {
  navigation: ViewOrdersScreenNavigationProp;
}

// Define the order interface based on the response
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

  // Function to load orders
  const loadOrders = async (showFullLoading = true) => {
    if (showFullLoading) setLoading(true);
    
    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        navigation.navigate("LoginScreen" as any);
        return;
      }
      
      const response = await axios.get<OrdersResponse>(
        `${environment.API_BASE_URL}api/orders/get-orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await AsyncStorage.removeItem("authToken");
        navigation.navigate("LoginScreen" as any);
      }
    } finally {
      if (showFullLoading) setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders(false); // Load orders without showing the full loading skeleton
  }, []);

  useEffect(() => {
    // Load orders when the screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadOrders();
    });

    // Set up keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    // Cleanup function
    return () => {
      unsubscribe();
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [navigation]);

  const filters = ["All", "Today", "Tomorrow", "In 3 Days", "This Week"];

  // Updated filtering logic based on the new data structure
  const filteredOrders = orders.filter(
    (order) => {
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
      
      return matchesFilter() && (!searchText || order.InvNo.toLowerCase().includes(searchText.toLowerCase()));
    }
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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
                <Text className="text-white text-lg font-bold mt-[-4]">Total Orders: <Text className="font-bold">{orders.length}</Text></Text>
                {/* Refresh Button */}
                {/* <TouchableOpacity 
                  onPress={() => loadOrders(false)}
                  className="ml-4 bg-white bg-opacity-20 p-1 rounded-full"
                >
                  <Text className="text-white font-bold text-xl">↻</Text>
                </TouchableOpacity> */}
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
              {/* Order List with Pull-to-Refresh */}
              {filteredOrders.length > 0 ? (
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
                              item.orderStatus === "Ordered" ? "#CCFBF1" :
                              item.orderStatus === "On the way" ? "#FFFD99" :
                              item.orderStatus === "Processing" ? "#CFE1FF" : 
                              item.orderStatus === "Cancelled" ? "#FCE7F3" : "#EAEAEA",
                          }}>
                            <Text style={{
                              fontSize: wp(3),
                              fontWeight: "600",
                              color:
                                item.orderStatus === "Ordered" ? "#0D9488" :
                                item.orderStatus === "On the way" ? "#A6A100" :
                                item.orderStatus === "Processing" ? "#3B82F6" : 
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
              ) : (
                <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                  <Text style={{ fontSize: wp(4), color: "#6B7280", textAlign: "center" }}>No orders found.</Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default ViewOrdersScreen;

// import React, { useEffect, useState } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   Image,
//   TouchableOpacity,
//   FlatList,
//   Keyboard,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from "react-native";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "./types";
// import Navbar from "./Navbar";
// import { LinearGradient } from "expo-linear-gradient";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
// import OrderScreenSkeleton from '../components/Skeleton/OrderScreenSkeleton';
// import axios from "axios";
// import environment from "@/environment/environment";

// type ViewOrdersScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewOrdersScreen">;

// interface ViewOrdersScreenProps {
//   navigation: ViewOrdersScreenNavigationProp;
// }

// // Define the order interface based on the response
// interface Order {
//   orderId: number;
//   customerId: number;
//   deliveryType: string;
//   scheduleDate: string;
//   scheduleTimeSlot: string;
//   weeklyDate: string;
//   paymentMethod: string;
//   paymentStatus: number;
//   orderStatus: string;
//   createdAt: string;
//   InvNo: string;
//   reportStatus:string;
//   fullTotal: string | null;
//   fullDiscount: string | null;
//   firstName: string;
//   lastName: string;
//   phoneNumber: string;
//   buildingType: string;
//   fullAddress: string;
// }


// interface OrdersResponse {
//   success: boolean;
//   count: number;
//   data: Order[];
// }

// const ViewOrdersScreen: React.FC<ViewOrdersScreenProps> = ({ navigation }) => {
//   const [isKeyboardVisible, setKeyboardVisible] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [searchText, setSearchText] = useState("");
//   const [selectedFilter, setSelectedFilter] = useState("All");
//   const [orders, setOrders] = useState<Order[]>([]);

//   useEffect(() => {
//     const loadOrders = async () => {
//       try {
//         const response = await axios.get<OrdersResponse>(`${environment.API_BASE_URL}api/orders/get-orders`); // Replace with your backend URL
//         if (response.data.success) {
//           setOrders(response.data.data); // Set the fetched orders to state
//         }
//       } catch (error) {
//         console.error("Failed to fetch orders:", error);
//       } finally {
//         setLoading(false); 
//       }
//     };
  
//     loadOrders();
  
//     const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
//       setKeyboardVisible(true)
//     );
//     const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
//       setKeyboardVisible(false)
//     );
  
//     return () => {
//       keyboardDidShowListener.remove();
//       keyboardDidHideListener.remove();
//     };
//   }, []);

//   const filters = ["All", "Today", "Tomorrow", "In 3 Days", "This Week"];

//   // Updated filtering logic based on the new data structure
//   const filteredOrders = orders.filter(
//     (order) => {
//       const matchesFilter = () => {
//         if (selectedFilter === "All") return true;
        
//         const today = new Date();
//         const orderDate = new Date(order.scheduleDate);
        
//         if (selectedFilter === "Today") {
//           return orderDate.toDateString() === today.toDateString();
//         }
        
//         if (selectedFilter === "Tomorrow") {
//           const tomorrow = new Date();
//           tomorrow.setDate(today.getDate() + 1);
//           return orderDate.toDateString() === tomorrow.toDateString();
//         }
        
//         if (selectedFilter === "In 3 Days") {
//           const in3Days = new Date();
//           in3Days.setDate(today.getDate() + 3);
//           return orderDate.toDateString() === in3Days.toDateString();
//         }
        
//         if (selectedFilter === "This Week") {
//           const startOfWeek = new Date(today);
//           startOfWeek.setDate(today.getDate() - today.getDay());
//           const endOfWeek = new Date(startOfWeek);
//           endOfWeek.setDate(startOfWeek.getDate() + 6);
          
//           return orderDate >= startOfWeek && orderDate <= endOfWeek;
//         }
        
//         return false;
//       };
      
//       return matchesFilter() && (!searchText || order.InvNo.toLowerCase().includes(searchText.toLowerCase()));
//     }
//   );

//   const formatDate = (dateString: string) => {
//     const date = new Date(dateString);
//     return date.toLocaleDateString();
//   };

//   return (
//     <KeyboardAvoidingView 
//                                behavior={Platform.OS === "ios" ? "padding" : "height"}
//                                enabled 
//                                className="flex-1"
//                                >
//       <View className="flex-1 bg-white">
//         {/* Loading Animation */}
//         {loading ? (
//           <OrderScreenSkeleton />
//         ) : (
//           <>
//             {/* Header */}
//             <LinearGradient colors={["#884EDC", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
//               <Text className="text-white text-lg font-bold mt-[-4]">Total Orders: <Text className="font-bold">{orders.length}</Text></Text>
//             </LinearGradient>

//             {/* Search Bar */}
//             <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mx-auto w-[90%] shadow-md mt-[-22]">
//               <TextInput
//                 placeholder="Search By Order Number"
//                 placeholderTextColor="#6839CF"
//                 className="flex-1 text-sm text-purple"
//                 onChangeText={(text) => setSearchText(text)}
//                 value={searchText}
//                 style={{ fontStyle: 'italic' }}
//               />
//               <Image source={require("../assets/images/search.png")} className="w-6 h-6" resizeMode="contain" />
//             </View>

//             {/* Filters */}
//             {/* <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: hp(2), marginBottom: hp(1.5), marginHorizontal: wp(2) }}>
//               {filters.map((filter) => (
//                 <TouchableOpacity
//                   key={filter}
//                   style={{
//                     paddingHorizontal: wp(4),
//                     paddingVertical: hp(1),
//                     borderRadius: wp(5),
//                     borderWidth: 1,
//                     backgroundColor: selectedFilter === filter ? "#6B3BCF" : "transparent",
//                     borderColor: "#6B3BCF",
//                   }}
//                   onPress={() => setSelectedFilter(filter)}
//                 >
//                   <Text style={{ fontSize: wp(3.5), fontWeight: selectedFilter === filter ? "bold" : "normal", color: selectedFilter === filter ? "white" : "#6B3BCF" }}>
//                     {filter}
//                   </Text>
//                 </TouchableOpacity>
//               ))}
//             </View> */}
//          {/* Horizontal Scrollable Filters */}
//          <View>
// <ScrollView 
//   horizontal 
//   showsHorizontalScrollIndicator={false}
//   contentContainerStyle={{ 
//     paddingHorizontal: 16,
//     height: 40, 
//     marginBottom:5
//   }}
//   className="my-2"
// >
//   {filters.map((filter) => (
//     <TouchableOpacity
//       key={filter}
//       style={{
//         paddingHorizontal: 12, 
//         paddingVertical: 6,    
//         borderRadius: 20,
//         borderWidth: 1,
//         borderColor: "#6B3BCF",
//         backgroundColor: selectedFilter === filter ? "#6B3BCF" : "transparent",
//         marginHorizontal: 4,   
//         justifyContent: 'center',
//         alignItems: 'center',
//         height: 32,          
//         minWidth: 80,        
//       }}
//       onPress={() => setSelectedFilter(filter)}
//     >
//       <Text style={{
//         fontSize: 14,
//         fontWeight: selectedFilter === filter ? "bold" : "normal",
//         color: selectedFilter === filter ? "white" : "#6B3BCF",
//       }}>
//         {filter}
//       </Text>
//     </TouchableOpacity>
//   ))}
// </ScrollView>
// </View>

// <View className="py-[-12%] mb-[60%]">

//             {/* Order List */}
//             {filteredOrders.length > 0 ? (
//               <FlatList
//                 data={filteredOrders}
//                 className="p-4 mb-10 "
//                 keyExtractor={(item) => item.orderId.toString()}
//                 renderItem={({ item }) => (
//                   <TouchableOpacity 
//                     onPress={() => navigation.navigate("View_CancelOrderScreen" as any, { orderId: item.orderId })} 
//                     activeOpacity={0.7}
//                   >

                    
//                     <View style={{
//                       backgroundColor: "white",
//                       borderRadius: wp(4),
//                       padding: wp(4),
//                       marginBottom: hp(2),
//                       borderWidth: 1,
//                       borderColor: "#EAEAEA",
//                       marginHorizontal: wp(4),
//                       shadowColor: "#0000001A",
//                       shadowOpacity: 0.2,
//                       shadowOffset: { width: 0, height: 2 },
//                       shadowRadius: 5,
//                       elevation: 5,
//                     }}>
//                       {/* Order number and status */}
//                       <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
//                         <Text style={{ fontSize: wp(4.5), fontWeight: "600", color: "#393939" }}>Order: {item.InvNo}</Text>
//                         <View style={{
//                           paddingHorizontal: wp(3),
//                           paddingVertical: hp(0.5),
//                           borderRadius: wp(5),
//                           backgroundColor:
//                             item.orderStatus === "Ordered" ? "#CCFBF1" :
//                             item.orderStatus === "On the way" ? "#FFFD99" :
//                             item.orderStatus === "Processing" ? "#CFE1FF" : 
//                             item.orderStatus === "Cancelled" ? "#FCE7F3" : "#EAEAEA",
//                         }}>
//                           <Text style={{
//                             fontSize: wp(3),
//                             fontWeight: "600",
//                             color:
//                               item.orderStatus === "Ordered" ? "#0D9488" :
//                               item.orderStatus === "On the way" ? "#A6A100" :
//                               item.orderStatus === "Processing" ? "#3B82F6" : 
//                               item.orderStatus === "Cancelled" ? "#BE185D" : "#393939",
//                           }}>
//                             {item.orderStatus}
//                           </Text>
//                         </View>
//                       </View>
                      



//                       <Text style={{ fontSize: wp(3.6), color: "#808FA2" }}>
//                         Schedule to: {formatDate(item.scheduleDate)}
//                       </Text>
                      
                      
//                       <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      
//                       {/* Customer name */}
//                       <Text style={{ fontSize: wp(3.6), color: "#808FA2", marginTop: hp(0.5) }}>
//                         Within : { item.scheduleTimeSlot}
//                       </Text>
//                       <Text style={{ fontSize: wp(3.6), color: "#FF4C4C" }}> {item.reportStatus}</Text>
//                       </View>
                      
//                       {/* Price information if available */}
//                     </View>
//                   </TouchableOpacity>

                  
//                 )}
                
//                 contentContainerStyle={{ paddingBottom: hp(5) }}
//               />
              
//             ) : (
//               <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
//                 <Text style={{ fontSize: wp(4), color: "#6B7280", textAlign: "center" }}>No orders found.</Text>
//               </View>
//             )}

// </View>
//           </>
          
//         )}
        
//       </View>

 
//     </KeyboardAvoidingView>
//   );
// };

// export default ViewOrdersScreen;