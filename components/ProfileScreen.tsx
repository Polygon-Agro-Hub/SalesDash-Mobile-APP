import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import BackButton from "./BackButton";
import { LinearGradient } from "expo-linear-gradient";
import { AxiosError } from 'axios';

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ProfileScreen"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    firstName: "",
    lastName: "",
    phoneNumber1: "",
    phoneNumber2: "",
    nicNumber: "",
    username: "",
    email: "",
    buildingNo: "",
    streetName: "",
    city: "",
    empId: "",
  });

  

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

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

      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/profile`,
        { headers: { Authorization: `Bearer ${storedToken}` } }
      );

      setFormData(response.data.data);
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
      console.error(error);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  // const handleUpdate = async () => {
  //   try {
  //     if (!token) {
  //       Alert.alert("Error", "You are not authenticated");
  //       return;
  //     }

  //     await axios.put(
  //       `${environment.API_BASE_URL}api/auth/user-updateUser`,
  //       formData,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     Alert.alert("Success", "Profile updated successfully!");
  //   } catch (error) {
  //     Alert.alert("Error", "Failed to update profile");
  //     console.error(error);
  //   }
  // };

  const handleUpdate = async () => {
    try {
      if (!token) {
        Alert.alert("Error", "You are not authenticated");
        return;
      }
  
      // Remove fields that are not allowed by the backend schema
      const { empId, nicNumber, username, ...updatedData } = formData;
  
      console.log('Form data being sent:', updatedData);  // Log to verify
  
      const response = await axios.put(
        `${environment.API_BASE_URL}api/auth/user-updateUser`,
        updatedData,  // Send only the allowed fields
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
  
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Backend error details:', error.response?.data);
        Alert.alert("Error", `Failed to update profile: ${error.response?.data.message || 'Validation error'}`);
      } else {
        console.error('Error:', error instanceof Error ? error.message : 'Unknown error');
        Alert.alert("Error", "Failed to update profile");
      }
    }
  };
  
  

  return (
    <View className="flex-1 bg-white">
     
       <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        enabled 
        className="flex-1"
        >
          <ScrollView keyboardShouldPersistTaps="handled">
            <View className="bg-[#6839CF]">
              <View className="relative">
                <ImageBackground
                  source={require("../assets/images/profilebackground.png")}
                  resizeMode="cover"
                  style={{
                    width: "100%",
                    height: hp(25),
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                />
              </View>
              <View className="ml-3"> 
              <BackButton navigation={navigation} />
              </View>

              <View
                className="bg-white rounded-t-3xl pt-6"
                style={{ marginTop: hp(15), paddingHorizontal: wp(6) }}
              >
                <View className="items-center" style={{ marginTop: -hp(12) }}>
                  <TouchableOpacity className="relative">
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        style={{
                          width: wp(35),
                          height: wp(35),
                       
                        
                        }}
                      />
                    ) : (
                      <Image
                        source={require("../assets/images/profile.png")}
                        style={{
                          width: wp(34),
                          height: wp(34),
                          borderRadius: wp(1),
                       
                        }}
                      />
                    )}
                  </TouchableOpacity>
                  <Text className="text-black text-2xl font-bold mb-2">
                    {formData.username}
                  </Text>
                </View>
              </View>

              <View className="bg-white px-7">
                <View className="p-4">
                <View className="bg-[#6839CF] flex-row justify-between mt-3 px-4 py-3 rounded-2xl ">
                    <View className="flex-1 items-center">
                    <Image 
  source={require("../assets/images/star.png")} // Ensure the correct path
  style={{ width: 24, height: 24 }} 
/>
                      <Text className="text-white text-sm mt-1">Points</Text>
                      <Text className="text-white text-lg font-bold">1000</Text>
                    </View>

                    <View className="w-[1px] bg-white h-full mx-2" />

                    <View className="flex-1 items-center">
                    <Image 
  source={require("../assets/images/Order Completed.png")} // Ensure the correct path
  style={{ width: 24, height: 24 }} 
/>
                      <Text className="text-white text-sm mt-1">Orders</Text>
                      <Text className="text-white text-lg font-bold">20</Text>
                    </View>

                    <View className="w-[1px] bg-white h-full mx-2" />

                    <View className="flex-1 items-center">
                    <Image 
  source={require("../assets/images/Batch Assign.png")} // Ensure the correct path
  style={{ width: 24, height: 24 }} 
/>
                      <Text className="text-white text-sm mt-1">Customers</Text>
                      <Text className="text-white text-lg font-bold">100</Text>
                    </View>
                  </View>
                </View>

                <View className="bg-white px-7">
                  {/* Employee ID Field */}
                  <View className="mb-4">
                    <Text className="text-black-500 mb-1 capitalize mt-4">
                      Employee ID
                    </Text>
                    <Text
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2 text-gray-500"
                      style={{ fontSize: wp(4) }}
                    >
                      {formData.empId}
                    </Text>
                  </View>

                  {/* Other Fields */}
                  {Object.entries(formData).map(([key, value]) => {
                    if (key === "empId" || key === "username") return null;
                    return (
                      <View className="mb-4" key={key}>
                        <Text
                          className="text-black-500 mb-1 capitalize mt-4"
                          style={{ fontSize: wp(4) }}
                        >
                          {key.replace(/([A-Z])/g, " $1")}
                        </Text>
                        <TextInput
                          className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2"
                          value={value}
                          onChangeText={(text) => handleInputChange(key, text)}
                          editable={key !== "empId"}
                          placeholder={`Enter ${key.replace(/([A-Z])/g, " $1")}`}
                          style={{ fontSize: wp(4) }}
                        />
                      </View>
                    );
                  })}
                </View>
              </View>

              <View className="bg-white px-7">
      <TouchableOpacity onPress={handleUpdate} style={{ width: wp(60), alignSelf: "center" }}>
        <LinearGradient
          colors={["#6839CF", "#874DDB"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="py-3 rounded-full items-center mt-6 mb-10 px-4"
        >
          <Text className="text-white text-lg font-bold">Update</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
              
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
    

      <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default ProfileScreen;
