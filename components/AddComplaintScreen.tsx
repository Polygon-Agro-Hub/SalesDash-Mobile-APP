import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "./types";
import { Picker } from "@react-native-picker/picker";
import { AntDesign } from "@expo/vector-icons";
import Navbar from "./Navbar";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";

type AddComplaintScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddComplaintScreen"
>;

interface AddComplaintScreenProps {
  navigation: AddComplaintScreenNavigationProp;
}

const AddComplaintScreen: React.FC<AddComplaintScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [complaintText, setComplaintText] = useState<string>("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [token, setToken] = useState<string | null>(null);

    const handleSubmit = async () => {
      if (!selectedCategory || !complaintText.trim()) {
        alert("Please fill out all fields before submitting.");
        return;
      }
    
      try {
        const storedToken = await AsyncStorage.getItem("authToken");
        if (!storedToken) {
          Alert.alert("Error", "No authentication token found");
          return;
        }
    
        console.log(storedToken, selectedCategory, complaintText);     
    
        const apiUrl = `${environment.API_BASE_URL.replace(/\/$/, '')}/api/complain/add-complain`;
    
        const response = await axios.post(
          apiUrl,
          {
            language: "English",
            category: selectedCategory,
            complain: complaintText,
          },
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
    
        alert("Complaint submitted successfully!");
        setSelectedCategory(""); // Clear form after submission
        setComplaintText("");
        navigation.goBack(); // Navigate back after submitting
       } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error message:", error.message);
          alert("Failed to submit complaint. Please try again.");
        } else {
          console.error("An unknown error occurred.");
          alert("An unknown error occurred.");
        }
      }
    }
      
    

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView style={{ paddingHorizontal: wp(4) }}>
        <TouchableWithoutFeedback>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <View className="flex-1">
              <BackButton navigation={navigation} />
              <ScrollView className="px-8 py-4" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="items-center mb-6">
                  <Image source={require("../assets/images/complain11.png")} className="w-20 h-20" />
                  <Text className="text-xl font-bold text-gray-900 mt-2">
                    Tell us the <Text className="text-purple-500">problem</Text>
                  </Text>
                </View>

                <View className="mb-4 border border-gray-300 rounded-full overflow-hidden">
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(itemValue) => setSelectedCategory(itemValue)}
                    style={{ height: 50, color: "#333" }}
                  >
                    <Picker.Item label="Select Complaint Category" value="" />
                    <Picker.Item label="Technical Issue" value="Technical Issue" />
                    <Picker.Item label="Billing Problem" value="Billing Problem" />
                    <Picker.Item label="Customer Service" value="Customer Service" />
                    <Picker.Item label="Other" value="Other" />
                  </Picker>
                </View>

                <Text className="text-center text-black mb-4">
                  -- We will get back to you within 2 days --
                </Text>

                <View className="mb-8">
                  <TextInput
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                    placeholder="Add the Complaint here.."
                    className="text-gray-800 bg-white border border-gray-300 rounded-lg p-4 min-h-[250px]"
                    value={complaintText}
                    onChangeText={setComplaintText}
                  />
                </View>

                <TouchableOpacity
                  className="bg-purple-600 py-3 rounded-full items-center mx-auto w-40 shadow-lg"
                  onPress={handleSubmit}
                >
                  <Text className="text-white font-semibold text-lg">Submit</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </ScrollView>
      {!isKeyboardVisible && <Navbar navigation={navigation} activeTab="CustomersScreen" />}
    </SafeAreaView>
  );
};

export default AddComplaintScreen;
