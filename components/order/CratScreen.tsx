import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BackButton from '../common/BackButton'; 
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import environment from "@/environment/environment";

type RootStackParamList = {
  CratScreen: undefined;
};

type CratScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CratScreen"
>;

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
    };
  };
}

const CratScreen: React.FC<CratScreenProps> = ({ navigation, route }) => {
  const { id, isPackage } = route.params || {};
  const fromOrderSummary = (route.params as any)?.fromOrderSummary;
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);


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
                  } else {
                    console.log("No data in API response, using existing values");
                  }
                } catch (error) {
                  console.error(`Error fetching changeby for item ${item.id}:`, error);

                }
              }

              const startValueNum = typeof startValue === 'string' 
                ? parseFloat(startValue) 
                : startValue || 0.5;
                
              const changebyNum = typeof changebyValue === 'string'
                ? parseFloat(changebyValue)
                : changebyValue || startValueNum;

              const unitType = item.unitType?.toLowerCase() === 'g' ? 'g' : 'kg';
              
              let initialQuantity;

              if (fromOrderSummary) {

                initialQuantity = typeof item.quantity === 'string'
                  ? parseFloat(item.quantity)
                  : (item.quantity || startValueNum);
              } else {
                initialQuantity = startValueNum;
              }

              if (unitType === 'g' && !fromOrderSummary) {
                initialQuantity *= 1000;
              }

              let pricePerKg, normalPricePerKg, discountPerKg;
              
              if (fromOrderSummary) {
                const quantityInKg = unitType === 'g' ? initialQuantity / 1000 : initialQuantity;
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

              const finalItem = {
                ...item,
                name: item.name || `Product ${item.id}`,
                price: pricePerKg,
                normalPrice: normalPricePerKg,
                discountedPrice: pricePerKg,
                discount: discountPerKg,
                selected: fromOrderSummary ? false : (item.selected || false),
                changeby: initialQuantity,
                quantity: initialQuantity,
                unitType: unitType,
                startValue: changebyNum,
                minValue: startValueNum 
              };
              
              return finalItem;
            })
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
    const hasSelectedItems = cartItems.some(item => item.selected);
    setIsSelectionMode(hasSelectedItems);
  }, [cartItems]);

  const toggleItemSelection = (id: number) => {
    setCartItems(
      cartItems.map(item => 
        item.id === id 
          ? { ...item, selected: !item.selected } 
          : item
      )
    );
  };

  const deleteSelectedItems = () => {
    setCartItems(cartItems.filter(item => !item.selected));
    setIsSelectionMode(false);
  };

  const calculateItemTotal = (item: CartItem) => {
    if (item.unitType === 'kg') {
      return (item.discountedPrice * item.changeby).toFixed(2);
    } else {
      return (item.discountedPrice * (item.changeby / 1000)).toFixed(2);
    }
  };

  const calculateItemNormalTotal = (item: CartItem) => {
    if (item.unitType === 'kg') {
      return (item.normalPrice * item.changeby).toFixed(2);
    } else {
      return (item.normalPrice * (item.changeby / 1000)).toFixed(2);
    }
  };

  const changeUnit = (id: number, newUnit: 'kg' | 'g') => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id && item.unitType !== newUnit) {
          let newValue;
          if (newUnit === 'kg') {
            newValue = item.changeby / 1000;
          } else {
            newValue = item.changeby * 1000;
          }
          
          return { 
            ...item, 
            unitType: newUnit,
            changeby: newValue,
            quantity: newValue
          };
        }
        return item;
      })
    );
  };
  
  const increaseQuantity = (id: number) => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          let incrementAmount = item.startValue;
          if (item.unitType === 'g') {
            incrementAmount = item.startValue * 1000;
          }
          
          const newValue = item.changeby + incrementAmount;
          
          return { 
            ...item, 
            changeby: newValue,
            quantity: newValue
          };
        }
        return item;
      })
    );
  };
  
   const decreaseQuantity = (id: number) => {
  setCartItems(
    cartItems.map(item => {
      if (item.id === id) {
        // Use startValue as the decrement step (same as increment)
        let decrementAmount = item.startValue;
        if (item.unitType === 'g') {
          // If unit is grams, convert startValue to grams
          decrementAmount = item.startValue * 1000;
        }
        
        // Use minValue (startValue) as the minimum allowed quantity
        let minValue = item.minValue;
        if (item.unitType === 'g') {
          // If unit is grams, convert minValue to grams
          minValue = item.minValue * 1000;
        }
        
        // Ensure quantity doesn't go below minimum
        const newValue = Math.max(minValue, item.changeby - decrementAmount);
        
        
        return { 
          ...item, 
          changeby: newValue,
          quantity: newValue
        };
      }
      return item;
    })
  );
};

  const currentSubtotal = cartItems.reduce((total, item) => {
    return total + parseFloat(calculateItemNormalTotal(item));
  }, 0);
  
  const currentTotal = cartItems.reduce((total, item) => {
    return total + parseFloat(calculateItemTotal(item));
  }, 0) + 180;

  const discount = currentSubtotal - (currentTotal - 180);

  const handleConfirm = () => {
    const nonSelectedItems = cartItems.filter(item => !item.selected);
    
    if (nonSelectedItems.length > 0) {
      const itemsToPass = nonSelectedItems.map(item => {
        const weightInKg = item.unitType === 'g' ? item.changeby / 1000 : item.changeby;
        
        return {
          id: item.id,
          name: item.name,
          price: item.discountedPrice * weightInKg,
          discount: item.discount * weightInKg,
          qty: weightInKg,
          unitType: 'kg',
          isPackage: isPackage,
        };
      });

      const navigationTarget = (route.params as any)?.returnTo || (fromOrderSummary ? 'OrderSummaryScreen' : 'ScheduleScreen');
      
      if (navigationTarget === 'ScheduleScreen') {
        navigation.navigate('ScheduleScreen' as any, {
          items: itemsToPass,
          total: currentTotal,
          subtotal: currentSubtotal,
          discount: discount,
          id: id,
          isPackage: isPackage,
          selectedDate: route.params?.selectedDate,
          timeDisplay: route.params?.timeDisplay,
          selectedTimeSlot: route.params?.selectedTimeSlot,
          paymentMethod: route.params?.paymentMethod,
          fullTotal: route.params?.fullTotal,
          customerId: route.params?.customerId
        });
      } else {
        navigation.navigate('ScheduleScreen' as any, {
          items: itemsToPass,
          total: currentTotal,
          subtotal: currentSubtotal,
          discount: discount,
          id: id,
          isPackage: isPackage
        });
      }
    } else {
      alert("Please add at least one item to your cart");
    }
  };

  const formatQuantity = (item: CartItem) => {
    return item.changeby.toFixed(2);
  };

  // Loading Screen
  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <View className="flex-row items-center px-4">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-medium text-[#6C3CD1] flex-1 text-center mr-10">
            {fromOrderSummary ? 'Edit Cart' : 'Custom Cart'}
          </Text>
        </View>
        
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#6839CF" />
          <Text className="mt-4 text-gray-600 text-base">Loading your cart...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 px-4 bg-white">
      <View className="flex-row items-center">
        <BackButton navigation={navigation} />
        <Text className="text-lg font-medium text-[#6C3CD1] flex-1 text-center mr-10">
          {fromOrderSummary ? 'Edit Cart' : 'Custom Cart'}
        </Text>
        {isSelectionMode && (
          <TouchableOpacity 
            onPress={deleteSelectedItems}
            className="absolute right-0"
          >
            <Ionicons name="trash-outline" size={24} color="#FF2C2C" />
          </TouchableOpacity>
        )}
      </View>
      
      <ScrollView className="flex-1 mt-4" showsVerticalScrollIndicator={false}>
        {cartItems.map((item) => (
          <View key={item.id} className="flex-row items-center py-4 border-b border-gray-200">
            <TouchableOpacity 
              onPress={() => toggleItemSelection(item.id)}
              className="mr-4"
            >
              <View className={`w-5 h-5 rounded-sm border ${
                item.selected ? 'bg-black border-black' : 'border-gray-400'
              } justify-center items-center`}>
                {item.selected && (
                  <Ionicons name="checkmark" size={14} color="white" />
                )}
              </View>
            </TouchableOpacity>
            
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-800">{item.name}</Text>
              {/* <Text className="text-sm text-gray-600">
                Rs.{item.discountedPrice.toFixed(2)} per kg
              </Text> */}
              <Text className="text-sm text-gray-600">
  Rs.{item.discountedPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per kg
</Text>
            </View>
            
            <View className="flex-row items-center mt-[-5%]">
              <View className="flex-row mr-2 item-center justify-center">
                <TouchableOpacity
                  className={`w-8 h-8 rounded-md border shadow-xl items-center justify-center ${
                    item.unitType === 'kg' 
                      ? 'bg-purple-100 border-[#3E206D]' 
                      : 'bg-white border-[#A3A3A3]'
                  }`}
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                  onPress={() => changeUnit(item.id, 'kg')}
                >
                  <Text 
                    className={`text-base mt-[-3] ${
                      item.unitType === 'kg' ? 'text-purple-600' : 'text-gray-600'
                    }`}
                  >
                    kg
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className={`w-8 h-8 rounded-md border ml-2 shadow-xl items-center justify-center ${
                    item.unitType === 'g' 
                      ? 'bg-purple-100 border-[#3E206D]' 
                      : 'bg-white border-[#A3A3A3]'
                  }`}
                  style={{
                    shadowColor: "#000",
                    shadowOpacity: 0.5,
                    shadowRadius: 10,
                    elevation: 10,
                  }}
                  onPress={() => changeUnit(item.id, 'g')}
                >
                  <Text 
                    className={`text-base mt-[-5] ${
                      item.unitType === 'g' ? 'text-purple-600' : 'text-gray-600'
                    }`}
                  >
                    g
                  </Text>
                </TouchableOpacity>
              </View>
              
              <View className="flex-row items-center">
                <TouchableOpacity 
                  className="bg-gray-200 w-6 h-6 rounded-full justify-center items-center"
                  onPress={() => decreaseQuantity(item.id)}
                >
                  <Image
                    source={require("../../assets/images/minns.webp")}
                    className="w-7 h-7"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
                
                <Text className="mx-2 text-sm w-14 text-center">
                  {formatQuantity(item)}
                </Text>
                
                <TouchableOpacity 
                  className="bg-gray-200 w-6 h-6 rounded-full justify-center items-center"
                  onPress={() => increaseQuantity(item.id)}
                >
                  <Image
                    source={require("../../assets/images/adddd.webp")}
                    className="w-7 h-7"
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
        
        <View className="py-4 border-t border-gray-200">
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-medium">Rs.
              {currentSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Discount</Text>
            {/* <Text className="font-medium text-[#686868]">Rs.{discount.toFixed(2)}</Text> */}
            <Text className="font-medium text-[#686868]">
  Rs.{discount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
</Text>
          </View>

          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Service Fee</Text>
            <Text className="font-medium text-[#686868]">Rs.180.00</Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="font-semibold">Total</Text>
            <Text className="font-bold">Rs.
              {currentTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>
        <View className="py-4 border-t border-gray-200"></View>
      </ScrollView>
     
      <View className="py-4 px-6">
        <TouchableOpacity onPress={handleConfirm}>
          <LinearGradient
            colors={["#6839CF", "#874DDB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="py-3 rounded-full items-center"
          >
            <Text className="text-white font-medium text-base">
              {fromOrderSummary ? 'Update Cart' : 'Confirm'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CratScreen;