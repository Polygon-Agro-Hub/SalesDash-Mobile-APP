import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Alert,
} from "react-native";
import { FontAwesome6, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";
import CustomHeader from "../common/CustomHeader";
import LoadingPage from "../common/LoadingPage";

interface CartItem {
  id: number;
  name: string;
  price: number;
  normalPrice: number;
  discountedPrice: number;
  discount: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
  minValue: number;
}

interface CratScreenProps {
  navigation: any;
  route: {
    params?: {
      id?: string;
      customerId?: any;
      number: string;
      isPackage?: number | string;
      selectedProducts?: any[];
      items?: any[];
      fromOrderSummary?: boolean;
      subtotal?: number;
      discount?: number;
      total?: number;
      fullTotal?: number;
      selectedDate?: string;
      timeDisplay?: string;
      selectedTimeSlot?: string;
      paymentMethod?: string;
      title: string;
      name: string;
      customerscreencustomerid: string;
    };
  };
}

const CratScreen: React.FC<CratScreenProps> = ({ navigation, route }) => {
  const {
    id,
    isPackage,
    customerId,
    title,
    name,
    number,
    customerscreencustomerid,
  } = route.params || {};
  const fromOrderSummary = (route.params as any)?.fromOrderSummary;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const roundToTwoDecimals = (value: number): number => {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  };

  useFocusEffect(
    useCallback(() => {
      setCartItems((prevItems) =>
        prevItems.map((item) => ({ ...item, selected: false })),
      );
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("CreateCustomPackage" as any, {
          id,
          isPackage,
          selectedProductIds: cartItems.map((item) => item.id),
          customerId,
          title,
          name,
          number,
          customerscreencustomerid,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, cartItems]),
  );

  useEffect(() => {
    const initializeCartItems = async () => {
      if (route.params?.selectedProducts) {
        setIsLoading(true);
        try {
          const initializedItems = await Promise.all(
            route.params.selectedProducts.map(async (item) => {
              let changebyValue = item.changeby;
              let startValue = item.startValue;

              const needsApiFetch = true;

              if (needsApiFetch) {
                try {
                  const storedToken = await AsyncStorage.getItem("authToken");
                  const apiUrl = `${environment.API_BASE_URL}api/packages/getChnageby/${item.id}`;
                  const response = await axios.get(apiUrl, {
                    headers: { Authorization: `Bearer ${storedToken}` },
                  });
                  if (response.data.data) {
                    changebyValue = response.data.data.changeby;
                    startValue = response.data.data.startValue;
                  }
                } catch (error) {
                  console.error(
                    `Error fetching changeby for item ${item.id}:`,
                    error,
                  );
                }
              }

              const startValueNum =
                typeof startValue === "string"
                  ? parseFloat(startValue)
                  : startValue || 0.5;

              const changebyNum =
                typeof changebyValue === "string"
                  ? parseFloat(changebyValue)
                  : changebyValue || startValueNum;

              const unitType =
                item.unitType?.toLowerCase() === "g" ? "g" : "kg";

              let initialQuantity;
              if (fromOrderSummary) {
                initialQuantity =
                  typeof item.quantity === "string"
                    ? parseFloat(item.quantity)
                    : item.quantity || startValueNum;
              } else {
                initialQuantity = startValueNum;
              }

              if (unitType === "g" && !fromOrderSummary) {
                initialQuantity *= 1000;
              }

              let pricePerKg, normalPricePerKg, discountPerKg;

              if (fromOrderSummary) {
                const quantityInKg =
                  unitType === "g" ? initialQuantity / 1000 : initialQuantity;
                if (quantityInKg > 0) {
                  pricePerKg = item.discountedPrice / quantityInKg;
                  normalPricePerKg = item.normalPrice / quantityInKg;
                  discountPerKg = item.discount / quantityInKg;
                } else {
                  pricePerKg = item.discountedPrice;
                  normalPricePerKg = item.normalPrice;
                  discountPerKg = item.discount;
                }
              } else {
                pricePerKg = item.discountedPrice;
                normalPricePerKg = item.normalPrice;
                discountPerKg = item.discount;
              }

              return {
                ...item,
                name: item.name || `Product ${item.id}`,
                price: pricePerKg,
                normalPrice: normalPricePerKg,
                discountedPrice: pricePerKg,
                discount: discountPerKg,
                selected: fromOrderSummary ? false : item.selected || false,
                changeby: initialQuantity,
                quantity: initialQuantity,
                unitType: unitType,
                startValue: changebyNum,
                minValue: startValueNum,
              };
            }),
          );

          setCartItems(initializedItems);
        } catch (error) {
          console.error("Error initializing cart items:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    initializeCartItems();
  }, [route.params, fromOrderSummary]);

  useEffect(() => {
    const hasSelectedItems = cartItems.some((item) => item.selected);
    setIsSelectionMode(hasSelectedItems);
  }, [cartItems]);

  const toggleItemSelection = (id: number) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const deleteSelectedItems = () => {
    setCartItems(cartItems.filter((item) => !item.selected));
    setIsSelectionMode(false);
  };

  const calculateItemTotal = (item: CartItem) => {
    let total;
    if (item.unitType === "kg") {
      total = item.discountedPrice * item.changeby;
    } else {
      total = item.discountedPrice * (item.changeby / 1000);
    }
    return roundToTwoDecimals(total);
  };

  const calculateItemNormalTotal = (item: CartItem) => {
    let total;
    if (item.unitType === "kg") {
      total = item.normalPrice * item.changeby;
    } else {
      total = item.normalPrice * (item.changeby / 1000);
    }
    return roundToTwoDecimals(total);
  };

  const changeUnit = (id: number, newUnit: "kg" | "g") => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id && item.unitType !== newUnit) {
          const newValue =
            newUnit === "kg" ? item.changeby / 1000 : item.changeby * 1000;
          return {
            ...item,
            unitType: newUnit,
            changeby: newValue,
            quantity: newValue,
          };
        }
        return item;
      }),
    );
  };

  const increaseQuantity = (id: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          const incrementAmount =
            item.unitType === "g" ? item.startValue * 1000 : item.startValue;
          const newValue = item.changeby + incrementAmount;
          return { ...item, changeby: newValue, quantity: newValue };
        }
        return item;
      }),
    );
  };

  const decreaseQuantity = (id: number) => {
    setCartItems(
      cartItems.map((item) => {
        if (item.id === id) {
          const decrementAmount =
            item.unitType === "g" ? item.startValue * 1000 : item.startValue;
          const minValue =
            item.unitType === "g" ? item.minValue * 1000 : item.minValue;
          const newValue = Math.max(minValue, item.changeby - decrementAmount);
          return { ...item, changeby: newValue, quantity: newValue };
        }
        return item;
      }),
    );
  };

  const currentSubtotal = cartItems.reduce((total, item) => {
    return roundToTwoDecimals(total + calculateItemNormalTotal(item));
  }, 0);

  const totalDiscountedValue = cartItems.reduce((total, item) => {
    return roundToTwoDecimals(total + calculateItemTotal(item));
  }, 0);

  const discount = cartItems.reduce((total, item) => {
    const weightInKg =
      item.unitType === "g" ? item.changeby / 1000 : item.changeby;
    const itemDiscount = roundToTwoDecimals(item.discount * weightInKg);
    return roundToTwoDecimals(total + itemDiscount);
  }, 0);

  const SERVICE_FEE = 180;
  const fullTotal = roundToTwoDecimals(totalDiscountedValue + SERVICE_FEE);

  const handleConfirm = () => {
    const hasSelectedItems = cartItems.some((item) => item.selected);
    if (hasSelectedItems) {
      Alert.alert(
        "Action Required",
        "You have selected an item that cannot be processed. To continue, please either remove the item from the cart or uncheck it.",
        [{ text: "OK", onPress: () => {} }],
        { cancelable: false },
      );
      return;
    }

    const nonSelectedItems = cartItems.filter((item) => !item.selected);

    if (nonSelectedItems.length > 0) {
      const itemsToPass = nonSelectedItems.map((item) => {
        const weightInKg =
          item.unitType === "g" ? item.changeby / 1000 : item.changeby;
        return {
          id: item.id,
          name: item.name,
          price: roundToTwoDecimals(item.discountedPrice * weightInKg),
          discount: roundToTwoDecimals(item.discount * weightInKg),
          qty: weightInKg,
          unitType: item.unitType,
          isPackage: isPackage,
        };
      });

      const navigationTarget =
        (route.params as any)?.returnTo ||
        (fromOrderSummary ? "OrderSummaryScreen" : "ScheduleScreen");

      if (navigationTarget === "ScheduleScreen") {
        navigation.navigate("ScheduleScreen" as any, {
          items: itemsToPass,
          total: fullTotal,
          subtotal: currentSubtotal,
          discount: discount,
          customerscreencustomerid,
          number: number,
          id: id,
          isPackage: isPackage,
          selectedDate: route.params?.selectedDate,
          timeDisplay: route.params?.timeDisplay,
          selectedTimeSlot: route.params?.selectedTimeSlot,
          paymentMethod: route.params?.paymentMethod,
          fullTotal: route.params?.fullTotal,
          customerId: route.params?.customerId,
          title,
          name,
        });
      } else {
        navigation.navigate("ScheduleScreen" as any, {
          items: itemsToPass,
          total: fullTotal,
          subtotal: currentSubtotal,
          discount: discount,
          id: id,
          isPackage: isPackage,
          customerId,
          title,
          name,
          number,
          customerscreencustomerid,
        });
      }
    } else {
      alert("Please add at least one item to your cart");
    }
  };

  const formatQuantity = (item: CartItem) => {
    return item.changeby.toFixed(2);
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  if (isLoading) {
    return <LoadingPage message="Loading Your Cart..." fullScreen={true} />;
  }

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title={fromOrderSummary ? "Edit Cart" : "Custom Cart"}
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() => {
          navigation.navigate("CreateCustomPackage" as any, {
            id,
            isPackage,
            selectedProductIds: cartItems.map((item) => item.id),
            customerId,
            title,
            name,
            number,
            customerscreencustomerid,
          });
        }}
        rightComponent={
          <View className="flex-row items-center">
            {isSelectionMode && (
              <TouchableOpacity
                onPress={deleteSelectedItems}
                className="absolute right-0"
              >
                <Ionicons name="trash-outline" size={24} color="#FF2C2C" />
              </TouchableOpacity>
            )}
          </View>
        }
      />

      <ScrollView
        className="flex-1 mt-4 mx-6"
        showsVerticalScrollIndicator={false}
      >
        {cartItems.map((item) => (
          <View
            key={item.id}
            className="flex-row items-start py-4 border-b border-gray-200"
          >
            <TouchableOpacity
              onPress={() => toggleItemSelection(item.id)}
              className="mr-2 mt-[5%]"
            >
              <View
                className={`w-5 h-5 rounded-sm border ${
                  item.selected ? "bg-black border-black" : "border-gray-400"
                } justify-center items-center`}
              >
                {item.selected && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
            </TouchableOpacity>

            <View className="flex-1">
              <Text className="font-medium text-gray-800 ">{item.name}</Text>

              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-xs text-gray-600">
                  Rs. {formatPrice(item.discountedPrice)}
                  {"\n"}(per kg)
                </Text>

                <View className="flex-row items-center ">
                  <View className="flex-row mr-2 items-center">
                    <TouchableOpacity
                      className={`w-6 h-6 rounded-md border shadow-xl items-center  justify-center ${
                        item.unitType === "kg"
                          ? "bg-purple-100 border-[#3E206D]"
                          : "bg-white border-[#A3A3A3]"
                      }`}
                      style={{
                        shadowColor: "#000",
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 10,
                      }}
                      onPress={() => changeUnit(item.id, "kg")}
                    >
                      <Text
                        className={`text-xs mt-[-3] ${
                          item.unitType === "kg"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        kg
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className={`w-6 h-6 rounded-md border ml-2 shadow-xl items-center justify-center ${
                        item.unitType === "g"
                          ? "bg-purple-100 border-[#3E206D]"
                          : "bg-white border-[#A3A3A3]"
                      }`}
                      style={{
                        shadowColor: "#000",
                        shadowOpacity: 0.5,
                        shadowRadius: 10,
                        elevation: 10,
                      }}
                      onPress={() => changeUnit(item.id, "g")}
                    >
                      <Text
                        className={`text-xs mt-[-5] ${
                          item.unitType === "g"
                            ? "text-purple-600"
                            : "text-gray-600"
                        }`}
                      >
                        g
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => decreaseQuantity(item.id)}>
                      <FontAwesome6
                        name="circle-minus"
                        size={20}
                        color="#5D5D5D"
                      />
                    </TouchableOpacity>

                    <Text className="mx-2 text-xs w-14 text-center">
                      {formatQuantity(item)}
                    </Text>

                    <TouchableOpacity onPress={() => increaseQuantity(item.id)}>
                      <Ionicons name="add-circle" size={24} color="#5D5D5D" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/*Summary Section*/}
        <View className="py-4 border-t border-gray-200">
          <View className="flex-row justify-between py-2">
            <Text className="text-[#8492A3]">Subtotal (Without Discount)</Text>
            <Text className="font-bold text-[#CA0000]">
              Rs. {formatPrice(currentSubtotal)}
            </Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className="text-[#8492A3]">Discount</Text>
            <Text className="font-medium text-[#686868]">
              - Rs. {formatPrice(discount)}
            </Text>
          </View>
        </View>

        <View className="border-t border-gray-200" />

        <View className="py-4">
          <View className="flex-row justify-between py-2">
            <Text className="text-[#8492A3]">Total (Discounted Value)</Text>
            <Text className="font-bold text-[#3E206D]">
              Rs. {formatPrice(totalDiscountedValue)}
            </Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className="text-[#8492A3]">Service Fee</Text>
            <Text className="font-medium text-[#686868]">
              + Rs. {SERVICE_FEE.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View className="border-t border-gray-200" />

        {/* Full Total – large bold */}
        <View className="flex-row justify-between py-5">
          <Text className="font-semibold text-base text-[#414347]">
            Full Total
          </Text>
          <Text className="font-bold text-xl text-[#212121]">
            Rs. {formatPrice(fullTotal)}
          </Text>
        </View>

        <View className="py-4" />
      </ScrollView>

      <View className="py-4 px-[15%]">
        <View
          style={{
            borderRadius: 30,
            shadowColor: "#000",
            shadowOpacity: 0.25,
            shadowOffset: { width: 0, height: 6 },
            shadowRadius: 8,
            elevation: 10,
          }}
        >
          <TouchableOpacity onPress={handleConfirm} activeOpacity={0.8}>
            <LinearGradient
              colors={["#6839CF", "#874DDB"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                paddingVertical: 12,
                borderRadius: 30,
                alignItems: "center",
              }}
            >
              <Text
                style={{ color: "#FFFFFF", fontWeight: "500", fontSize: 16 }}
              >
                {fromOrderSummary ? "Update Cart" : "Confirm"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default CratScreen;
