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
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import BackButton from "./BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import { SelectList } from "react-native-dropdown-select-list";

type AddComplaintScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddComplaintScreen"
>;

interface AddComplaintScreenProps {
  navigation: AddComplaintScreenNavigationProp;
}

const AddComplaintScreen: React.FC<AddComplaintScreenProps> = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  console.log(selectedCategory)
  const [complaintText, setComplaintText] = useState<string>("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
    const [category, setCategory] = useState<any[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
      let appName = "SalesDash";

  
      console.log("appName", appName);
      const fetchComplainCategory = async () => {
        try {
          const response = await axios.get(
            `${environment.API_BASE_URL}api/complain/get-complain/category/${appName}`
          );
          console.log("response", response.data);
          if (response.data.status === "success") {
            console.log(response.data.data);
            const mappedCategories = response.data.data
            .map((item: any) => {
              return {
                key: item.id,           // This will be stored in state when selected
                value: item.categoryEnglish  // This will be displayed to the user
              };
            })
            .filter((item: { key: any }) => item.key);
          
          setCategory(mappedCategories);
  
            setCategory(mappedCategories);
          }
        } catch (error) {
          console.error(error);
        }
      };
  
      fetchComplainCategory();
    }, []);

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
    
        console.log(selectedCategory, complaintText);     
    
        const apiUrl = `${environment.API_BASE_URL}api/complain/add-complain`;
    
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

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
      keyboardShouldPersistTaps="handled"
      style={{ paddingHorizontal: wp(4) }}>
        <TouchableWithoutFeedback>
        <KeyboardAvoidingView 
    behavior={Platform.OS ==="ios" ? "padding" : "height"}
  enabled 
  className="flex-1"
>
            <View className="flex-1">
              <BackButton navigation={navigation} />
              <ScrollView className="px-8 py-4" keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 100 }}>
                <View className="items-center mb-6">
                  <Image source={require("../assets/images/complain11.webp")} className="w-20 h-20" />
                  <Text className="text-xl font-bold text-gray-900 mt-2">
                    Tell us the <Text className="text-[#6839CF]">problem</Text>
                  </Text>
                </View>
               <SelectList
  setSelected={(val: string) => setSelectedCategory(val)}
  data={category}
  save="key"
  placeholder="Select Complaint Category"
  boxStyles={{ borderColor: "#393939", height: 50 }}
  inputStyles={{ color: "#434343", fontSize: 14 }}
  dropdownTextStyles={{ fontSize: 12 }}
  search={false}
/>

              

                

                <Text className="text-center text-black mb-4 mt-4">
                  -- We will get back to you within 2 days --
                </Text>

                <View className="mb-8">
  <TextInput
    multiline
    numberOfLines={6}
    textAlignVertical="top"
    placeholder="Add the Complaint here.."
    placeholderTextColor="#808FA2 text-italic" 
    className="text-black bg-white border border-[#393939] rounded-lg p-4 min-h-[250px] italic"
    value={complaintText}
    onChangeText={setComplaintText}
  />
</View>

                <TouchableOpacity onPress={handleSubmit} className="mx-auto shadow-lg w-40">
  <LinearGradient
    colors={["#6839CF", "#874DDB"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    className="py-3 rounded-full items-center"
  >
    <Text className="text-white text-lg font-bold">Submit</Text>
  </LinearGradient>
</TouchableOpacity>

              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AddComplaintScreen;
