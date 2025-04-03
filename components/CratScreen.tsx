// import React, { useState, useEffect } from "react";
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   SafeAreaView
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { StackNavigationProp } from "@react-navigation/stack";
// import { RootStackParamList } from "./types";
// import { useTranslation } from "react-i18next";
// import BackButton from "./BackButton";

// type CratScreenNavigationProp = StackNavigationProp<
//   RootStackParamList,
//   "CratScreen"
// >;

// interface CratScreenProps {
//   navigation: CratScreenNavigationProp;
// }

// interface CartItem {
//   id: number;
//   name: string;
//   price: number;
//   quantity: number;
//   selected: boolean;
// }

// const CratScreen: React.FC<CratScreenProps> = ({ navigation }) => {
//   const { t } = useTranslation();
//   const [cartItems, setCartItems] = useState<CartItem[]>([
//     { id: 1, name: "Pumpkin", price: 298.00, quantity: 0.5, selected: true },
//     { id: 2, name: "Red Onion", price: 400.00, quantity: 0.5, selected: false },
//   ]);

//   const toggleItemSelection = (id: number) => {
//     setCartItems(
//       cartItems.map(item => 
//         item.id === id 
//           ? { ...item, selected: !item.selected } 
//           : item
//       )
//     );
//   };

//   const increaseQuantity = (id: number) => {
//     setCartItems(
//       cartItems.map(item => 
//         item.id === id 
//           ? { ...item, quantity: parseFloat((item.quantity + 0.5).toFixed(1)) } 
//           : item
//       )
//     );
//   };

//   const decreaseQuantity = (id: number) => {
//     setCartItems(
//       cartItems.map(item => 
//         item.id === id && item.quantity > 0.5
//           ? { ...item, quantity: parseFloat((item.quantity - 0.5).toFixed(1)) } 
//           : item
//       )
//     );
//   };

//   // Calculate totals
//   const subtotal = cartItems.reduce((total, item) => {
//     if (item.selected) {
//       return total + (item.price * item.quantity);
//     }
//     return total;
//   }, 0);
  
//   const discount = 70.00;
//   const total = subtotal - discount;

//   const handleConfirm = () => {
//     const selectedItems = cartItems.filter(item => item.selected);
//     if (selectedItems.length > 0) {
//       // Navigate to confirmation page or process order
//       alert("Order confirmed!");
//     } else {
//       alert("Please select at least one item");
//     }
//   };

//   return (
//     <SafeAreaView className="flex-1 bg-white">
//       <View className="flex-1 px-4">
//         {/* Header with back button and title */}
//         <View className="flex-row items-center justify-between ">
//         <View className="flex-row items-center h-16 shadow-md  bg-white">
//         <BackButton navigation={navigation} />
//         <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-7 ml-12">Custom Cart</Text>
//       </View>

//           <TouchableOpacity>
//             <Ionicons name="trash-outline" size={22} color="#f00" />
//           </TouchableOpacity>
//         </View>

//         {/* Cart Items */}
//         <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
//           {cartItems.map((item) => (
//             <View key={item.id} className="flex-row items-center py-3 border-b border-gray-100">
//               <TouchableOpacity 
//                 onPress={() => toggleItemSelection(item.id)}
//                 className="mr-3"
//               >
//                 <View className={`w-6 h-6 rounded border ${item.selected ? 'bg-black border-black' : 'border-gray-400'} justify-center items-center`}>
//                   {item.selected && (
//                     <Ionicons name="checkmark" size={16} color="white" />
//                   )}
//                 </View>
//               </TouchableOpacity>
              
//               <View className="flex-1">
//                 <Text className="text-base font-medium text-gray-800">{item.name}</Text>
//                 <Text className="text-sm text-gray-600">Rs.{item.price.toFixed(2)} /per kg</Text>
//               </View>
              
//               <View className="flex-row items-center">
//                 <View className="flex-row items-center bg-purple-100 rounded-lg border border-purple-200 mr-3">
//                   <Text className="px-2 py-1 text-purple-700">kg</Text>
//                   <View className="border-l border-purple-200 px-2 py-1">
//                     <Text className="text-purple-700">{item.quantity}</Text>
//                   </View>
//                 </View>
                
//                 <TouchableOpacity 
//                   onPress={() => decreaseQuantity(item.id)}
//                   className="w-6 h-6 bg-gray-200 rounded-full justify-center items-center mr-2"
//                 >
//                   <Ionicons name="remove" size={18} color="#333" />
//                 </TouchableOpacity>
                
//                 <Text className="w-8 text-center">{item.quantity}</Text>
                
//                 <TouchableOpacity 
//                   onPress={() => increaseQuantity(item.id)}
//                   className="w-6 h-6 bg-gray-200 rounded-full justify-center items-center ml-2"
//                 >
//                   <Ionicons name="add" size={18} color="#333" />
//                 </TouchableOpacity>
//               </View>
//             </View>
//           ))}
//         </ScrollView>
        
//         {/* Order Summary */}
//         <View className="py-4 border-t border-gray-200">
//           <View className="flex-row justify-between py-2">
//             <Text className="text-gray-500">Subtotal</Text>
//             <Text className="font-medium">Rs.{subtotal.toFixed(2)}</Text>
//           </View>
          
//           <View className="flex-row justify-between py-2">
//             <Text className="text-gray-500">Discount</Text>
//             <Text className="font-medium">Rs.{discount.toFixed(2)}</Text>
//           </View>
          
//           <View className="flex-row justify-between py-2">
//             <Text className="font-medium text-black">Total</Text>
//             <Text className="font-bold text-black">Rs.{total.toFixed(2)}</Text>
//           </View>
//         </View>
        
//         {/* Confirm Button */}
//         <View className="py-4">
//           <TouchableOpacity
//             className="bg-purple-600 py-3 rounded-full items-center"
//             onPress={handleConfirm}
//           >
//             <Text className="text-white font-medium text-base">Confirm</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     </SafeAreaView>
//   );
// };

// export default CratScreen;

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton'; // Assuming you have this component
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  CratScreen: undefined;
  // Add other screens as needed
};

type CratScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "CratScreen"
>;

interface CratScreenProps {
  navigation: CratScreenNavigationProp;
  route: {
    params: {
      id:string
      selectedProducts: Array<{
        id: number;
        name: string;
        price: number;
        normalPrice: number;
        discountedPrice: number;
        quantity: number;
        selected: boolean;
        unitType: string;
        startValue: number;
        changeby: number;
      }>;
      
    };
  };
}

interface CartItem {
  id: number;
  name: string;
  price: number;
  normalPrice: number;
  discountedPrice: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
}

const CratScreen: React.FC<CratScreenProps> = ({ navigation, route }) => {
  const { id } = route.params || {};
  const { t } = useTranslation();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    if (route.params?.selectedProducts) {
      const initializedItems = route.params.selectedProducts.map(item => ({
        ...item,
        selected: false,
        changeby: 1, // Default to 1 kg
        quantity: 1,
        unitType: 'kg' // Track the display unit separately
      }));
      setCartItems(initializedItems);
    }
  }, [route.params]);

  useEffect(() => {
    const hasSelectedItems = cartItems.some(item => item.selected);
    setIsSelectionMode(hasSelectedItems);
  }, [cartItems]);


  console.log("oooo",id)

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
  };

  const calculateItemTotal = (item: CartItem) => {
    if (item.unitType === 'kg') {
      return (item.discountedPrice * item.changeby).toFixed(2);
    } else {
      // For grams, convert kg price to grams (price per gram * quantity)
      return ((item.discountedPrice / 1000) * item.changeby).toFixed(2);
    }
  };
  
  const calculateItemNormalTotal = (item: CartItem) => {
    if (item.unitType === 'kg') {
      return (item.normalPrice * item.changeby).toFixed(2);
    } else {
      // For grams, convert kg price to grams
      return ((item.normalPrice / 1000) * item.changeby).toFixed(2);
    }
  };

  const changeUnit = (id: number, newUnit: 'kg' | 'g') => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id && item.unitType !== newUnit) {
          // Convert the value when changing units (1kg = 1000g)
          const newValue = newUnit === 'kg' ? item.changeby / 1000 : item.changeby * 1000;
          
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

  const updateQuantity = (id: number, newValue: number) => {
    setCartItems(
      cartItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              changeby: newValue,
              quantity: newValue
            } 
          : item
      )
    );
  };

  const increaseQuantity = (id: number) => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          const increment = item.unitType === 'g' ? 50 : 0.5;
          const newValue = item.changeby + increment;
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
          const decrement = item.unitType === 'g' ? 50 : 0.5;
          const minValue = item.unitType === 'g' ? 50 : 0.5;
          const newValue = Math.max(minValue, item.changeby - decrement);
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
    if (!item.selected) {
      return total + parseFloat(calculateItemNormalTotal(item));
    }
    return total;
  }, 0);
  
  const currentTotal = cartItems.reduce((total, item) => {
    if (!item.selected) {
      return total + parseFloat(calculateItemTotal(item));
    }
    return total;
  }, 0);

  const discount = currentSubtotal - currentTotal;

  const handleConfirm = () => {
    const nonSelectedItems = cartItems.filter(item => !item.selected);
    
    if (nonSelectedItems.length > 0) {
      const itemsToPass = nonSelectedItems.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        normalPrice: item.normalPrice,
        discountedPrice: item.discountedPrice,
        quantity: item.quantity,
        selected: item.selected,
        unitType: item.unitType,  // Removed the duplicate property
        startValue: item.startValue,
        changeby: item.changeby
      }));
  
      navigation.navigate('ScheduleScreen' as any, {
        items: itemsToPass,
        total: currentTotal,
        subtotal: currentSubtotal,
        discount: discount,
        id:id,
      });
    } else {
      alert("Please add at least one item to your cart");
    }
  };

  const formatQuantity = (item: CartItem) => {
    if (item.unitType === 'kg') {
      return item.changeby % 1 === 0 ? item.changeby.toFixed(0) : item.changeby.toFixed(1);
    }
    return item.changeby.toFixed(0);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-4">
        <View className="flex-row items-center">
          <BackButton navigation={navigation} />
          <Text className="text-lg font-medium text-[#6C3CD1] flex-1 text-center mr-10">
            Custom Cart
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
                <Text className="text-sm text-gray-600">
                  Rs.{item.price.toFixed(2)} per kg
                </Text>
              </View>
              
              <View className="flex-row items-center">
              <View className="flex-row mr-2">
          <TouchableOpacity 
            className={`px-2 py-1 rounded-md border border-purple-200 ${
              item.unitType === 'kg' ? 'bg-purple-100' : 'bg-white'
            }`}
            onPress={() => changeUnit(item.id, 'kg')}
          >
            <Text className={`text-xs ${
              item.unitType === 'kg' ? 'text-purple-600' : 'text-gray-600'
            }`}>kg</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`px-2 py-1 rounded-md border border-purple-200 ml-1 ${
              item.unitType === 'g' ? 'bg-purple-100' : 'bg-white'
            }`}
            onPress={() => changeUnit(item.id, 'g')}
          >
            <Text className={`text-xs ${
              item.unitType === 'g' ? 'text-purple-600' : 'text-gray-600'
            }`}>g</Text>
          </TouchableOpacity>
        </View>
                <View className="flex-row items-center">
          <TouchableOpacity 
            className="bg-gray-200 w-6 h-6 rounded-full justify-center items-center"
            onPress={() => decreaseQuantity(item.id)}
          >
            <Ionicons name="remove" size={16} color="#333" />
          </TouchableOpacity>
          
          <Text className="mx-2 text-base w-12 text-center">
            {formatQuantity(item)}
          </Text>
          
          <TouchableOpacity 
            className="bg-gray-200 w-6 h-6 rounded-full justify-center items-center"
            onPress={() => increaseQuantity(item.id)}
          >
            <Ionicons name="add" size={16} color="#333" />
          </TouchableOpacity>
        </View>
              </View>
            </View>
          ))}
        </ScrollView>
        
        <View className="py-4 border-t border-gray-200">
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-medium">Rs.{currentSubtotal.toFixed(2)}</Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Discount</Text>
            <Text className="font-medium">Rs.{discount.toFixed(2)}</Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="font-semibold">Total</Text>
            <Text className="font-bold">Rs.{currentTotal.toFixed(2)}</Text>
          </View>
        </View>
        
        <View className="py-4 px-6">
          <TouchableOpacity
            onPress={handleConfirm}
          >
            <LinearGradient
                colors={["#6839CF", "#874DDB"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="py-3 rounded-full items-center"
              >
            <Text className="text-white font-medium text-base">Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CratScreen;