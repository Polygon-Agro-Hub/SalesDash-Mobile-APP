import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView,Image } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import BackButton from '../components/BackButton'; 
import { LinearGradient } from 'expo-linear-gradient';

type RootStackParamList = {
  CratScreen: undefined;

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
      isCustomPackage:string;
       isSelectPackage:string;
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
  const { id ,isCustomPackage, isSelectPackage} = route.params || {};
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);


   useEffect(() => {
    if (route.params?.selectedProducts) {
      const initializedItems = route.params.selectedProducts.map(item => {
        // Parse startValue as number
        const startValueNum = typeof item.startValue === 'string' 
          ? parseFloat(item.startValue) 
          : item.startValue || 1;
          
        // Make sure unitType is lowercase to match component state
        const unitType = item.unitType?.toLowerCase() === 'g' ? 'g' : 'kg';
        
        return {
          ...item,
          selected: false,
          changeby: startValueNum, 
          quantity: startValueNum,
          unitType: unitType 
        };
      });
      setCartItems(initializedItems);
    }
  }, [route.params]);

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
    // First, delete the selected items
    setCartItems(cartItems.filter(item => !item.selected));
    
    // Automatically clear selection mode after deletion
    setIsSelectionMode(false);
  };

  const calculateItemTotal = (item: CartItem) => {
    if (item.unitType === 'kg') {
      return (item.discountedPrice * item.changeby).toFixed(2);
    } else {
      return ((item.discountedPrice / 1000) * item.changeby).toFixed(2);
    }
  };
  
  const calculateItemNormalTotal = (item: CartItem) => {
    if (item.unitType === 'kg') {
      return (item.normalPrice * item.changeby).toFixed(2);
    } else {
      return ((item.normalPrice / 1000) * item.changeby).toFixed(2);
    }
  };

  const changeUnit = (id: number, newUnit: 'kg' | 'g') => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id && item.unitType !== newUnit) {
          // Convert the value based on unit change
          let newValue;
          if (newUnit === 'kg') {
            // Converting from g to kg
            newValue = item.changeby / 1000;
          } else {
            // Converting from kg to g
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
          // Get base startValue in kg
          const baseIncrementAmount = typeof item.startValue === 'string' 
            ? parseFloat(item.startValue) 
            : item.startValue;
          
          // Adjust increment based on current unit type
          let incrementAmount = baseIncrementAmount;
          if (item.unitType === 'g') {
            // If in grams, the increment should be the kg value * 1000
            incrementAmount = baseIncrementAmount * 1000;
          }
            
          // Current quantity value
          const currentQuantity = typeof item.changeby === 'string' 
            ? parseFloat(item.changeby) 
            : item.changeby;
            
          // Add the adjusted increment to the current quantity
          const newValue = currentQuantity + incrementAmount;
          
          return { 
            ...item, 
            changeby: newValue, // Update the display value
            quantity: newValue  // Also update quantity
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
          // Get base startValue in kg
          const baseDecrementAmount = typeof item.startValue === 'string' 
            ? parseFloat(item.startValue) 
            : item.startValue;
          
          // Adjust decrement based on current unit type
          let decrementAmount = baseDecrementAmount;
          if (item.unitType === 'g') {
            // If in grams, the decrement should be the kg value * 1000
            decrementAmount = baseDecrementAmount * 1000;
          }
            
          // Current quantity value
          const currentQuantity = typeof item.changeby === 'string' 
            ? parseFloat(item.changeby) 
            : item.changeby;
          
          // Minimum value is adjusted based on unit type
          let minValue = baseDecrementAmount;
          if (item.unitType === 'g') {
            minValue = baseDecrementAmount * 1000;
          }
            
          // Subtract the adjusted decrement from current quantity, but not below minimum
          const newValue = Math.max(minValue, currentQuantity - decrementAmount);
          
          return { 
            ...item, 
            changeby: newValue, // Update the display value
            quantity: newValue  // Also update quantity 
          };
        }
        return item;
      })
    );
  };
  
  // Calculate totals including ALL items, regardless of selection state
  const currentSubtotal = cartItems.reduce((total, item) => {
    // Include all items in totals, even if selected
    return total + parseFloat(calculateItemNormalTotal(item));
  }, 0);
  
  const currentTotal = cartItems.reduce((total, item) => {
    // Include all items in totals, even if selected
    return total + parseFloat(calculateItemTotal(item));
  }, 0);

  const discount = currentSubtotal - currentTotal;

  const handleConfirm = () => {
    const nonSelectedItems = cartItems.filter(item => !item.selected);
    
    if (nonSelectedItems.length > 0) {
      const itemsToPass = nonSelectedItems.map(item => {
        const weightInKg = item.unitType === 'g' ? item.changeby / 1000 : item.changeby;
        
        return {
          id: item.id,
          name: item.name,
          price: item.price,
          normalPrice: item.normalPrice,
          discountedPrice: item.discountedPrice,
          quantity: weightInKg, 
          unitType: 'kg',     
          startValue: item.startValue,
          changeby: weightInKg, 
          isSelectPackage: isSelectPackage,
          isCustomPackage: isCustomPackage
        };
      });
  
      navigation.navigate('ScheduleScreen' as any, {
        items: itemsToPass,
        total: currentTotal,
        subtotal: currentSubtotal,
        discount: discount,
        id: id,
        isSelectPackage: isSelectPackage,
        isCustomPackage: isCustomPackage
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
              
              <View className="flex-row items-center mt-[-5%]">
                {/* <View className="flex-row mr-2  "
            
                >
                  <TouchableOpacity 
                    className={`px-2 py-1 rounded-md border  ${
                      item.unitType === 'kg' ? 'bg-purple-100 border-[#3E206D]' : 'bg-white border-[#A3A3A3]'
                    }`}
                    onPress={() => changeUnit(item.id, 'kg')}
                  >
                    <Text className={`text-xs ${
                      item.unitType === 'kg' ? 'text-purple-600' : 'text-gray-600'
                    }`}>kg</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className={`px-2 py-1 rounded-md border border-purple-200 ml-1 ${
                      item.unitType === 'g' ? 'bg-purple-100 border-[#3E206D]' : 'bg-white r-[#A3A3A3]'
                    }`}
                    onPress={() => changeUnit(item.id, 'g')}
                  >
                    <Text className={`text-xs ${
                      item.unitType === 'g' ? 'text-purple-600' : 'text-gray-600'
                    }`}>g</Text>
                  </TouchableOpacity>
                </View> */}
                <View className="flex-row mr-2 item-center justify-center  ">
      {/* KG Button */}
      <TouchableOpacity
        className={` w-8 h-8 rounded-md border shadow-xl items-center justify-center ${
          item.unitType === 'kg' 
            ? 'bg-purple-100 border-[#3E206D]' 
            : 'bg-white border-[#A3A3A3]'
        }`}
        style={{
          shadowColor: "#000",
    
      shadowOpacity: 0.5,
      shadowRadius: 10,
      elevation: 10, 
      
     
         //  borderBottomWidth: 2,
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
      
      {/* G Button */}
      <TouchableOpacity
        className={`w-8 h-8 rounded-md border ml-2 shadow-xl items-center  justify-center ${
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
                      source={require("../assets/images/minns.png")}
                      className="w-7 h-7"
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                  
                  <Text className="mx-2 text-base w-12 text-center">
                    {formatQuantity(item)}
                  </Text>
                  
                  <TouchableOpacity 
                    className="bg-gray-200 w-6 h-6 rounded-full justify-center items-center"
                    onPress={() => increaseQuantity(item.id)}
                  >
                    <Image
                      source={require("../assets/images/adddd.png")}
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

                 {currentSubtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
            
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-500">Discount</Text>
              <Text className="font-medium text-[#686868]">Rs.{discount.toFixed(2)}</Text>
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
              <Text className="text-white font-medium text-base">Confirm</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default CratScreen;