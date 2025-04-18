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
      const initializedItems = route.params.selectedProducts.map(item => ({
        ...item,
        selected: false,
        changeby: 1, 
        quantity: 1,
        unitType: 'kg' 
      }));
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
    setCartItems(cartItems.filter(item => !item.selected));
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

 

  // const increaseQuantity = (id: number) => {
  //   setCartItems(
  //     cartItems.map(item => {
  //       if (item.id === id) {
  //         const increment = item.unitType === 'g' ? 50 : 0.5;
  //         const newValue = item.changeby + increment;
  //         return { 
  //           ...item, 
  //           changeby: newValue,
  //           quantity: newValue
  //         };
  //       }
  //       return item;
  //     })
  //   );
  // };

  // const decreaseQuantity = (id: number) => {
  //   setCartItems(
  //     cartItems.map(item => {
  //       if (item.id === id) {
  //         const decrement = item.unitType === 'g' ? 50 : 0.5;
  //         // Use startValue as minimum instead of fixed value
  //         const minValue = item.unitType === 'g' 
  //           ? item.startValue * 1000 
  //           : item.startValue;
  //         const newValue = Math.max(minValue, item.changeby - decrement);
  //         return { 
  //           ...item, 
  //           changeby: newValue,
  //           quantity: newValue
  //         };
  //       }
  //       return item;
  //     })
  //   );
  // };


  const increaseQuantity = (id: number) => {
    setCartItems(
      cartItems.map(item => {
        if (item.id === id) {
          // Parse the initial changeby value from your data (fixed increment amount)
          const incrementAmount = typeof item.startValue === 'string' 
            ? parseFloat(item.startValue) 
            : item.startValue;
            
          // Current quantity value
          const currentQuantity = typeof item.changeby === 'string' 
            ? parseFloat(item.changeby) 
            : item.changeby;
            
          // Add the fixed increment to the current quantity
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
          // Parse the initial changeby value from your data (fixed decrement amount)
          const decrementAmount = typeof item.startValue === 'string' 
            ? parseFloat(item.startValue) 
            : item.startValue;
            
          // Current quantity value
          const currentQuantity = typeof item.changeby === 'string' 
            ? parseFloat(item.changeby) 
            : item.changeby;
            
          // Minimum value is startValue
          const minValue = typeof item.startValue === 'string' 
            ? parseFloat(item.startValue) 
            : item.startValue;
            
          // Subtract the fixed decrement from current quantity, but not below minimum
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
              <Image
                source={require("../assets/images/minns.png")}
                className="w-7 h-7 "
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
                className="w-7 h-7 "
                resizeMode="contain"
              />
          </TouchableOpacity>
        </View>
              </View>
            </View>
          ))}
        </ScrollView>
      
        
     
        <View>
        <View className="py-4 border-t border-gray-200">
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Subtotal</Text>
            <Text className="font-medium">Rs.{currentSubtotal.toFixed(2)}</Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="text-gray-500">Discount</Text>
            <Text className="font-medium text-[#686868]">Rs.{discount.toFixed(2)}</Text>
          </View>
          
          <View className="flex-row justify-between py-2">
            <Text className="font-semibold">Total</Text>
            <Text className="font-bold">Rs.{currentTotal.toFixed(2)}</Text>
          </View>
        </View>
        </View>
        </View>
        
        <View className="py-4 px-6 ">
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
 
    </SafeAreaView>
  );
};

export default CratScreen;