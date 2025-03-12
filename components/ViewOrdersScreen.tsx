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
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import OrderScreenSkeleton from '../components/Skeleton/OrderScreenSkeleton'; // Import the skeleton

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
    setTimeout(() => setLoading(false), 2000);

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
        {loading ? (
  <>
    <OrderScreenSkeleton />
    {/* <Modal transparent animationType="fade">
      <View className="flex-1 justify-center items-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
        <LottieView
          source={require("../assets/images/loading.json")}
          autoPlay
          loop
          style={{ width: wp(25), height: hp(12) }}
        />
      </View>
    </Modal> */}
  </>
        ) : (
          <>
            {/* Header */}
            <LinearGradient colors={["#884EDC", "#6E3DD1"]} className="h-20 shadow-md px-4 pt-17 items-center justify-center">
              <Text className="text-white text-lg font-bold mt-[-4]">Total Orders: <Text className="font-bold">{orders.length}</Text></Text>
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

            {/* Filters */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginTop: hp(2), marginBottom: hp(1.5), marginHorizontal: wp(2) }}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  style={{
                    paddingHorizontal: wp(4),
                    paddingVertical: hp(1),
                    borderRadius: wp(5),
                    borderWidth: 1,
                    backgroundColor: selectedFilter === filter ? "#6B3BCF" : "transparent",
                    borderColor: "#6B3BCF",
                  }}
                  onPress={() => setSelectedFilter(filter)}
                >
                  <Text style={{ fontSize: wp(3.5), fontWeight: selectedFilter === filter ? "bold" : "normal", color: selectedFilter === filter ? "white" : "#6B3BCF" }}>
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Order List */}
            {filteredOrders.length > 0 ? (
              <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => navigation.navigate("View_CancelOrderScreen")} activeOpacity={0.7}>
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
                        <Text style={{ fontSize: wp(4.5), fontWeight: "600", color: "#393939" }}>Order: {item.orderNumber}</Text>
                        <View style={{
                          paddingHorizontal: wp(3),
                          paddingVertical: hp(0.5),
                          borderRadius: wp(5),
                          backgroundColor:
                            item.status === "Delivered" ? "#CCFBF1" :
                            item.status === "On the way" ? "#FFFD99" :
                            item.status === "Processing" ? "#CFE1FF" : "#EAEAEA",
                        }}>
                          <Text style={{
                            fontSize: wp(3),
                            fontWeight: "600",
                            color:
                              item.status === "Delivered" ? "#0D9488" :
                              item.status === "On the way" ? "#A6A100" :
                              item.status === "Processing" ? "#3B82F6" : "#393939",
                          }}>
                            {item.status}
                          </Text>
                        </View>
                      </View>

                      {/* Schedule */}
                      <Text style={{ fontSize: wp(3.5), color: "#808FA2", marginTop: hp(0.5) }}>Scheduled to: {item.schedule}</Text>
                      <Text style={{ fontSize: wp(3.5), color: "#808FA2" }}>Within {item.time}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: hp(5) }}
              />
            ) : (
              <Text className="text-center text-gray-500">No orders found.</Text>
            )}
          </>
        )}
      </View>

      {/* Navbar */}
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="ViewOrdersScreen" />}
    </KeyboardAvoidingView>
  );
};

export default ViewOrdersScreen;
