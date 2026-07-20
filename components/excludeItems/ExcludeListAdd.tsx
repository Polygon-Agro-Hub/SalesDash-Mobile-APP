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
import LoadingPage from "../common/LoadingPage";
import ToggleSwitch from "../common/ToggleSwitch";

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

interface Crop {
  id: number;
  displayName: string;
  image: string;
  isIncluded?: boolean;
  isExcluded?: boolean;
}

interface CropRowProps {
  item: Crop;
  isIncluded: boolean;
  isExcluded: boolean;
  onToggleInclude: (cropId: number) => void;
  onToggleExclude: (cropId: number) => void;
}

const CropRow = React.memo(
  ({
    item,
    isIncluded,
    isExcluded,
    onToggleInclude,
    onToggleExclude,
  }: CropRowProps) => {
    return (
      <View className="flex-row justify-between items-center my-1 px-6 mb-2">
        <View className="flex-row items-center gap-4 flex-1">
          <Image
            source={{ uri: item.image }}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
          <Text
            className="text-black text-base font-medium flex-1"
            numberOfLines={2}
          >
            {item.displayName}
          </Text>
        </View>

        <View className="flex-row items-center" style={{ gap: 20 }}>
          <ToggleSwitch
            isOn={isIncluded}
            onColor="#22C55E"
            offColor="#D9D9D9"
            size="medium"
            onToggle={() => onToggleInclude(item.id)}
          />
          <ToggleSwitch
            isOn={isExcluded}
            onColor="#EF4444"
            offColor="#D9D9D9"
            size="medium"
            onToggle={() => onToggleExclude(item.id)}
          />
        </View>
      </View>
    );
  },
);

const ExcludeListAdd: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { customerId, name, title, number, id } =
    (route.params as RouteParams) || {};

  const [crops, setCrops] = useState<Crop[]>([]);
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);

  const [selectedIncludeCrops, setSelectedIncludeCrops] = useState<number[]>(
    [],
  );
  const [selectedExcludeCrops, setSelectedExcludeCrops] = useState<number[]>(
    [],
  );

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [customerDataLoading, setCustomerDataLoading] = useState(true);
  const [listLoading, setListLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);

  const toggleInclude = useCallback((cropId: number) => {
    setSelectedExcludeCrops((prev) => prev.filter((id) => id !== cropId));
    setSelectedIncludeCrops((prev) =>
      prev.includes(cropId)
        ? prev.filter((id) => id !== cropId)
        : [...prev, cropId],
    );
  }, []);

  const toggleExclude = useCallback((cropId: number) => {
    setSelectedIncludeCrops((prev) => prev.filter((id) => id !== cropId));
    setSelectedExcludeCrops((prev) =>
      prev.includes(cropId)
        ? prev.filter((id) => id !== cropId)
        : [...prev, cropId],
    );
  }, []);

  const getCurrentCustomerData = () => {
    if (customerData) {
      const fullName =
        `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();

      return {
        name: fullName || name || "",
        title: customerData.title || title || "",
        number: customerData.phoneNumber || number || "",
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
  }, [navigation, customerData, name, title, number, id, customerId]);

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

  const initialiseSelections = (cropList: Crop[]) => {
    const includeIds = cropList
      .filter((crop) => crop.isIncluded)
      .map((crop) => crop.id);
    const excludeIds = cropList
      .filter((crop) => crop.isExcluded)
      .map((crop) => crop.id);

    setSelectedIncludeCrops(includeIds);
    setSelectedExcludeCrops(excludeIds);
  };

  useFocusEffect(
    useCallback(() => {
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

          const headers = { Authorization: `Bearer ${storedToken}` };

          const [cropListRes, excludeRes, preferRes] = await Promise.allSettled(
            [
              axios.get(`${environment.API_BASE_URL}api/customer/croplist`, {
                headers,
                params: { customerId },
              }),
              axios.get(`${environment.API_BASE_URL}api/customer/excludelist`, {
                headers,
                params: { customerId },
              }),
              axios.get(`${environment.API_BASE_URL}api/customer/preferlist`, {
                headers,
                params: { customerId },
              }),
            ],
          );

          if (
            cropListRes.status !== "fulfilled" ||
            !cropListRes.value.data?.data
          ) {
            console.error("Failed to fetch products:", cropListRes);
            setCrops([]);
            setFilteredCrops([]);
            return;
          }

          const cropList: Crop[] = cropListRes.value.data.data;

          if (excludeRes.status === "rejected") {
            console.error(
              "excludelist fetch failed (treating as empty):",
              excludeRes.reason?.response?.status,
              excludeRes.reason?.response?.data || excludeRes.reason?.message,
            );
          }
          if (preferRes.status === "rejected") {
            console.error(
              "preferlist fetch failed (treating as empty):",
              preferRes.reason?.response?.status,
              preferRes.reason?.response?.data || preferRes.reason?.message,
            );
          }

          const excludedItemIds = new Set<number>(
            excludeRes.status === "fulfilled"
              ? (excludeRes.value.data?.data || [])
                  .map((row: any) => row.marketplaceItemId)
                  .filter((itemId: number | null) => itemId != null)
              : [],
          );

          const includedItemIds = new Set<number>(
            preferRes.status === "fulfilled"
              ? (preferRes.value.data?.data || [])
                  .map((row: any) => row.marketplaceItemId)
                  .filter((itemId: number | null) => itemId != null)
              : [],
          );

          const mergedCropList: Crop[] = cropList.map((crop) => ({
            ...crop,
            isIncluded: includedItemIds.has(crop.id),
            isExcluded: excludedItemIds.has(crop.id),
          }));

          setCrops(mergedCropList);
          setFilteredCrops(mergedCropList);
          initialiseSelections(mergedCropList);
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
        setLoading(false);
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const requests: Promise<any>[] = [];

      if (selectedExcludeCrops.length > 0) {
        requests.push(
          axios.post(
            `${environment.API_BASE_URL}api/customer/add/excludelist`,
            { customerId, selectedCrops: selectedExcludeCrops },
            { headers },
          ),
        );
      }

      if (selectedIncludeCrops.length > 0) {
        requests.push(
          axios.post(
            `${environment.API_BASE_URL}api/customer/add/preferlist`,
            { customerId, selectedCrops: selectedIncludeCrops },
            { headers },
          ),
        );
      }

      const responses = await Promise.all(requests);
      const allOk = responses.every((res) => res.status === 200);

      if (allOk) {
        const currentData = getCurrentCustomerData();
        navigation.navigate("ExcludeListSummery", {
          customerId: Number(customerId),
          name: currentData.name,
          title: currentData.title,
          phoneNumber: currentData.number,
          cusId: currentData.customerId,
          id: Number(currentData.id) || undefined,
        });
      } else {
        console.error("One of the list updates did not return 200");
      }
    } catch (err) {
      console.error("Error posting include/exclude list:", err);
    } finally {
      setLoading(false);
    }
  };

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

  const handleNavigateIfNoCropsSelected = () => {
    if (
      selectedIncludeCrops.length === 0 &&
      selectedExcludeCrops.length === 0
    ) {
      const currentData = getCurrentCustomerData();
      navigation.navigate("ExcludeListSummery", {
        customerId: Number(customerId),
        name: currentData.name,
        title: currentData.title,
        phoneNumber: currentData.number,
        cusId: currentData.customerId,
        id: Number(currentData.id) || undefined,
      });
    } else {
      handlesubmitexcludelist();
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
          title="Customize Packages"
          titleColor="#6C3CD1"
          showBackButton={true}
          navigation={navigation}
          onBackPress={handleBackPress}
        />

        <View className="flex-1 mx-auto w-full max-w-[500px]">
          <View className="px-5">
            <Text className="text-center text-sm text-gray-500">
              Choose items the customer would prefer to include or exclude from
              the package. An item cannot be both preferred and excluded.
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
                style={{
                  height: 50,
                  justifyContent: "center",
                }}
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
            <View className="flex-1 justify-center items-center">
              <NoDataFound message={searchError} />
            </View>
          )}

          {/* Column headers */}
          <View className="flex-row justify-between items-center px-6 mb-2">
            <Text className="text-black text-sm font-semibold">Product</Text>
            <View className="flex-row items-center" style={{ gap: 20 }}>
              <View style={{ width: 52, alignItems: "center" }}>
                <Text
                  className="text-green-600 text-sm font-semibold"
                  style={{ textAlign: "center" }}
                >
                  Include
                </Text>
              </View>
              <View style={{ width: 52, alignItems: "center" }}>
                <Text
                  className="text-red-500 text-sm font-semibold"
                  style={{ textAlign: "center" }}
                >
                  Exclude
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-1">
            <FlatList
              keyboardShouldPersistTaps="handled"
              data={filteredCrops}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 100 }}
              renderItem={({ item }) => (
                <CropRow
                  item={item}
                  isIncluded={selectedIncludeCrops.includes(item.id)}
                  isExcluded={selectedExcludeCrops.includes(item.id)}
                  onToggleInclude={toggleInclude}
                  onToggleExclude={toggleExclude}
                />
              )}
              initialNumToRender={12}
              maxToRenderPerBatch={12}
              windowSize={7}
              removeClippedSubviews={Platform.OS === "android"}
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
