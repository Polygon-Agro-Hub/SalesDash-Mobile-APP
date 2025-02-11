import React, { useEffect, useState } from "react";
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
  Modal,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

// Define navigation prop type
type ViewOrdersScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ViewOrdersScreen"
>;

interface ViewOrdersScreenProps {
  navigation: ViewOrdersScreenNavigationProp;
}

const ViewOrdersScreen: React.FC<ViewOrdersScreenProps> = ({ navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    // Simulate a 3-second loading screen on mount
    setTimeout(() => setLoading(false), 3000);

    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const orders = [
    { id: "1", orderNumber: "1234", schedule: "Monday", time: "9:00 AM - 12:00 PM", status: "Delivered", type: "Today" },
    { id: "2", orderNumber: "5678", schedule: "Tuesday", time: "2:00 PM - 4:00 PM", status: "On the way", type: "Tomorrow" },
    { id: "3", orderNumber: "9101", schedule: "Wednesday", time: "10:00 AM - 1:00 PM", status: "Processing", type: "This Week" },
    { id: "4", orderNumber: "1123", schedule: "Friday", time: "8:00 AM - 10:00 AM", status: "Ordered", type: "Tomorrow" },
    { id: "5", orderNumber: "9101", schedule: "Wednesday", time: "10:00 AM - 1:00 PM", status: "Delivered", type: "This Week" },
    { id: "6", orderNumber: "1123", schedule: "Friday", time: "8:00 AM - 10:00 AM", status: "Ordered", type: "Tomorrow" },
  ];

  const filters = ["All", "Today", "Tomorrow", "This Week"];

  const filteredOrders = orders.filter(
    (order) =>
      (selectedFilter === "All" || order.type === selectedFilter) &&
      (!searchText || order.orderNumber.includes(searchText))
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        {/* Loading Animation */}
        {loading && (
          <Modal transparent animationType="fade">
           <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <LottieView source={require("../assets/images/loading.json")} autoPlay loop style={{ width: 100, height: 100 }} />
            </View>
          </Modal>
        )}

        {/* Header */}
        <LinearGradient colors={["#854BDA", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
          <Text className="text-white text-lg font-bold">Total Orders: <Text className="font-bold">{orders.length}</Text></Text>
        </LinearGradient>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-6 py-3 rounded-full mx-auto w-[90%] shadow-md mt-[-22]">
          <TextInput placeholder="Search By Name, Phone Number" placeholderTextColor="#6839CF" className="flex-1 text-sm text-gray-700" />
          <Image source={require("../assets/images/search.png")} className="w-6 h-6" resizeMode="contain" />
        </View>

        {/* Filters */}
        <View className="flex-row justify-around mt-4 mb-3 mx-2">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              className={`px-4 py-2 rounded-full border ${selectedFilter === filter ? "bg-purple-600 border-[#6B3BCF]" : "border-[#6B3BCF]"}`}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text className={`font ${selectedFilter === filter ? "text-white font-bold" : "text-[#6B3BCF]"}`}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Order List */}
        {filteredOrders.length > 0 ? (
           <FlatList
           data={filteredOrders}
           keyExtractor={(item) => item.id}
           renderItem={({ item }) => (
             <TouchableOpacity 
               onPress={() => navigation.navigate("View_CancelOrderScreen")} 
               activeOpacity={0.7} 
             >
               <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 mx-4 shadow-sm mt-3">
                 {/* Order number and status tag in the same row */}
                 <View className="flex-row justify-between items-center">
                   <Text className="text-lg font-semibold text-gray-900">
                     Order: {item.orderNumber}
                   </Text>
                   <View className={`px-3 py-1 rounded-full ${ 
                     item.status === "Delivered" ? "bg-[#CCFBF1]" 
                     : item.status === "On the way" ? "bg-[#FFFD99]" 
                     : item.status === "Processing" ? "bg-[#CFE1FF]"
                     : "bg-[#EAEAEA]"
                   }`}>
                     <Text className={`text-xs font-semibold ${
                       item.status === "Delivered" ? "text-[#0D9488]"
                       : item.status === "On the way" ? "text-[#A6A100]"
                       : item.status === "Processing" ? "text-[#3B82F6]"
                       : "text-[#393939]"
                     }`}>
                       {item.status}
                     </Text>
                   </View>
                 </View>
         
                 {/* Schedule Details */}
                 <Text className="text-sm text-[#808FA2] mt-1">
                   Scheduled to: {item.schedule}
                 </Text>
                 <Text className="text-sm text-[#808FA2]">
                   Within {item.time}
                 </Text>
               </View>
             </TouchableOpacity>
           )}
           contentContainerStyle={{ paddingBottom: 14 }}
         />
         
        ) : (
          <Text className="text-center text-gray-500">No orders found.</Text>
        )}
      </View>

      {/* Navbar */}
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="ViewOrdersScreen" />}
    </KeyboardAvoidingView>
  );
};

export default ViewOrdersScreen;