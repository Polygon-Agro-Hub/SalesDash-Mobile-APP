import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Image, KeyboardAvoidingView,Platform,TextInput } from "react-native"; // Added Modal import
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import Navbar from "./Navbar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";

type ReminderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ReminderScreen"
>;

interface ReminderScreenProps {
  navigation: ReminderScreenNavigationProp;
}

const ViewComplainScreen: React.FC<ReminderScreenProps> = ({ navigation }) => {

  

  const reminders = [
    {
      id: "1",
      OrderNo: "#2412080001",
      CustomerNo: "7823456",
      type:"Payment Reminder"
    },
    {
      id: "2",
      OrderNo: "#2412080002",
      CustomerNo: "7888456",
      type:"Order is processing"
    },
    {
        id: "3",
        OrderNo: "#2412080003",
        CustomerNo: "7823488",
        type:"Order is out of delivery"
      },
      {
        id: "4",
        OrderNo: "#2412080004",
        CustomerNo: "78884577",
        type:"Order is out of delivery"
      },
  ];

  // Check for truly empty complaints (e.g., all fields empty)
  const isEmpty = reminders.every(
    (reminders) => !reminders.OrderNo && !reminders.CustomerNo 
  );

  

  return (
  
      <View className="flex-1 bg-white">
        {/* Header Section */}
        <LinearGradient
          colors={["#854BDA", "#6E3DD1"]}
          className="h-20 shadow-md px-4 pt-19 items-center justify-center"
        >
          <Text className="text-white text-lg font-bold">
          
              {reminders.length} Unread Notification
          </Text>
        </LinearGradient>

      


        {isEmpty ? (
          <View className="flex-1 justify-center items-center px-4">
            <Image
              source={require("../assets/images/notification.png")}
              style={{ width: wp("50%"), height: hp("20%"), resizeMode: "contain" }}
            />
            <Text className="text-black text-center mt-4">No Notification Yet</Text>
          </View>
        ) : (
          <View className="flex-1 px-4 pt-4">
            <FlatList
              data={reminders}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              renderItem={({ item }) => (
                
                  <View className="bg-white shadow-md p-4 mb-3 mx-3 flex-row justify-between items-center rounded-lg border border-gray-200">
                    <View>
                    <Text className="text-gray-700 font-bold">{item.type}</Text>
                      <Text className="text-gray-700 "> Order No:{item.OrderNo}</Text>
                      <Text className="text-gray-700 ">Customer ID{item.CustomerNo}</Text>
                    </View>
                   
                  </View>
              
              )}
            />
          </View>
        )}
         <Navbar navigation={navigation} activeTab="ReminderScreen" />
      </View>

   



  );
};

export default ViewComplainScreen;
