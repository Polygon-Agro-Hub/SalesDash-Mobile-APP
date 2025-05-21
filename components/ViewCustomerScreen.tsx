import React, { useState, useEffect } from "react";
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
  ActivityIndicator
} from "react-native";
import { RouteProp } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import { AntDesign } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

type ViewCustomerScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewCustomerScreen">;
type ViewCustomerScreenRouteProp = RouteProp<RootStackParamList, "ViewCustomerScreen">;

interface Order {
  orderId: string;
  customerId: string;
  deliveryType: string;
  scheduleDate: string;
  scheduleTimeSlot: string;
  weeklyDate: string;
  paymentMethod: string;
  paymentStatus: number;
  orderStatus: string;
  createdAt: string;
  InvNo: string;
  fullTotal: string | null;
  fullDiscount: string | null;
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  message?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { name, number, id, customerId,title } = route.params;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get<OrdersResponse>(
          `${environment.API_BASE_URL}api/orders/get-order-bycustomerId/${id}`
        );

       // console.log(response.data)
        if (response.data.success) {
          setOrders(response.data.data);
        } else {
          setError(response.data.message || "Failed to load orders");
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [id]);

  const handleGetACall = () => {
    const phoneNumber = `tel:${number}`;
    Linking.openURL(phoneNumber).catch((err) => console.error("Error opening dialer", err));
  };

  const filters = ["Ordered", "Processing", "On the way", "Delivered", "Cancelled"];


  const formatScheduleDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

 

  // Filter orders based on status and search text
  // const filteredOrders = orders.filter(order => {
  //   const matchesStatus = selectedFilter === "All" || order.orderStatus === selectedFilter;
  //   const matchesSearch = !searchText || 
  //     (order.InvNo && order.InvNo.toLowerCase().includes(searchText.toLowerCase()));
    
  //   return matchesStatus && matchesSearch;
  // });

  const handleSearch = () => {
    if (searchText.trim() === "") {
      return;
    }
    
    // Check if the search returns any results
    const results = orders.filter(order => 
      order.InvNo && order.InvNo.toLowerCase().includes(searchText.toLowerCase()) &&
      (selectedFilter === "All" || order.orderStatus === selectedFilter)
    );
    
    if (results.length === 0) {
      setSearchError(`No order found with number "${searchText}"`);
    } else {
      setSearchError(null);
    }
  };
  const filteredOrders = orders.filter(order => {
    const matchesStatus = selectedFilter === "All" || order.orderStatus === selectedFilter;
    const matchesSearch = !searchText || 
      (order.InvNo && order.InvNo.toLowerCase().includes(searchText.toLowerCase()));
    
    return matchesStatus && matchesSearch;
  });

    const isEmpty = filteredOrders.length === 0;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      className="flex-1"
    >
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <View className="relative">
          <View className="bg-white flex-row rounded-b-[35px] items-center justify-between h-28 z-50 shadow-lg px-5">
            <View className="mt-[-8%] ml-[-2%]">
              {/* <BackButton navigation={navigation} /> */}
              <TouchableOpacity 
        style = {{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
       onPress={() => navigation.navigate("CustomersScreen")}>
         <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
           <AntDesign name="left" size={20} color="black" />
         </View>
       </TouchableOpacity> 
            </View> 

            <View className="flex-1 justify-center items-center mt-[-3%]">
              <Text className="text-xl font-bold text-gray-800" style={{ textAlign: 'center' }}>
                {title}.{name}
              </Text>
              <Text className="text-gray-500" style={{ textAlign: 'center' }}>
                Customer ID: {customerId}
              </Text>
            </View>

            <TouchableOpacity 
              className="px-6 mt-[-20%] mr-[-10%]"
              onPress={() => navigation.navigate("EditCustomerScreen", { id,                   
                customerId:customerId,
                name: name,
                title:title })}
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
                <Image source={require("../assets/images/call.png")} className="w-5 h-5 mr-2" />
                <Text className="text-white font-bold">Get a Call</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => navigation.navigate("SelectOrderType" as any, { id,    customerId:customerId,
                  name: name,
                  title:title  })}
                
                className="flex-row bg-[#6B3BCF] px-4 py-2 rounded-full items-center mt-5 mx-4"
              >
                <Image source={require("../assets/images/newOrder.png")} className="w-5 h-5 mr-2" />
                <Text className="text-white font-bold">New Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search and Filters */}
        <View className="mx-5">
          <View className="flex-row items-center bg-[#F5F1FC] px-8 py-2 border border-[#6B3BCF] rounded-full mt-4 shadow-sm">
            <TextInput
              placeholder="Search By Order Number"
              placeholderTextColor="#000000"
              className="flex-1 text-sm text-black"
              onChangeText={setSearchText}
              value={searchText}
              style={{ fontStyle: 'italic' }}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch}>
              <Image source={require("../assets/images/search.png")} className="w-8 h-8" />
            </TouchableOpacity>
          </View>
          
          {/* Search Error Message */}
          {searchError && (
            <View className="bg-red-50 px-4 py-2 mt-2 rounded-lg border border-red-200">
              <Text className="text-red-600 text-center">{searchError}</Text>
            </View>
          )}
        </View>
<View className="mt-4">
        <ScrollView 
  horizontal 
  showsHorizontalScrollIndicator={false}
  className="flex-row flex-wrap  mt-[2%] mb-[1%] mx-[2%]"
  contentContainerStyle={{ paddingHorizontal: wp('1%') }}
>
  {filters.map((filter) => (
    <TouchableOpacity
      key={filter}
      className={`px-4 py-2 rounded-full border mr-2 ${selectedFilter === filter ? " px-4 py-2 rounded-full border mr-2 bg-[#6B3BCF] border-[#6B3BCF]" : "border-[#6B3BCF]"}`}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text className={`text-center text-sm ${selectedFilter === filter ? "text-white font-bold" : "text-[#6B3BCF]"}`}>
        {filter}
      </Text>
    </TouchableOpacity>
  ))}
</ScrollView>
</View>


<View className="mt-3 mb-[100%]">
        {/* Orders List */}
        {loading ? (
          <View className="flex-1 justify-center items-center">
            {/* <ActivityIndicator size="large" color="#6B3BCF" /> */}
            {/* <Text className="text-[#6B3BCF] mt-2">Loading orders...</Text> */}
          </View>
        ) : error ? (
          <View className="flex-1 justify-center items-center px-4">
            <Text className="text-red-500 text-center">{error}</Text>
            <TouchableOpacity 
              className="mt-4 bg-white px-4 py-2 rounded-full"
              onPress={() => {
                setLoading(true);
                setError(null);
              }}
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : 
        
        isEmpty ? (
          <View className="flex-1 justify-center items-center px-4 mt-[40%]">
            <LottieView
                      source={require("../assets/images/NoComplaints.json")}
                      style={{ width: wp(50), height: hp(50) }}
                      autoPlay
                      loop
                    />
          </View>
        )  : (filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.orderId.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                onPress={() => navigation.navigate("View_CancelOrderScreen" as any, { 
                  orderId: item.orderId
                })}
              >
                <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 mx-4 shadow-sm mt-4">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-lg font-semibold text-gray-900">
                      Order: #{item.InvNo || "N/A"}
                    </Text>
                    <View className={`px-3 py-1 rounded-full ${
                      item.orderStatus === "Ordered" ? "bg-[#E0E0E0]" 
                      : item.orderStatus === "On the way" ? "bg-[#FFFD99]" 
                      : item.orderStatus === "Processing" ? "bg-[#CFE1FF]"
                        : item.orderStatus === "Delivered" ? "bg-[#CCFBF1]"
                      : item.orderStatus === "Cancelled" ? "bg-[#FFE4E1]"
                      : "bg-[#EAEAEA]"
                    }`}>
                      <Text className={`text-xs font-semibold ${
                        item.orderStatus === "Ordered" ? "text-[#3F3F3F]"
                        : item.orderStatus === "On the way" ? "text-[#A6A100]"
                        : item.orderStatus === "Processing" ? "text-[#3B82F6]"
                        : item.orderStatus === "Delivered" ? "bg-[#0D9488]"
                        : item.orderStatus === "Cancelled" ? "text-[#FF0000]"
                        : "text-[#393939]"
                      }`}>
                        {item.orderStatus}
                      </Text>
                    </View>
                  </View>
                  
                  <Text className="text-sm text-[#808FA2] mt-1">
                    Scheduled to : {formatScheduleDate(item.scheduleDate)}
                  </Text>
                  <Text className="text-sm text-[#808FA2]">
                     {item.scheduleTimeSlot}
                  </Text>
                 
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 70 }}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-center text-gray-500">
              {searchText ? "No matching orders found" : "No orders found for this status"}
            </Text>
          </View>
        ))}
      </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;