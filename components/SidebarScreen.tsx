import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import Navbar from "./Navbar";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import BackButton from "./BackButton";


type SidebarScreenNavigationProp = StackNavigationProp<RootStackParamList, "SidebarScreen">;

interface SidebarScreenProps {
  navigation: SidebarScreenNavigationProp;
}

const SidebarScreen: React.FC<SidebarScreenProps> = ({ navigation }) => {
  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({ username: "", empId: "" });

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
      <ScrollView style={{ paddingHorizontal: wp(4) }}>
        <BackButton navigation={navigation} />

        <View className="flex-row items-center p-5">
          <Image source={require("../assets/images/profile.png")} style={{ width: wp(16), height: wp(16), borderRadius: wp(8) }} />
          <View style={{ marginLeft: wp(4) }}>
            <Text className="text-lg font-bold text-gray-900">{formData.username}</Text>
            <Text className="text-sm text-gray-500 mt-1">{formData.empId}</Text>
          </View>
        </View>

        <View className="border-b border-gray-200 my-1 ml-4 mr-4" />

        <View className="flex-1 p-5">
        <TouchableOpacity
  style={{ marginBottom: hp(2) }}
  className="flex-row items-center"
  onPress={() => navigation.navigate("ProfileScreen")}
>
  {/* Round Icon */}
  <View
    style={{
      width: hp(5), // Icon size
      height: hp(5), // Icon size
      borderRadius: hp(2.5), // Half of the width/height for circular effect
      backgroundColor: "#F4F9FB", // Background color for the circle
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Ionicons name="person-outline" size={hp(3)} color="#8F8F8F" />
  </View>

  <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
    Profile
  </Text>

  <Ionicons
    name="chevron-forward-outline"
    size={hp(2.5)}
    color="#8F8F8F"
    style={{ marginRight: wp(2) }}
  />
</TouchableOpacity>



<TouchableOpacity 
  className="flex-row items-center py-3" 
  onPress={() => setComplaintsExpanded(!complaintsExpanded)}
>
<View
    style={{
      width: hp(5), // Icon size
      height: hp(5), // Icon size
      borderRadius: hp(2.5), // Half of the width/height for circular effect
      backgroundColor: "#F4F9FB", // Background color for the circle
      justifyContent: "center",
      alignItems: "center",
    }}
  >
  <Ionicons name="alert-circle-outline" size={hp(3)} color="#8F8F8F" />
  </View>
  
  <Text 
    style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} 
    className="text-gray-800"
  >
    Complaints
  </Text>
  
  <Ionicons 
    name="chevron-forward-outline"  
    size={hp(2.5)} 
    color="#8F8F8F" 
    style={{ marginRight: wp(2) }} 
  />
</TouchableOpacity>


          {complaintsExpanded && (
            <View style={{ paddingLeft: wp(10) }}>
              <TouchableOpacity onPress={() => navigation.navigate("AddComplaintScreen")}>
                <Text className="text-sm text-gray-700 font-bold">Report a Complaint</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: hp(1), marginBottom: hp(1) }} onPress={() => navigation.navigate("ViewComplainScreen")}>
  <Text className="text-sm text-gray-700 font-bold">View Complaint History</Text>
</TouchableOpacity>

            </View>
          )}

<TouchableOpacity style={{ marginBottom: hp(2),marginTop: hp(1) }} className="flex-row items-center py-3" onPress={() => navigation.navigate("ChangePasswordScreen")}> 
<View
    style={{
      width: hp(5), // Icon size
      height: hp(5), // Icon size
      borderRadius: hp(2.5), // Half of the width/height for circular effect
      backgroundColor: "#F4F9FB", // Background color for the circle
      justifyContent: "center",
      alignItems: "center",
    }}
  >
  <Ionicons name="lock-closed-outline" size={hp(3)} color="#8F8F8F" />
    </View>

  <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
    Change Password
  </Text>
  <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
</TouchableOpacity>

<TouchableOpacity style={{ marginBottom: hp(2) }} className="flex-row items-center py-3"> 

<View
    style={{
      width: hp(5), // Icon size
      height: hp(5), // Icon size
      borderRadius: hp(2.5), // Half of the width/height for circular effect
      backgroundColor: "#F4F9FB", // Background color for the circle
      justifyContent: "center",
      alignItems: "center",
    }}
  >
  <Ionicons name="document-text-outline" size={hp(3)} color="#8F8F8F" />
  </View>
  <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
    Privacy & Policy
  </Text>
  <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
</TouchableOpacity>

<TouchableOpacity className="flex-row items-center py-3" onPress={() => console.log("Terms & Conditions Pressed")}> 
<View
    style={{
      width: hp(5), // Icon size
      height: hp(5), // Icon size
      borderRadius: hp(2.5), // Half of the width/height for circular effect
      backgroundColor: "#F4F9FB", // Background color for the circle
      justifyContent: "center",
      alignItems: "center",
    }}
  >
  <Ionicons name="information-circle-outline" size={hp(3)} color="#8F8F8F" />
  </View>
  <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
    Terms & Conditions
  </Text>
  <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
</TouchableOpacity>


          <View className="border-b border-gray-200 my-5" />

          <TouchableOpacity className="flex-row items-center" onPress={() => console.log("Logout")}> 
          <View
    style={{
      width: hp(5), // Icon size
      height: hp(5), // Icon size
      borderRadius: hp(2.5), // Half of the width/height for circular effect
      backgroundColor: "#FFF2EE", // Background color for the circle
      justifyContent: "center",
      alignItems: "center",
    }}
  >
            <Ionicons name="log-out-outline" size={hp(3)} color="#FF3B30" />
            </View>
            <Text style={{ marginLeft: wp(4), fontSize: hp(2), color: "#FF3B30", fontWeight: "bold" }}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )}
      <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default SidebarScreen;


