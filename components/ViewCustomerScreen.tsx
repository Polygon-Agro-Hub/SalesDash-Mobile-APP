import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, Linking, Keyboard, Platform, KeyboardAvoidingView } from "react-native";
import { RouteProp } from "@react-navigation/native"; // Import RouteProp for type safety
import { RootStackParamList } from "./types"; // Adjust if you have a type file for navigation
import Navbar from "./Navbar";
import { StackNavigationProp } from "@react-navigation/stack"; // Import StackNavigationProp
import { AntDesign } from "@expo/vector-icons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

// Define navigation prop type
type ViewCustomerScreenNavigationProp = StackNavigationProp<RootStackParamList, "ViewCustomerScreen">;

// Define route prop type
type ViewCustomerScreenRouteProp = RouteProp<RootStackParamList, "ViewCustomerScreen">;

type ViewCustomerScreenProps = {
  route: ViewCustomerScreenRouteProp;
  navigation: ViewCustomerScreenNavigationProp;
};

const ViewCustomerScreen: React.FC<ViewCustomerScreenProps> = ({ route, navigation }) => {
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("One Time");

  const { name, number,customerId } = route.params;

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleGetACall = () => {
    const phoneNumber = `tel:${number}`;
    Linking.openURL(phoneNumber).catch((err) => console.error("Error opening dialer", err));
  };

  const filters = ["One Time", "Once a Week", "Weekly"];

  // Static order data
  const orders = [
    { id: "1", orderNumber: "1234", schedule: "Monday", time: "9:00 AM - 12:00 PM", status: "Delivered", type: "One Time" },
    { id: "2", orderNumber: "5678", schedule: "Tuesday", time: "2:00 PM - 4:00 PM", status: "On the way", type: "Once a Week" },
    { id: "3", orderNumber: "9101", schedule: "Wednesday", time: "10:00 AM - 1:00 PM", status: "Delivered", type: "Weekly" },
    { id: "4", orderNumber: "1123", schedule: "Friday", time: "8:00 AM - 10:00 AM", status: "Pending", type: "One Time" },
  ];

  // Filter the orders based on the selected filter and search text
  const filteredOrders = orders.filter(
    (order) =>
      order.type === selectedFilter &&
      (!searchText || order.orderNumber.includes(searchText))
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <View className="relative">
          <View className="bg-white flex-row rounded-b-[35px] items-center justify-between h-28 z-50 shadow-lg px-5">
            {/* Back Button */}
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ paddingHorizontal: wp(6), paddingVertical: hp(2) }}>
              <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                <AntDesign name="left" size={20} color="black" />
              </View>
            </TouchableOpacity>

            {/* Customer Info */}
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-800 px-12">{name}</Text>
              <Text className="text-sm text-gray-500 px-3">Customer ID: {customerId}</Text>
            </View>

            {/* Edit Button */}
            <TouchableOpacity className="px-6">
              <MaterialIcons name="edit" size={20} color="purple" />
            </TouchableOpacity>
          </View>

          {/* Action Buttons (Purple Section) */}
          <View className="bg-purple-100 rounded-b-[25px] pt-6 pb-3 shadow-md mt-[-20] items-center z-5">
            <View className="flex-row justify-between mb-4 px-5 px-3 mx-5">
              {/* Get a Call Button */}
              <TouchableOpacity onPress={handleGetACall} className="flex-row bg-purple-500 px-4 py-2 rounded-full items-center mt-5 mx-4">
                <Image source={require("../assets/images/call.png")} className="w-5 h-5 mr-2" resizeMode="contain" />
                <Text className="text-white font-bold">Get a Call</Text>
              </TouchableOpacity>

              {/* New Order Button */}
              <TouchableOpacity className="flex-row bg-purple-500 px-4 py-2 rounded-full items-center mt-5 mx-4">
                <Image source={require("../assets/images/newOrder.png")} className="w-5 h-5 mr-2" resizeMode="contain" />
                <Text className="text-white font-bold">New Order</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-[#F5F1FC] px-8 py-2 rounded-full mt-4 mb-2 mx-5 w-[90%] shadow-sm">
          <TextInput
            placeholder="Search By Order Number"
            placeholderTextColor="#A3A3A3"
            className="flex-1 text-sm text-purple"
            onChangeText={(text) => setSearchText(text)}
            value={searchText}
          />
          <Image source={require("../assets/images/search.png")} className="w-8 h-8" resizeMode="contain" />
        </View>

        {/* Filters */}
        <View className="flex-row justify-around mt-4 mb-2 mx-3">
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              className={`px-4 py-2 rounded-full border ${selectedFilter === filter ? "bg-purple-600 border-purple-600" : "border-gray-300"}`}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text className={`font-bold ${selectedFilter === filter ? "text-white" : "text-gray-500"}`}>{filter}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders List */}
        {filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-200 mx-4 shadow-sm mt-4">
                <Text className="text-lg font-semibold text-gray-900">Order: {item.orderNumber}</Text>
                <Text className="text-sm text-gray-500 mt-1">Scheduled to: {item.schedule}</Text>
                <Text className="text-sm text-gray-500">Within {item.time}</Text>

                {/* Status Tag */}
                <View className={`mt-3 px-3 py-1 rounded-full self-start ${item.status === "Delivered" ? "bg-green-100" : item.status === "On the way" ? "bg-yellow-100" : "bg-blue-100"}`}>
                  <Text className={`text-xs font-semibold ${item.status === "Delivered" ? "text-green-600" : item.status === "On the way" ? "text-yellow-600" : "text-blue-600"}`}>
                    {item.status}
                  </Text>
                </View>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        ) : (
          <Text className="text-center text-gray-500">No orders found.</Text>
        )}
      </View>

      {/* Navbar */}
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </KeyboardAvoidingView>
  );
};

export default ViewCustomerScreen;
