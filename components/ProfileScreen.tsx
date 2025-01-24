import React, { useState } from "react";
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
  TouchableWithoutFeedback
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import Navbar from "./Navbar";
import { AntDesign } from "@expo/vector-icons";

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ProfileScreen"
>;

interface ProfileScreenProps {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    employeeId: "SA01245",
    firstName: "",
    lastName: "",
    phoneNumber1: "",
    phoneNumber2: "",
    nicNumber: "",
    email: "",
    buildingNo: "",
    streetName: "",
    city: "",
  });

  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prevState) => ({
      ...prevState,
      [key]: value,
    }));
  };

  const handleUpdate = () => {
    console.log("Updated Profile Data: ", formData);
    console.log("Updated Profile Image URI: ", profileImage);
    Alert.alert("Success", "Profile updated successfully!");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Dismiss Keyboard When Touched Outside */}
      <TouchableWithoutFeedback>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          {/* Scrollable Content */}
          <ScrollView >

            <View className=" bg-[#6839CF]">
              {/* Header Section with Background */}
              <View className="relative">
                <ImageBackground
                  source={require("../assets/images/profilebackground.png")}
                  resizeMode="cover"
                  className="w-full h-44 absolute top-0 left-0 right-0"
                />

                {/* Back Button */}
                <TouchableOpacity
                  className="absolute top-6 left-4 flex-row items-center z-10"
                  onPress={() => navigation.goBack()}
                >
                  <View className="w-8 h-8 bg-purple-200 rounded-full justify-center items-center shadow-md">
                    <AntDesign name="left" size={24} color="black" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Profile Section */}
              <View className="bg-white rounded-t-3xl mt-[45%] px-6 pt-6">
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
                    Kusal Parera
                  </Text>
                </View>
              </View>

           
             
              {/* Scrollable Form Section */}
              <View className="bg-white px-7 ">

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
                {Object.entries(formData).map(([key, value]) => (
                  <View className="mb-4" key={key}>
                    <Text className="text-black-500 mb-1 capitalize mt-4">
                      {key.replace(/([A-Z])/g, " $1")}
                    </Text>
                    <TextInput
                      className="bg-[#F6F6F6] border border-[#F6F6F6] rounded-3xl px-3 py-2"
                      value={value}
                      onChangeText={(text) => handleInputChange(key, text)}
                      editable={key !== "employeeId"}
                      placeholder={`Enter ${key.replace(/([A-Z])/g, " $1")}`}
                    />
                  </View>
                ))}
              </View>

              {/* Update Button */}
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

      {/* Navbar */}
      <View className="bg-white">
        <Navbar navigation={navigation} activeTab="DashboardScreen" />
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;
