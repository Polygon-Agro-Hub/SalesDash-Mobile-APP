import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import AntDesign from "@expo/vector-icons/AntDesign";
import Navbar from "./Navbar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { ScrollView } from "react-native-gesture-handler";

type SidebarScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SidebarScreen"
>;

interface SidebarScreenProps {
  navigation: SidebarScreenNavigationProp;
}

const SidebarScreen: React.FC<SidebarScreenProps> = ({ navigation }) => {
  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  // Function to handle logout
  const handleLogout = async () => {
    setLoading(true); // Show loading indicator
    try {
      await AsyncStorage.removeItem("authToken");
      setTimeout(() => {
        navigation.replace("LoginScreen"); // Redirect after 5 seconds
      }, 5000);
    } catch (error) {
      console.error("Error removing authToken:", error);
      setLoading(false);
    }
  };

  return (
   
    <View className="flex-1 w-full bg-white">
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#693ACF" />
          <Text className="mt-4 text-lg text-[#693ACF] font-semibold">Logging out...</Text>
        </View>
      ) : (
        <ScrollView style={{ paddingHorizontal: wp(6), paddingVertical: hp(2) }}>
          {/* Back Button */}
          <TouchableOpacity
            className="mt-4 ml-2 flex-row items-center"
            onPress={() => navigation.goBack()}
          >
            <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
              <AntDesign name="left" size={20} color="black" />
            </View>
          </TouchableOpacity>

        {/* Profile Section */}
        <View className="flex-row items-center p-5">
          <Image
            source={require("../assets/images/profile.png")}
            className="w-16 h-16 rounded-full"
          />
          <View className="ml-4">
            <Text className="text-lg font-bold text-gray-900">Kusal Perera</Text>
            <Text className="text-sm text-gray-500 mt-1">SA1245</Text>
          </View>
        </View>

        <View className="border-b border-gray-200 my-1 ml-4 mr-4" />

        {/* Navigation Items */}
        <View className="flex-1 p-5">
          {/* Profile */}
          <TouchableOpacity
            style={{ marginBottom: 16 }}
            className="flex-row items-center my-3"
            onPress={() => navigation.navigate("ProfileScreen")}
          >
            <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
              <Ionicons name="person-outline" size={20} color="#8F8F8F" />
            </View>
            <Text className="flex-1 ml-4 text-gray-800 text-base">Profile</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#8F8F8F" />
          </TouchableOpacity>

          {/* Complaints */}
          <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={() => setComplaintsExpanded(!complaintsExpanded)}
          >
            <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
              <Ionicons name="alert-circle-outline" size={20} color="#8F8F8F" />
            </View>
            <Text className="flex-1 ml-4 text-gray-800 text-base">Complaints</Text>
            <Ionicons name={complaintsExpanded ? "chevron-down-outline" : "chevron-forward-outline"} size={18} color="#8F8F8F" />
          </TouchableOpacity>

          {/* Submenu for Complaints */}
          {complaintsExpanded && (
            <View className="pl-12 space-y-3">
              <TouchableOpacity onPress={() => navigation.navigate("AddComplaintScreen")}>
                <Text className="text-sm text-gray-700 font-bold">Report a Complaint</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate("ViewComplainScreen")}>
                <Text className="text-sm text-gray-700 font-bold">View Complaint History</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Change Password */}
          <TouchableOpacity
            style={{ marginBottom: 10 }}
            className="flex-row items-center py-3"
            onPress={() => navigation.navigate("ChangePasswordScreen")}
          >
            <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
              <Ionicons name="lock-closed-outline" size={22} color="#8F8F8F" />
            </View>
            <Text className="flex-1 ml-4 text-gray-800 text-base">Change Password</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#8F8F8F" />
          </TouchableOpacity>

          {/* Privacy & Policy */}
          <TouchableOpacity style={{ marginBottom: 10 }} className="flex-row items-center py-3">
            <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
              <Ionicons name="document-text-outline" size={22} color="#8F8F8F" />
            </View>
            <Text className="flex-1 ml-4 text-gray-800 text-base">Privacy & Policy</Text>
            <Ionicons name="chevron-forward-outline" size={18} color="#8F8F8F" />
          </TouchableOpacity>
        </View>

        <View className="border-b border-gray-200 my-5" />

        {/* Logout Section with loading indicator */}
        <TouchableOpacity className="flex-row items-center" onPress={handleLogout}>
            <View className="w-8 h-8 bg-red-100 rounded-full justify-center items-center">
              <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
            </View>
            <Text className="ml-4 text-base text-red-600 font-semibold">Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      )}


      {/* Navbar */}
      <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default SidebarScreen;
