import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  BackHandler,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { ScrollView } from "react-native-gesture-handler";
import { RouteProp, useFocusEffect } from "@react-navigation/native";
import environment from "@/environment/environment";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import LoadingPage from "../common/LoadingPage";
import FixedMarqueeText from "../common/MarqueeText";
import { Entypo, Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";

type ExcludeItemEditSummeryNavigationProp = StackNavigationProp<
  RootStackParamList,
  "ExcludeItemEditSummery"
>;

interface ExcludeListAddProps {
  navigation: ExcludeItemEditSummeryNavigationProp;
  route: RouteProp<RootStackParamList, "ExcludeItemEditSummery">;
}

interface ExcludeCrop {
  excludeId: number;
  displayName: string;
  image: string;
}

interface PreferCrop {
  preId: number;
  displayName: string;
  image: string;
}

const ExcludeItemEditSummery: React.FC<ExcludeListAddProps> = ({
  route,
  navigation,
}) => {
  const { id, customerId, name, title ,phone} = route.params;

  const [excludeCrops, setExcludeCrops] = useState<ExcludeCrop[]>([]);
  const [preferCrops, setPreferCrops] = useState<PreferCrop[]>([]);

  const [selectedExcludeIds, setSelectedExcludeIds] = useState<number[]>([]);
  const [selectedPreferIds, setSelectedPreferIds] = useState<number[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const [customerName, setCustomerName] = useState<{
    firstName: string;
    lastName: string;
    title: string;
    cusId: string;
  }>({
    firstName: "",
    lastName: "",
    title: "",
    cusId: "",
  });

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        setLoading(false);
        return;
      }

      const headers = { Authorization: `Bearer ${storedToken}` };

      const [excludeRes, preferRes] = await Promise.allSettled([
        axios.get(`${environment.API_BASE_URL}api/customer/excludelist`, {
          params: { customerId: id },
          headers,
        }),
        axios.get(`${environment.API_BASE_URL}api/customer/preferlist`, {
          params: { customerId: id },
          headers,
        }),
      ]);

      let gotCustomerInfo = false;

      if (excludeRes.status === "fulfilled" && excludeRes.value.data?.data) {
        const data = excludeRes.value.data.data;
        const valid = data.filter(
          (item: any) => item.excludeId && item.displayName,
        );
        setExcludeCrops(valid);

        if (data.length > 0) {
          const { firstName, lastName, title, cusId } = data[0];
          setCustomerName((prev) => ({
            ...prev,
            firstName: firstName || prev.firstName,
            lastName: lastName || prev.lastName,
            title: title || prev.title,
            cusId: cusId || prev.cusId,
          }));
          gotCustomerInfo = true;
        }
      } else {
        setExcludeCrops([]);
      }

      if (preferRes.status === "fulfilled" && preferRes.value.data?.data) {
        const data = preferRes.value.data.data;
        const valid = data.filter(
          (item: any) => item.preId && item.displayName,
        );
        setPreferCrops(valid);

        if (data.length > 0 && !gotCustomerInfo) {
          const { firstName, lastName, title, cusId } = data[0];
          setCustomerName((prev) => ({
            ...prev,
            firstName: firstName || prev.firstName,
            lastName: lastName || prev.lastName,
            title: title || prev.title,
            cusId: cusId || prev.cusId,
          }));
        }
      } else {
        setPreferCrops([]);
      }
    } catch (err) {
      console.error("Failed to fetch prefer/exclude lists:", err);
      setExcludeCrops([]);
      setPreferCrops([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      setSelectedExcludeIds([]);
      setSelectedPreferIds([]);
      fetchLists();
      return () => {};
    }, [fetchLists]),
  );

  const fullTitle =
    customerName.firstName && customerName.lastName
      ? `${customerName.title}. ${customerName.firstName} ${customerName.lastName}`
      : "Loading...";

  const handleBackPress = () => {
   
        navigation.navigate("ViewCustomerScreen" as any, {
          id: id,
          customerId: customerId,
          name: name,
          title: title,
          number: phone,
        })
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, id, customerId, name, title]),
  );

  const toggleSelectExclude = (excludeId: number) => {
    setSelectedExcludeIds((prev) =>
      prev.includes(excludeId)
        ? prev.filter((eId) => eId !== excludeId)
        : [...prev, excludeId],
    );
  };

  const toggleSelectPrefer = (preId: number) => {
    setSelectedPreferIds((prev) =>
      prev.includes(preId)
        ? prev.filter((pId) => pId !== preId)
        : [...prev, preId],
    );
  };

  const deleteExcludeCrop = async (excludeId: number) => {
    Alert.alert("Delete", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            const storedToken = await AsyncStorage.getItem("authToken");
            if (!storedToken) {
              console.error("No authentication token found");
              return;
            }

            const apiUrl = `${environment.API_BASE_URL}api/customer/excludelist/delete`;
            const response = await axios.delete(apiUrl, {
              headers: { Authorization: `Bearer ${storedToken}` },
              params: { excludeId },
            });

            if (response.status === 200) {
              setExcludeCrops((prev) =>
                prev.filter((crop) => crop.excludeId !== excludeId),
              );
              setSelectedExcludeIds((prev) =>
                prev.filter((eId) => eId !== excludeId),
              );
            } else {
              console.error("Failed to delete item");
            }
          } catch (err) {
            console.error("Error deleting exclude crop:", err);
          }
        },
      },
    ]);
  };

  const deletePreferCrop = async (preId: number) => {
    Alert.alert("Delete", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "OK",
        onPress: async () => {
          try {
            const storedToken = await AsyncStorage.getItem("authToken");
            if (!storedToken) {
              console.error("No authentication token found");
              return;
            }

            const apiUrl = `${environment.API_BASE_URL}api/customer/preferlist/delete`;
            const response = await axios.delete(apiUrl, {
              headers: { Authorization: `Bearer ${storedToken}` },
              params: { preferId: preId },
            });

            if (response.status === 200) {
              setPreferCrops((prev) =>
                prev.filter((crop) => crop.preId !== preId),
              );
              setSelectedPreferIds((prev) =>
                prev.filter((pId) => pId !== preId),
              );
            } else {
              console.error("Failed to delete item");
            }
          } catch (err) {
            console.error("Error deleting prefer crop:", err);
          }
        },
      },
    ]);
  };

  const deleteSelectedExcludeCrops = async () => {
    if (selectedExcludeIds.length === 0) return;

    Alert.alert(
      "Delete Selected",
      `Delete ${selectedExcludeIds.length} selected item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem("authToken");
              if (!storedToken) return;

              const apiUrl = `${environment.API_BASE_URL}api/customer/excludelist/delete`;
              await Promise.all(
                selectedExcludeIds.map((excludeId) =>
                  axios.delete(apiUrl, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    params: { excludeId },
                  }),
                ),
              );

              setExcludeCrops((prev) =>
                prev.filter(
                  (crop) => !selectedExcludeIds.includes(crop.excludeId),
                ),
              );
              setSelectedExcludeIds([]);
            } catch (err) {
              console.error("Error bulk deleting exclude crops:", err);
            }
          },
        },
      ],
    );
  };

  const deleteSelectedPreferCrops = async () => {
    if (selectedPreferIds.length === 0) return;

    Alert.alert(
      "Delete Selected",
      `Delete ${selectedPreferIds.length} selected item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "OK",
          onPress: async () => {
            try {
              const storedToken = await AsyncStorage.getItem("authToken");
              if (!storedToken) return;

              const apiUrl = `${environment.API_BASE_URL}api/customer/preferlist/delete`;
              await Promise.all(
                selectedPreferIds.map((preId) =>
                  axios.delete(apiUrl, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                    params: { preferId: preId },
                  }),
                ),
              );

              setPreferCrops((prev) =>
                prev.filter((crop) => !selectedPreferIds.includes(crop.preId)),
              );
              setSelectedPreferIds([]);
            } catch (err) {
              console.error("Error bulk deleting prefer crops:", err);
            }
          },
        },
      ],
    );
  };

  const hasAnyItems = () => excludeCrops.length > 0 || preferCrops.length > 0;

  const getButtonText = () => (hasAnyItems() ? "Add More" : "Add");

  const Checkbox = ({
    checked,
    onPress,
  }: {
    checked: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} hitSlop={8}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: checked ? "#374151" : "#9CA3AF",
          backgroundColor: checked ? "#374151" : "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <LoadingPage message="Loading Details..." fullScreen={true} />;
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
      className="bg-white"
    >
      {/* ── Inline header with marquee support ── */}
      <View
        style={{
          paddingTop: 12,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "transparent",
        }}
      >
        <TouchableOpacity
          onPress={handleBackPress}
          style={{
            width: 45,
            height: 45,
            borderRadius: 25,
            backgroundColor: "#F6F6F680",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginLeft: 10,
            zIndex: 1,
          }}
          activeOpacity={0.7}
        >
          <Entypo name="chevron-left" size={25} color="black" />
        </TouchableOpacity>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            overflow: "hidden",
            marginHorizontal: 8,
          }}
        >
          {fullTitle.length > 25 ? (
            <FixedMarqueeText
              text={fullTitle}
              style={{ fontSize: 16, fontWeight: "bold" }}
              speed={50}
            />
          ) : (
            <Text
              style={{
                fontSize: 16,
                fontWeight: "bold",
                color: "#000000",
                textAlign: "center",
              }}
            >
              {fullTitle}
            </Text>
          )}
        </View>

        <View style={{ width: 45, marginRight: 10 }} />
      </View>

      <View className="mx-auto w-full max-w-[500px]">
        <Text
          style={{ fontSize: 16, marginTop: -3 }}
          className="text-center text-black"
        >
          {customerName.firstName && customerName.lastName
            ? `Customer ID : ${customerName.cusId}`
            : "Loading..."}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1 mb-24"
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="mx-auto w-full max-w-[500px] px-6">
          {/* Items prefer to include */}
          <View
            style={{
              marginTop: 24,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <View
              className="flex-row items-center gap-3 px-4 py-3"
              style={{ backgroundColor: "#E6F2E5" }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="heart" size={16} color="#16A34A" />
              </View>
              <Text style={{ fontSize: 14, color: "#34C759" }}>
                Items prefer to Include
              </Text>
            </View>

            {preferCrops.length === 0 ? (
              <View className="items-center py-8">
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ExcludeAddMore", {
                      id: id,
                      customerId: customerId,
                      name: name,
                      title: title,
                    })
                  }
                  className="items-center"
                >
                  <LottieView
                    source={require("../../assets/json/add-items.json")}
                    autoPlay
                    loop
                    style={{ width: 80, height: 80 }}
                  />
                  <Text className="text-[#8C46FB] font-semibold">Add Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="px-4 pb-3">
                {selectedPreferIds.length > 0 && (
                  <View className="flex-row justify-end items-center gap-1 py-2">
                    <MaterialIcons name="delete" size={16} color="#FF000D" />
                    <TouchableOpacity onPress={deleteSelectedPreferCrops}>
                      <Text
                        style={{
                          color: "#FF000D",
                          fontSize: 12,
                          fontWeight: "600",
                          textDecorationLine: "underline",
                        }}
                      >
                        Delete Selected Items
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View
                  className="flex-row justify-between items-center py-2"
                  style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
                >
                  <Text
                    className="flex-1"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Item ({String(preferCrops.length).padStart(2, "0")})
                  </Text>
                  <Text
                    className="flex-1 text-center"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Name
                  </Text>
                  <Text
                    className="flex-1 text-right"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Action
                  </Text>
                </View>

                {preferCrops.map((crop) => (
                  <View
                    key={crop.preId}
                    className="flex-row justify-between items-center py-3"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                    }}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedPreferIds.includes(crop.preId)}
                        onPress={() => toggleSelectPrefer(crop.preId)}
                      />
                      <Image
                        source={{ uri: crop.image }}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      className="text-sm text-black flex-1 text-center"
                      numberOfLines={2}
                    >
                      {crop.displayName}
                    </Text>
                    <View className="flex-1 items-end">
                      <TouchableOpacity
                        onPress={() => deletePreferCrop(crop.preId)}
                      >
                        <MaterialIcons
                          name="delete"
                          size={22}
                          color="#FF000D"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Items prefer to exclude  */}
          <View
            style={{
              marginTop: 24,
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 12,
              backgroundColor: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <View
              className="flex-row items-center gap-3 px-4 py-3"
              style={{ backgroundColor: "#FDEEEE" }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={16} color="#DC2626" />
              </View>
              <Text
                style={{ fontSize: 15, fontWeight: "500", color: "#DC2626" }}
              >
                Items prefer to exclude
              </Text>
            </View>

            {excludeCrops.length === 0 ? (
              <View className="items-center py-8">
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("ExcludeAddMore", {
                      id: id,
                      customerId: customerId,
                      name: name,
                      title: title,
                    })
                  }
                  className="items-center"
                >
                  <LottieView
                    source={require("../../assets/json/add-items.json")}
                    autoPlay
                    loop
                    style={{ width: 80, height: 80 }}
                  />
                  <Text className="text-[#8C46FB] font-semibold">Add Now</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="px-4 pb-3">
                {selectedExcludeIds.length > 0 && (
                  <View className="flex-row justify-end items-center gap-1 py-2">
                    <MaterialIcons name="delete" size={16} color="#DC2626" />
                    <TouchableOpacity onPress={deleteSelectedExcludeCrops}>
                      <Text
                        style={{
                          color: "#FF000D",
                          fontSize: 12,
                          fontWeight: "600",
                          textDecorationLine: "underline",
                        }}
                      >
                        Delete Selected Items
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View
                  className="flex-row justify-between items-center py-2"
                  style={{ borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}
                >
                  <Text
                    className="flex-1"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Item ({String(excludeCrops.length).padStart(2, "0")})
                  </Text>
                  <Text
                    className="flex-1 text-center"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Name
                  </Text>
                  <Text
                    className="flex-1 text-right"
                    style={{ fontSize: 13, color: "#9CA3AF" }}
                  >
                    Action
                  </Text>
                </View>

                {excludeCrops.map((crop) => (
                  <View
                    key={crop.excludeId}
                    className="flex-row justify-between items-center py-3"
                    style={{
                      borderBottomWidth: 1,
                      borderBottomColor: "#F3F4F6",
                    }}
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      <Checkbox
                        checked={selectedExcludeIds.includes(crop.excludeId)}
                        onPress={() => toggleSelectExclude(crop.excludeId)}
                      />
                      <Image
                        source={{ uri: crop.image }}
                        style={{ width: 32, height: 32 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      className="text-sm text-black flex-1 text-center"
                      numberOfLines={2}
                    >
                      {crop.displayName}
                    </Text>
                    <View className="flex-1 items-end">
                      <TouchableOpacity
                        onPress={() => deleteExcludeCrop(crop.excludeId)}
                      >
                        <MaterialIcons
                          name="delete"
                          size={22}
                          color="#FF0000"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Add / Add More button */}
      <View className="absolute bottom-0 left-0 right-0 bg-white pt-4 pb-4 px-6 items-center">
        <TouchableOpacity
          className="w-full max-w-[500px] items-center"
          onPress={() =>
            navigation.navigate("ExcludeAddMore", {
              id: id,
              customerId: customerId,
              name: name,
              title: title,
            })
          }
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
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "bold" }}>
              {getButtonText()}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ExcludeItemEditSummery;
