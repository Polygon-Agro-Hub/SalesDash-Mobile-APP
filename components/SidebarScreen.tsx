import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert, ScrollView,KeyboardAvoidingView, Platform } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import BackButton from "./BackButton";
import LottieView from "lottie-react-native";
import { useFocusEffect } from "expo-router";


type SidebarScreenNavigationProp = StackNavigationProp<RootStackParamList, "SidebarScreen">;

interface SidebarScreenProps {
  navigation: SidebarScreenNavigationProp;
}

const SidebarScreen: React.FC<SidebarScreenProps> = ({ navigation }) => {
  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName:"", empId: "", image:"" });

useFocusEffect(
  useCallback(() => {
setComplaintsExpanded(false)
getUserProfile();
  }, [])
);

// useEffect(() => {
//     getUserProfile();
//   }, []);

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


const handleLogout = async () => {
  setLoading(true); 
  try {
    await AsyncStorage.removeItem("authToken");
    setTimeout(() => {
      navigation.replace("LoginScreen"); 
    }, 5000);
  } catch (error) {
    console.error("Error removing authToken:", error);
    setLoading(false);
  }
};


  return (

    <KeyboardAvoidingView 
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    enabled 
                    className="flex-1"
                    >
    <View className="flex-1 w-full bg-white">

          {loading ? (
        <View className="flex-1 justify-center items-center">
        <LottieView
          source={require("../assets/images/loading.json")}
          autoPlay
          loop
          style={{ width: wp(25), height: hp(12) }}
        />
        <Text className="mt-4 text-lg text-[#693ACF] font-semibold">Logging out...</Text>
      </View>
    ) : (
      <View className=" flex-1 w-full bg-white">
    <ScrollView style={{ paddingHorizontal: wp(4) }}
    keyboardShouldPersistTaps="handled"
    >
         {/* <BackButton navigation={navigation} /> */}
           <TouchableOpacity 
                style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
                onPress={() => navigation.navigate("Main" as any)}>
                <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                  <AntDesign name="left" size={20} color="black" />
                </View>
              </TouchableOpacity> 

         <View className="flex-row items-center p-5">
           {/* <Image source={require("../assets/images/profile.png")} style={{ width: wp(16), height: wp(16), borderRadius: wp(8) }} />*/}
               {formData.image ? (
             <Image
               source={{ uri: formData.image }}  // ← Use the URI from formData
               className="w-16 h-16 rounded-full"
               resizeMode="cover"
             />
           ) : (
             <Image
               source={require("../assets/images/profile.webp")}  // Fallback image
               className="w-16 h-16 rounded-full"
               resizeMode="cover"
             />
           )} 
           <View style={{ marginLeft: wp(4) }}>
             <Text className="text-lg font-bold text-gray-900">{formData.firstName} {formData.lastName}</Text>
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
      width: hp(5), 
      height: hp(5), 
      borderRadius: hp(2.5),
      backgroundColor: "#F4F9FB", 
      justifyContent: "center",
      alignItems: "center",
    }}
  >
   <Image 
  source={require('../assets/images/Account.webp')} 
  style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
/>
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
      width: hp(5), 
      height: hp(5), 
      borderRadius: hp(2.5), 
      backgroundColor: "#F4F9FB", 
      justifyContent: "center",
      alignItems: "center",
    }}
  >
 <Image 
  source={require('../assets/images/Help.webp')} 
  style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
/>
  </View>
  
  <Text 
    style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} 
    className="text-gray-800"
  >
    Complaints
  </Text>
  
  <Ionicons 
    name={complaintsExpanded ? "chevron-down-outline" : "chevron-forward-outline"}  
    size={hp(2.5)} 
    color="#8F8F8F" 
    style={{ marginRight: wp(2) }} 
  />
</TouchableOpacity>


          {complaintsExpanded && (
            <View style={{ paddingLeft: wp(15) }}>
              <TouchableOpacity onPress={() => navigation.navigate("Main",{screen:"AddComplaintScreen"})}>
                <Text className="text-base text-gray-700 font-bold mb-2">Report a Complaint</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ marginTop: hp(1), marginBottom: hp(1) }} onPress={() => navigation.navigate("Main",{screen:"ViewComplainScreen"})}>
  <Text className="text-base text-gray-700 font-bold">View Complaint History</Text>
</TouchableOpacity>

            </View>
          )}

<TouchableOpacity style={{ marginBottom: hp(2),marginTop: hp(1) }} className="flex-row items-center py-3" onPress={() => navigation.navigate("ChangePasswordScreen")}> 
<View
    style={{
      width: hp(5), 
      height: hp(5),
      borderRadius: hp(2.5), 
      backgroundColor: "#F4F9FB", 
      justifyContent: "center",
      alignItems: "center",
    }}
  >
  <Image 
  source={require('../assets/images/Password.webp')} 
  style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
/>
    </View>

  <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
    Change Password
  </Text>
  <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
</TouchableOpacity>

<TouchableOpacity style={{ marginBottom: hp(2) }} className="flex-row items-center py-3"> 

<View
    style={{
      width: hp(5),
      height: hp(5), 
      borderRadius: hp(2.5), 
      backgroundColor: "#F4F9FB", 
      justifyContent: "center",
      alignItems: "center",
    }}
  >
  <Image 
  source={require('../assets/images/Privacy.webp')}
  style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
/>
  </View>
  <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
    Privacy & Policy
  </Text>
  <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
</TouchableOpacity>

<TouchableOpacity className="flex-row items-center py-3" onPress={() => console.log("Terms & Conditions Pressed")}> 
<View
    style={{
      width: hp(5),
      height: hp(5), 
      borderRadius: hp(2.5),
      backgroundColor: "#F4F9FB", 
      justifyContent: "center",
      alignItems: "center",
    }}
  >
  <Image 
  source={require('../assets/images/Terms and Conditions.webp')} 
  style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
/>
  </View>
  <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
    Terms & Conditions
  </Text>
  <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
</TouchableOpacity>

<View className="mb-8 ">
          <View className="border-b border-gray-200 my-5" />

          <TouchableOpacity className="flex-row items-center" onPress={handleLogout}> 

          <View
          className="mt-4"
    style={{
      width: hp(5), 
      height: hp(5),
      borderRadius: hp(2.5), 
      backgroundColor: "#FFF2EE",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
            <Ionicons name="log-out-outline" size={hp(3)} color="#FF3B30" />
            </View>
            <Text style={{ marginLeft: wp(4), fontSize: hp(2), color: "#FF3B30", fontWeight: "bold",  marginTop:(13)}}>Logout</Text>
          </TouchableOpacity>
        </View>
        </View>
        
       

      </ScrollView>
      </View>
    )}
   
    </View>
    </KeyboardAvoidingView>
  );
};

 export default SidebarScreen;




