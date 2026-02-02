import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import {
    widthPercentageToDP as wp,
    heightPercentageToDP as hp,
  } from "react-native-responsive-screen";
import BackButton from "../common/BackButton";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DropDownPicker from "react-native-dropdown-picker";
import { SelectList } from "react-native-dropdown-select-list";
import { AntDesign } from "@expo/vector-icons"; 
import { useFocusEffect } from '@react-navigation/native';

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
  const [category, setCategory] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredCategory, setFilteredCategory] = useState<any[]>([]);

  useEffect(() => {
    let appName = "SalesDash";
    
    const fetchComplainCategory = async () => {
      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/complain/get-complain/category/${appName}`
        );
        if (response.data.status === "success") {
          const mappedCategories = response.data.data
            .map((item: any) => ({
              key: item.id,
              value: item.categoryEnglish
            }))
            .filter((item: { key: any }) => item.key);
          
          setCategory(mappedCategories);
          setFilteredCategory(mappedCategories);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchComplainCategory();
  }, []);

  const handleSubmit = async () => {
    if (!selectedCategory) {
      alert("Please fill out the category.");
      return;
    }

    if (!complaintText.trim()) {
      alert("Please fill out the complaint text before submitting.");
      return;
    }

    
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }
  
  
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
      setSelectedCategory("");
      setComplaintText("");
      navigation.goBack();
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
    setFilteredCategory(category);
  }, [category]);

  const handleSearchChange = (text: string) => {
    let filteredText = text;
    
    if (filteredText.startsWith(' ')) {
      filteredText = filteredText.replace(/^\s+/, '');
    }
    
    filteredText = filteredText.replace(/[^a-zA-Z0-9\s]/g, '');
    filteredText = filteredText.replace(/\s+/g, ' ');
    
    setSearchValue(filteredText);
    
    if (filteredText.trim() === '') {
      setFilteredCategory(category);
    } else {
      const filtered = category.filter(item => 
        item.value.toLowerCase().includes(filteredText.toLowerCase())
      );
      setFilteredCategory(filtered);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("SidebarScreen" as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
      style={{ flex: 1, backgroundColor: "white" }}
    >
      <ScrollView 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ 
          flexGrow: 1,
          paddingHorizontal: wp(4),
          paddingBottom: hp(5) // Extra padding at bottom
        }}
        showsVerticalScrollIndicator={true}
      >
        <View>
          <TouchableOpacity 
            style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
            onPress={() => navigation.navigate("SidebarScreen")}
          >
            <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
              <AntDesign name="left" size={20} color="black" />
            </View>
          </TouchableOpacity>
        </View>

        <View className="p-4">
          <View className="items-center mb-6">
            <Image source={require("../../assets/images/complain11.webp")} className="w-20 h-20" />
            <Text className="text-xl font-bold text-gray-900 mt-2">
              Tell us the <Text className="text-[#6839CF]">problem</Text>
            </Text>
          </View>

          <DropDownPicker
            open={open}
            setOpen={setOpen}
            value={selectedCategory}
            setValue={setSelectedCategory}
            items={filteredCategory.map(item => ({
              label: item.value,
              value: item.key
            }))}
            searchable={true}
            searchPlaceholder="Search category..."
            placeholder="Select Complaint Category"
            style={{
              borderColor: "#393939",
              borderRadius: 30,
              height: 50,
              backgroundColor: "#FFFFFF",
            }}
            dropDownContainerStyle={{
              borderColor: "#0a0a0bff",
              backgroundColor: "#FFFFFF",
              maxHeight: 500,
            }}
            textStyle={{
              color: "#434343",
              fontSize: 14,
            }}
            searchTextInputStyle={{
              borderColor: "#0c0c0cff",
              color: "#434343",
            }}
            searchContainerStyle={{
              borderBottomColor: "#E5E7EB",
            }}
            listItemLabelStyle={{
              fontSize: 12,
            }}
            zIndex={3000}
            zIndexInverse={1000}
            listMode="SCROLLVIEW"
            searchTextInputProps={{
              onChangeText: handleSearchChange,
              value: searchValue,
            }}
          />

          <Text className="text-center text-black mb-4 mt-4">
            --  We will get back to you within 2 days --
          </Text>

          <View className="mb-8">
            <TextInput
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Add the Complaint here.."
              placeholderTextColor="#808FA2" 
              className="text-black bg-white border border-[#393939] rounded-lg p-4 min-h-[250px]"
              value={complaintText}
              onChangeText={(text) => {
                if (text.startsWith(' ')) {
                  return;
                }
                
                if (text.length > 0) {
                  const firstChar = text.charAt(0);
                  const isAlphabetic = /^[a-zA-Z]$/.test(firstChar);
                  
                  if (!isAlphabetic) {
                    return;
                  }
                  
                  if (text.length === 1) {
                    text = text.toUpperCase();
                  }
                }
                
                setComplaintText(text);
              }}
              autoCapitalize="sentences"
            />
          </View>

          <TouchableOpacity onPress={handleSubmit} className="mx-auto shadow-lg w-40 mb-4">
            <LinearGradient
              colors={["#6839CF", "#874DDB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="py-3 rounded-full items-center"
            >
              <Text className="text-white text-lg font-bold">Submit</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddComplaintScreen;