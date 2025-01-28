import React, { useState,useEffect } from "react";
import { View, Text, Image, TouchableOpacity,Alert } from "react-native";

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
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import BackButton from "./BackButton";

type SidebarScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SidebarScreen"
>;

interface SidebarScreenProps {
  navigation: SidebarScreenNavigationProp;
}

const SidebarScreen: React.FC<SidebarScreenProps> = ({ navigation }) => {

  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
    const [formData, setFormData] = useState({ username: "" , empId:" " });
    useEffect(() => {
      getUserProfile();
    }, []); 
  
    const getUserProfile = async () => {
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          Alert.alert("Error", "No authentication token found");
          return;
        }
        setToken(storedToken);
  
        const response = await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
  
        setFormData(response.data.data);
      } catch (error) {
        Alert.alert("Error", "Failed to fetch user profile");
        console.error(error);
      }
    };  

  return (
    <View className="flex-1 w-full bg-white ">
    <ScrollView 

    style = {{ paddingHorizontal: wp(4)}}
    >
    
        
      {/* Back Button */}
      <BackButton navigation={navigation} />

      {/* Profile Section */}
      <View className="flex-row items-center  p-5">
        <Image
              source={require("../assets/images/profile.png")}
                 className="w-16 h-16 rounded-full"
         />
        <View className="ml-4">
        <Text className="text-lg font-bold text-gray-900">{formData.username} </Text>
         <Text className="text-sm text-gray-500 mt-1">{formData.empId}</Text>
         </View>
        </View>
        

        <View className="border-b border-gray-200 my-1 ml-4 mr-4" />


      {/* Navigation Items */}
      <View className="flex-1 p-5">
      
 
        {/* Profile */}
        <TouchableOpacity
        style={{ marginBottom: 16 }}
          className="flex-row items-center my-3 "
          onPress={() => navigation.navigate("ProfileScreen")}
        >
          <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
          <Ionicons name="person-outline" size={20} color="#8F8F8F" 
           onPress={() => navigation.navigate("ProfileScreen")}
          />
          </View>
          <Text className="flex-1 ml-4 text-gray-800 text-base">Profile</Text>
          <Ionicons
            name="chevron-forward-outline"
            size={18}
            color="#8F8F8F"
            className="ml-auto"
          />
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
          <Ionicons
            name={complaintsExpanded ? "chevron-down-outline" : "chevron-forward-outline"}
            size={18}
            color="#8F8F8F"
            className="ml-auto"
          />
        </TouchableOpacity>

        {/* Submenu for Complaints */}
        {complaintsExpanded && (
          <View className="pl-12 space-y-3 ">
            <TouchableOpacity
              onPress={() => navigation.navigate("AddComplaintScreen")}
            >
              <Text className="text-sm text-gray-700 font-bold">Report a Complaint</Text>
            </TouchableOpacity>
            <TouchableOpacity
            style={{ marginBottom: 10 }}
              onPress={() => navigation.navigate("ViewComplainScreen")}
            >
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
          <Ionicons
            name="chevron-forward-outline"
            size={18}
            color="#8F8F8F"
            className="ml-auto"
          />
        </TouchableOpacity>

        {/* Privacy & Policy */}
        <TouchableOpacity
        style={{ marginBottom: 10}}
          className="flex-row items-center py-3"
        //   onPress={() => navigation.navigate("PrivacyPolicy")}
        >
           <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
            <Ionicons name="document-text-outline" size={22} color="#8F8F8F" />
          </View>
          <Text className="flex-1 ml-4 text-gray-800 text-base">Privacy & Policy</Text>
          <Ionicons
            name="chevron-forward-outline"
            size={18}
            color="#8F8F8F"
            className="ml-auto"
          />
        </TouchableOpacity>

        {/* Terms & Conditions */}
        <TouchableOpacity
            className="flex-row items-center py-3"
            onPress={() => console.log("Terms & Conditions Pressed")}
        >
          <View className="w-8 h-8 bg-gray-100 rounded-full justify-center items-center">
            <Ionicons name="information-circle-outline" size={22} color="#8F8F8F" />
          </View>
  
         {/* Text */}
             <Text className="flex-1 ml-4 text-gray-800 text-base">
                  Terms & Conditions
            </Text>
  
            {/* Right Icon */}
            <Ionicons name="chevron-forward-outline" size={18} color="#8F8F8F" />
            </TouchableOpacity>


            <View className="border-b border-gray-200 my-5" />

        <TouchableOpacity
             className="flex-row items-center "
              onPress={() => console.log("Logout")}
        >
         <View className="w-8 h-8 bg-red-100 rounded-full justify-center items-center">
            <Ionicons name="log-out-outline" size={22} color="#FF3B30" />
          </View>
         <Text className="ml-4 text-base text-red-600 font-semibold">Logout</Text>
            </TouchableOpacity>
      </View>

      {/* Logout */}
    

      {/* Navbar */}
     
    

    </ScrollView>
    <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default SidebarScreen;  