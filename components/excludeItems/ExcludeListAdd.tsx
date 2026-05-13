import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
  FlatList,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { TextInput } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import Ionicons from "react-native-vector-icons/Ionicons";
import LottieView from "lottie-react-native";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";

type ExcludeListAddNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeListAdd"
>;

interface CustomerData {
  name?: string;
  title?: string;
  number?: string;
  cusId?: number;
  id?: number;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
}

interface RouteParams {
  customerId: number;
  name?: string;
  title?: string;
  number?: string;
  id?: number;
}

interface ExcludeListAddProps {
  navigation: ExcludeListAddNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeListAdd">;
}

const ExcludeListAdd: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { customerId, name, title, number, id } =
    (route.params as RouteParams) || {};
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<number[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerDataLoading, setCustomerDataLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  const toggleSelect = (id: number) => {
    setSelectedCrops((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((cropId) => cropId !== id)
        : [...prevSelected, id],
    );
  };

  // Get current customer data (either from state or route params)
  const getCurrentCustomerData = () => {
    if (customerData) {
      return {
        name: customerData.name || customerData.firstName || name || "",
        title: customerData.title || title || "",
        number: customerData.number || customerData.phoneNumber || number || "",
        id: customerData.id?.toString() || id?.toString() || "",
        customerId: customerData.cusId?.toString() || customerId.toString(),
      };
    }
    return {
      name: name || "",
      title: title || "",
      number: number || "",
      id: id?.toString() || "",
      customerId: customerId.toString(),
    };
  };

  // Define handleBackPress outside of useFocusEffect so it can be reused
  const handleBackPress = useCallback(() => {
    const currentData = getCurrentCustomerData();

    navigation.navigate("Main", {
      screen: "ViewCustomerScreen",
      params: {
        number: currentData.number,
        name: currentData.name,
        customerId: currentData.customerId,
        id: currentData.id,
        title: currentData.title,
      },
    });

    return true;
  }, [navigation]);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setCustomerDataLoading(true);
        const token = await AsyncStorage.getItem("authToken");
        if (!token) {
          console.error("No authentication token found");
          setCustomerDataLoading(false);
          return;
        }

        // Fixed the API endpoint name
        const response = await axios.get(
          `${environment.API_BASE_URL}api/customer/get-customer-excludelist/${customerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.data && response.data.data) {
          setCustomerData(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching customer data:", error);
      } finally {
        setCustomerDataLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  useFocusEffect(
    useCallback(() => {
      setSelectedCrops([]);

      const unsubscribe = navigation.addListener("beforeRemove", (e) => {
        e.preventDefault();
        const currentData = getCurrentCustomerData();
        navigation.navigate("ViewCustomerScreen", {
          number: currentData.number,
          name: currentData.name,
          customerId: currentData.customerId,
          id: currentData.id,
          title: currentData.title,
        });
      });

      // Handle hardware back button
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackPress,
      );

      const fetchProducts = async () => {
        try {
          setListLoading(true);
          const storedToken = await AsyncStorage.getItem("authToken");
          if (!storedToken) {
            setListLoading(false);
            return;
          }

          const apiUrl = `${environment.API_BASE_URL}api/customer/croplist`;
          const response = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${storedToken}` },
            params: { customerId: customerId },
          });

          if (response.data && response.data.data) {
            setCrops(response.data.data);
            setFilteredCrops(response.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch products:", err);
        } finally {
          setListLoading(false);
        }
      };

      fetchProducts();

      return () => {
        unsubscribe();
        backHandler.remove();
      };
    }, [navigation, customerData, customerId, number, name, id, title]),
  );

  const handlesubmitexcludelist = async () => {
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const payload = {
        customerId,
        selectedCrops,
      };

      const checkResponse = await axios.post(
        `${environment.API_BASE_URL}api/customer/add/excludelist`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (checkResponse.status === 200) {
        navigation.navigate("ExcludeListSummery", {
          customerId: Number(customerId),
        });
      } else if (checkResponse.status === 400) {
        console.error("Bad request:", checkResponse.data.message);
      } else if (checkResponse.status === 404) {
        console.error("Not Found:", checkResponse.data.message);
      }
    } catch (err) {
      console.error("Error posting exclude list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    let cleanedQuery = query;

    // Remove special characters, keep only letters (a-z, A-Z), numbers (0-9), and spaces
    cleanedQuery = cleanedQuery.replace(/[^a-zA-Z0-9\s]/g, "");

    // If the query starts with space and there's no letter/number before it, remove the leading space
    if (cleanedQuery.length > 0 && cleanedQuery[0] === " ") {
      cleanedQuery = cleanedQuery.replace(/^\s+/, "");
    }

    // Prevent multiple consecutive spaces
    cleanedQuery = cleanedQuery.replace(/\s+/g, " ");

    setSearchQuery(cleanedQuery);
    setSearchError(null);

    if (cleanedQuery === "") {
      setFilteredCrops(crops);
    } else {
      const filtered = crops.filter((crop) =>
        crop.displayName.toLowerCase().includes(cleanedQuery.toLowerCase()),
      );
      setFilteredCrops(filtered);

      // Set error if no results found
      if (filtered.length === 0) {
        setSearchError("No products found matching your search");
      }
    }
  };

  const handleNavigateIfNoCropsSelected = () => {
    if (selectedCrops.length === 0) {
      navigation.navigate("ExcludeListSummery", {
        customerId: Number(customerId),
      });
    } else {
      handlesubmitexcludelist();
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      // Clear search state when screen comes into focus
      setSearchQuery("");
      setSearchError(null);
      // Reset filtered crops to show all crops
      if (crops.length > 0) {
        setFilteredCrops(crops);
      }
    });

    return unsubscribe;
  }, [navigation, crops]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setIsKeyboardVisible(true);
      },
    );
    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setIsKeyboardVisible(false);
      },
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Show loading while fetching customer data
  if (listLoading) {
    return <LoadingPage message="Loading Item List..." fullScreen={true} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.select({ ios: 60, android: 0 })}
    >
      <View className="flex-1 bg-white">
        <CustomHeader
          title="Exclude Item List"
          titleColor="#6C3CD1"
          showBackButton={true}
          navigation={navigation}
          onBackPress={handleBackPress}
        />

        <View className="flex-1 mx-auto w-full max-w-[500px]">
          <View className="px-5">
            <Text className="text-center text-sm">
              Exclude any items your customer doesn't want in their package.
              Simply tap on the Products they want to remove.
            </Text>
          </View>

          <View className="px-6 my-6">
            <View className="relative">
              <TextInput
                className="p-3 pl-4 flex-row justify-between items-center border border-[#6B3BCF] rounded-full bg-[#F5F1FC]"
                placeholder="Search Products"
                placeholderTextColor="black"
                value={searchQuery}
                onFocus={() => setIsKeyboardVisible(true)}
                onChangeText={handleSearch}
              />

              <Ionicons
                name="search"
                size={24}
                color="#6C3CD1"
                style={{
                  position: "absolute",
                  right: 16,
                  marginTop: Platform.OS === "ios" ? 10 : 20,
                  transform: [{ translateY: -12 }],
                }}
              />
            </View>
          </View>

          {searchError && (
            <View className="flex-1">
              <View className="justify-center items-center mt-4">
                <LottieView
                  source={require("@/assets/json/no-data.json")}
                  style={{ width: wp(50), height: hp(50) }}
                  autoPlay
                  loop
                />
              </View>
              <View className="justify-center  mt-[-30%] items-center   ">
               <Text className="text-black italic text-center mt-4">
                  {searchError}
                </Text>
              </View>
            </View>
            
          )}

          <View className="flex-1">
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filteredCrops}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => toggleSelect(item.id)}
                  className="flex-row justify-between items-center my-1 px-6 mb-2"
                >
                  {/* Crop name and selection toggle */}
                  <View className="flex-row items-center gap-4">
                    <View
                      className={`w-6 h-6 rounded-full border-2 justify-center items-center ${
                        selectedCrops.includes(item.id)
                          ? "bg-red-600 border-red-600"
                          : "bg-white border-gray-400"
                      }`}
                    >
                      {selectedCrops.includes(item.id) && (
                        <Ionicons name="close" size={16} color="white" />
                      )}
                    </View>
                    <Text className="text-black text-base font-medium">
                      {item.displayName}
                    </Text>
                  </View>

                  {/* Crop image */}
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: 60, height: 60 }}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </View>

      {!isKeyboardVisible && (
        <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-4 px-6 items-center">
          <TouchableOpacity
            onPress={handleNavigateIfNoCropsSelected}
            className="w-full max-w-[500px] items-center"
            disabled={loading}
          >
            <LinearGradient
              colors={["#6839CF", "#874DDB"]}
              start={[0, 0]}
              end={[1, 1]}
              style={{
                width: "70%",
                paddingVertical: 12,
                borderRadius: 25,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000000",
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.2,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <View>
                  <Text
                    style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}
                  >
                    Continue
                  </Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ExcludeListAdd;
