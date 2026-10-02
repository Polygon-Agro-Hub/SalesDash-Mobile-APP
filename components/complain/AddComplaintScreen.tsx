import React, { useState, useEffect, useCallback, useRef } from "react";
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
  BackHandler,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import axios from "axios";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import GlobalSearchModal from "../common/GlobalSearchModal";

type AddComplaintScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "AddComplaintScreen"
>;

interface AddComplaintScreenProps {
  navigation: AddComplaintScreenNavigationProp;
}

const AddComplaintScreen: React.FC<AddComplaintScreenProps> = ({
  navigation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [complaintText, setComplaintText] = useState<string>("");
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [category, setCategory] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategoryLabel, setSelectedCategoryLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const generateIdempotencyKey = () =>
    `complain_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const idempotencyKeyRef = useRef(generateIdempotencyKey());

  useEffect(() => {
    let appName = "SalesDash";

    const fetchComplainCategory = async () => {
      try {
        const response = await axios.get(
          `${environment.API_BASE_URL}api/complain/get-complain/category/${appName}`,
        );
        if (response.data.status === "success") {
          const mappedCategories = response.data.data
            .map((item: any) => ({
              label: item.categoryEnglish,
              value: item.id,
            }))
            .filter((item: { value: any }) => item.value);

          setCategory(mappedCategories);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchComplainCategory();
  }, []);

  const handleSubmit = async () => {
    if (isSubmittingRef.current) {
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Please select a category.");
      return;
    }

    if (!complaintText.trim()) {
      Alert.alert(
        "Error",
        "Please fill out the complaint text before submitting.",
      );
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);

    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        return;
      }

      const apiUrl = `${environment.API_BASE_URL}api/complain/add-complain`;

      await axios.post(
        apiUrl,
        {
          language: "English",
          category: selectedCategory,
          complain: complaintText,
        },
        {
          headers: {
            Authorization: `Bearer ${storedToken}`,
            "x-idempotency-key": idempotencyKeyRef.current,
          },
        },
      );

      // Generate a new idempotency key for future submissions
      idempotencyKeyRef.current = generateIdempotencyKey();

      Alert.alert("Success", "Complaint submitted successfully!", [
        {
          text: "OK",
          onPress: () => {
            setSelectedCategory("");
            setSelectedCategoryLabel("");
            setComplaintText("");
            navigation.navigate("SidebarScreen");
          },
        },
      ]);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        Alert.alert("Error", "Failed to submit complaint. Please try again.");
      } else {
        console.error("An unknown error occurred.");
        Alert.alert("Error", "An unknown error occurred.");
      }
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("SidebarScreen" as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => setKeyboardVisible(false),
    );
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const handleCategorySelect = (items: string[]) => {
    const selectedValue = items[0];
    setSelectedCategory(selectedValue);

    const selectedItem = category.find((item) => item.value === selectedValue);
    setSelectedCategoryLabel(selectedItem?.label || "");
  };

  return (
    <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "white" }}
        >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 70,
        }}
        showsVerticalScrollIndicator={true}
      >
        <CustomHeader
          title=""
          showBackButton={true}
          navigation={navigation}
          onBackPress={() => navigation.navigate("SidebarScreen")}
        />

        <View className="px-6 max-w-[500px] w-full mx-auto flex items-center mb-6">
          <View className="items-center mb-6">
            <Image
              source={require("@/assets/images/complain/complain.webp")}
              style={{ width: 130, height: 130 }}
              resizeMode="contain"
            />
            <Text className="text-xl font-bold text-gray-900 mt-2">
              Tell us the <Text className="text-[#6839CF]">problem</Text>
            </Text>
          </View>

          {/* Category Selection Button */}
          <TouchableOpacity
            onPress={() => setModalVisible(true)}
            className="border border-[#393939] rounded-full h-12 px-4 flex-row items-center justify-between bg-white mb-4 w-full"
          >
            <Text
              className={selectedCategory ? "text-black" : "text-[#434343]"}
            >
              {selectedCategoryLabel || "Select Complaint Category"}
            </Text>
            <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
          </TouchableOpacity>

          {/* Global Search Modal */}
          <GlobalSearchModal
            visible={modalVisible}
            onClose={() => setModalVisible(false)}
            title="Select Category"
            data={category}
            selectedItems={selectedCategory ? [selectedCategory] : []}
            onSelect={handleCategorySelect}
            searchPlaceholder="Search category..."
            doneButtonText="Done"
            noResultsText="No categories found"
            multiSelect={false}
            searchKeys={["label"]}
          />

          <Text className="text-center text-black mb-4">
            -- We will get back to you within 2 days --
          </Text>

          <View className="mb-8 w-full">
            <TextInput
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholder="Add the Complaint here.."
              placeholderTextColor="#808FA2"
              className="text-black bg-white border border-[#393939] rounded-lg p-4 min-h-[250px]"
              value={complaintText}
              onChangeText={(text) => {
                if (text.startsWith(" ")) {
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

          <View
            style={{
              alignSelf: "center",
              marginBottom: 16,
              borderRadius: 50,
              backgroundColor: loading ? "#A0A0A0" : "#6839CF",
              shadowColor: loading ? "#A0A0A0" : "#6839CF",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 12,
              elevation: 12,
            }}
          >
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.8}
              style={{ width: 160 }}
            >
              <LinearGradient
                colors={
                  loading ? ["#9E9E9E", "#757575"] : ["#6839CF", "#874DDB"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingVertical: 12,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row",
                  minHeight: 48,
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text
                    style={{
                      color: "white",
                      fontSize: 18,
                      fontWeight: "bold",
                    }}
                  >
                    Submit
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddComplaintScreen;
