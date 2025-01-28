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
  SafeAreaView,
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
    username:"",
    email: "",
    buildingNo: "",
    streetName: "",
    city: "",
    empId:"",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getUserProfile();
  }, []);

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      console.log("token", storedToken);
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }
      setToken(storedToken);

      const response = await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      console.log("profile", response.data);

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

  const handleUpdate = async () => {
    try {
      if (!token) {
        Alert.alert("Error", "You are not authenticated");
        return;
      }

      await axios.put(`${environment.API_BASE_URL}api/auth/user-updateUser`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update profile");
      console.error(error);
    }
  };

  return (
    <View 
    
    className="flex-1 bg-white">
      
      <TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView>
            <View className="bg-[#6839CF]">
              <View className="relative">
                <ImageBackground
                  source={require("../assets/images/profilebackground.png")}
                  resizeMode="cover"
                  className="w-full h-44 absolute top-0 left-0 right-0"
                />


              </View>
              <BackButton navigation={navigation} />

              <View className="bg-white rounded-t-3xl mt-[45%]  pt-6"   style = {{ paddingHorizontal: wp(6)}}>
                <View className="items-center mt-[-25%]">
                  <TouchableOpacity className="relative">
                    {profileImage ? (
                      <Image
                        source={{ uri: profileImage }}
                        className="w-32 h-32 rounded-full border-4 border-white"
                      />
                    ) : (
                      <Image
                        source={require("../assets/images/profile.png")}
                        className="w-32 h-32 rounded-full border-4 border-white"
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
                      <AntDesign name="star" size={24} color="gold" />
                      <Text className="text-white text-sm mt-1">Points</Text>
                      <Text className="text-white text-lg font-bold">1000</Text>
                    </View>

                    <View className="w-[1px] bg-white h-full mx-2" />

                    <View className="flex-1 items-center">
                      <AntDesign name="filetext1" size={24} color="white" />
                      <Text className="text-white text-sm mt-1">Orders</Text>
                      <Text className="text-white text-lg font-bold">20</Text>
                    </View>

                    <View className="w-[1px] bg-white h-full mx-2" />

                    <View className="flex-1 items-center">
                      <AntDesign name="team" size={24} color="white" />
                      <Text className="text-white text-sm mt-1">Customers</Text>
                      <Text className="text-white text-lg font-bold">100</Text>
                    </View>
                  </View>
                </View>
                <View className="bg-white px-7">
  {/* Display empId field at the top */}
  <View className="mb-4">
    <Text className="text-black-500 mb-1 capitalize mt-4">
      Employee ID
    </Text>
    <Text className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2 text-gray-500">
      {formData.empId}
    </Text>
  </View>

  {/* Map through the remaining fields, excluding username */}
  {Object.entries(formData).map(([key, value]) => {
    // Skip empId and username fields as they are already rendered
    if (key === "empId" || key === "username") return null;
    return (
      <View className="mb-4" key={key}>
        <Text className="text-black-500 mb-1 capitalize mt-4">
          {key.replace(/([A-Z])/g, " $1")}
        </Text>
        <TextInput
          className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2"
          value={value}
          onChangeText={(text) => handleInputChange(key, text)}
          editable={key !== "empId"} // Keep empId uneditable
          placeholder={`Enter ${key.replace(/([A-Z])/g, " $1")}`}
        />
      </View>
    );
  })}
</View>

              </View>


                <View className="bg-white px-7 ">
                  <TouchableOpacity
                    className="bg-[#6839CF] py-3 rounded-lg items-center mt-6 mb-[15%] mr-[16%] ml-[16%] rounded-3xl"
                    onPress={handleUpdate}
                  >
                    <Text className="text-white text-lg font-bold">Update</Text>
                  </TouchableOpacity>
                </View>
              </View>

       
          </ScrollView>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>

      <View className="bg-white">
        
      </View>
     
      <Navbar navigation={navigation} activeTab="DashboardScreen" />
    </View>
  );
};

export default ProfileScreen;
