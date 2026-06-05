import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  FlatList,
  Keyboard,
  ActivityIndicator,
  BackHandler,
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
import NoDataFound from "../common/NoDataFound";
import CustomHeader from "../common/CustomHeader";

type ExcludeAddMoreNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeAddMore"
>;

interface ExcludeListAddProps {
  navigation: ExcludeAddMoreNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeAddMore">;
}

const ExcludeListAdd: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const [crops, setCrops] = useState<any[]>([]);
  const [selectedCrops, setSelectedCrops] = useState<number[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toggleSelect = (id: number) => {
    setSelectedCrops((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((cropId) => cropId !== id)
        : [...prevSelected, id],
    );
  };

  useFocusEffect(
    useCallback(() => {
      const { id } = route.params;

      setSelectedCrops([]);
      setCrops([]);
      setFilteredCrops([]);
      setSearchQuery("");
      setSearchError(null);

      const fetchProducts = async () => {
        try {
          const storedToken = await AsyncStorage.getItem("authToken");
          const apiUrl = `${environment.API_BASE_URL}api/customer/croplist`;
          const response = await axios.get(apiUrl, {
            headers: { Authorization: `Bearer ${storedToken}` },
            params: { customerId: id },
          });

          if (response.data?.data) {
            setCrops(response.data.data);
            setFilteredCrops(response.data.data);
          }
        } catch (err) {
          console.error("Failed to fetch products:", err);
        }
      };

      fetchProducts();
    }, [route.params.id]),
  );

  const handleSearch = (query: string) => {
    let cleanedQuery = query;
    cleanedQuery = cleanedQuery.replace(/[^a-zA-Z0-9\s]/g, "");
    if (cleanedQuery.length > 0 && cleanedQuery[0] === " ") {
      cleanedQuery = cleanedQuery.replace(/^\s+/, "");
    }
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

      if (filtered.length === 0) {
        setSearchError("No products found matching your search");
      }
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setSearchQuery("");
      setSearchError(null);
      if (crops.length > 0) {
        setFilteredCrops(crops);
      }
    });

    return unsubscribe;
  }, [navigation, crops]);

  const handlesubmitexcludelist = async () => {
    const { id, customerId, name, title } = route.params;
    setLoading(true);

    try {
      const token = await AsyncStorage.getItem("authToken");
      if (!token) return;

      const payload = { customerId: id, selectedCrops };

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
        navigation.navigate("ExcludeItemEditSummery" as any, {
          id,
          customerId,
          name,
          title,
        });
      }
    } catch (err) {
      console.error("Error posting exclude list:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigateIfNoCropsSelected = () => {
    handlesubmitexcludelist();
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const { id, customerId, name, title } = route.params;
        navigation.navigate("ExcludeItemEditSummery" as any, {
          id,
          customerId,
          name,
          title,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, route.params]),
  );

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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className=" bg-white"
    >
      <CustomHeader
        title="Exclude Item List"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => {
          const { id, customerId, name, title } = route.params;
          navigation.navigate("ExcludeItemEditSummery" as any, {
            id,
            customerId,
            name,
            title,
          });
        }}
      />
      <View className="flex-1 mx-auto w-full max-w-[500px]">
        <Text className="text-center text-sm px-6">
          Exclude any items your customer doesn’t want in their package. Simply
          tap on the Products they want to remove.
        </Text>

        <View className="px-6 mt-6 mb-6">
          <View className="relative">
            {/* TextInput with search icon inside */}
            <TextInput
              className="p-3 pr-10 flex-row justify-between items-center border border-[#6B3BCF] rounded-full bg-[#F5F1FC]"
              placeholder="Search Products"
              placeholderTextColor="black"
              value={searchQuery}
              onFocus={() => setIsKeyboardVisible(true)}
              onChangeText={handleSearch}
            />

            {/* Search icon positioned inside the TextInput */}
            <Ionicons
              name="search"
              size={24}
              color="#6C3CD1"
              style={{
                position: "absolute",
                right: 20,
                marginTop: Platform.OS === "ios" ? 20 : 20,
                transform: [{ translateY: -12 }],
              }}
            />
          </View>
        </View>

        {searchError && (
          <View className="flex-1 justify-center items-center">
            <NoDataFound message={searchError} />
          </View>
        )}
        <View className="flex-1">
          <FlatList
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 100 }}
            data={filteredCrops}
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
                    Add
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
