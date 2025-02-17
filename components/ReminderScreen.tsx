import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, Modal, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import Navbar from "./Navbar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LottieView from "lottie-react-native";


type ReminderScreenNavigationProp = StackNavigationProp<RootStackParamList, "ReminderScreen">;

interface ReminderScreenProps {
  navigation: ReminderScreenNavigationProp;
}

const ReminderScreen: React.FC<ReminderScreenProps> = ({ navigation }) => {
  const [reminders, setReminders] = useState([
    { id: "1", OrderNo: "#2412080001", CustomerNo: "7823456", type: "Payment Reminder", icon: require("../assets/images/payment-method.png"), read: false },
    { id: "2", OrderNo: "#2412080002", CustomerNo: "7888456", type: "Order is Processing", icon: require("../assets/images/payment-method.png"), read: false },
    { id: "3", OrderNo: "#2412080003", CustomerNo: "7823488", type: "Order is Out for Delivery", icon: require("../assets/images/time-management.png"), read: true },
    { id: "4", OrderNo: "#2412080004", CustomerNo: "78884577", type: "Order is Out for Delivery", icon: require("../assets/images/fast-shipping.png"), read: true },
    { id: "5", OrderNo: "#2412080001", CustomerNo: "7823456", type: "Payment Reminder", icon: require("../assets/images/payment-method.png"), read: false },
    { id: "6", OrderNo: "#2412080002", CustomerNo: "7888456", type: "Order is Processing", icon: require("../assets/images/payment-method.png"), read: false },
    { id: "7", OrderNo: "#2412080003", CustomerNo: "7823488", type: "Order is Out for Delivery", icon: require("../assets/images/time-management.png"), read: true },
    { id: "8", OrderNo: "#2412080004", CustomerNo: "78884577", type: "Order is Out for Delivery", icon: require("../assets/images/fast-shipping.png"), read: true },
    { id: "9", OrderNo: "#2412080001", CustomerNo: "7823456", type: "Payment Reminder", icon: require("../assets/images/payment-method.png"), read: false },
    { id: "10", OrderNo: "#2412080002", CustomerNo: "7888456", type: "Order is Processing", icon: require("../assets/images/payment-method.png"), read: false },
    { id: "11", OrderNo: "#2412080003", CustomerNo: "7823488", type: "Order is Out for Delivery", icon: require("../assets/images/time-management.png"), read: true },
    { id: "12", OrderNo: "#2412080004", CustomerNo: "78884577", type: "Order is Out for Delivery", icon: require("../assets/images/fast-shipping.png"), read: true },

  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<{ id: string; OrderNo: string; CustomerNo: string; type: string; icon: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  // Function to show delete confirmation modal
  const showDeleteModal = (reminder: any) => {
    setSelectedReminder(reminder);
    setModalVisible(true);
  };

  // Function to delete notification
  const deleteNotification = () => {
    if (selectedReminder) {
      setReminders(reminders.filter((reminder) => reminder.id !== selectedReminder.id));
      setSelectedReminder(null); // Reset selection
      setModalVisible(false); // Close modal
    }
  };

  // Function to mark a notification as read
  const markAsRead = (id: string) => {
    setReminders((prevReminders) =>
      prevReminders.map((reminder) =>
        reminder.id === id ? { ...reminder, read: true } : reminder
      )
    );
  };

  useEffect(() => {
    setIsLoading(true); // Start loading
    setTimeout(() => {
      setIsLoading(false); // Stop loading after 3 seconds
    }, 3000);
  }, []);
  

  const isEmpty = reminders.length === 0;

  return (
    <View className="flex-1 bg-white">

{isLoading && (
 <Modal transparent animationType="fade" visible={isLoading}>
 <View className="flex-1 justify-center items-center bg-black/50">
   <LottieView source={require("../assets/images/loading.json")}
               autoPlay loop
               style={{ width: wp(35), height: wp(35) }} />
 </View>
</Modal>

)}
      

      {/* Header Section */}
      <LinearGradient colors={["#854BDA", "#6E3DD1"]} 
    style={{ height: hp(10), width: wp(100), justifyContent: "center", alignItems: "center" }}>
  <Text style={{ fontSize: wp(4.5) }} className="text-white font-bold">{reminders.length} Unread Notifications</Text>
</LinearGradient>


      <View style={{ flex: 1,  paddingVertical: hp(2) }}>

      
        {isEmpty ? (
          <View className="flex-1 justify-center items-center px-4">
            <Image source={require("../assets/images/notification.png")} style={{ width: wp("50%"), height: hp("20%"), resizeMode: "contain" }} />
            <Text className="text-black text-center mt-4 font-bold text-1xl">No Notification Yet</Text>
          </View>
        ) : (
          <View className=" pt-4">
            <FlatList
              data={reminders}
              keyExtractor={(item) => item.id}
             
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => {
                const itemStyle = item.read ? "bg-white" : "bg-[#F4EDFF]"; // White for read, purple for unread
                return (
                  <TouchableOpacity
                    onPress={() => markAsRead(item.id)} // Mark as read when clicked
                    activeOpacity={0.8}
                  >
                    <View className={`shadow-md p-4 mb-3 mx-3 flex-row justify-between items-center rounded-lg ${itemStyle}`}>
                      {/* Left Icon */}
                      <Image source={item.icon} style={{ width: 30, height: 30 }} />

                      {/* Notification Details */}
                      <View className="flex-1 ml-3">
                        <Text className="text-gray-800 font-bold">{item.type}</Text>
                        <Text className="text-gray-600">Order No: {item.OrderNo}</Text>
                        <Text className="text-gray-600">Customer ID: {item.CustomerNo}</Text>
                      </View>

                      {/* More Options Icon */}
                      <TouchableOpacity onPress={() => showDeleteModal(item)}>
                        <MaterialIcons name="more-vert" size={24} color="black" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Delete Confirmation Modal */}
        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-end bg-[#00000033]">
            <View className="bg-white w-full p-2 rounded-t-lg mr-4">
              <View className="flex-row justify-between mt-3 ">
                <TouchableOpacity className="flex-1 p-2 rounded-lg mr-4 " onPress={deleteNotification}>
                  <View className="flex-row">
                    <Image source={require("../assets/images/cancel.png")} style={{ width: 24, height: 24, marginRight: 6 }} />
                    <Text className="items-center ml-4 text-bold">Remove this notification</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>


      {/* Bottom Navbar */}
      </View>
      <Navbar navigation={navigation} activeTab="ReminderScreen" />
    </View>
  );
};

export default ReminderScreen;
