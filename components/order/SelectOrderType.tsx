import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  BackHandler,
} from "react-native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";

type SelectOrderTypeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SelectOrderType"
>;

interface SelectOrderTypeProps {
  navigation: SelectOrderTypeNavigationProp;
  route: {
    params: {
      id: string;
      isPackage: string;
      customerId: string;
      name: string;
      title: string;
    };
  };
}

const SelectOrderType: React.FC<SelectOrderTypeProps> = ({
  navigation,
  route,
}) => {
  const { id, customerId, name, title } = route.params || {};

  const handleCreateCustomPackage = () => {
    navigation.navigate("CreateCustomPackage" as any, {
      id,
      isPackage: 0,
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ViewCustomerScreen" as any, {
          id: id,
          customerId: customerId,
          name: name,
          title: title,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, id, customerId, name, title]),
  );

  const handleSelectPackage = () => {
    navigation.navigate("OrderScreen" as any, {
      id,
      isPackage: 1,
    });
  };

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Select Order Type"
        titleColor="#6C3CD1"
        transparent
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("ViewCustomerScreen" as any, {
            id: id,
            customerId: customerId,
            name: name,
            title: title,
          })
        }
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6">
          {/* Image - Centered */}
          <View className="items-center mb-8">
            <Image
              source={require("@/assets/images/order/cart.webp")}
              className="w-[70%] h-40"
              resizeMode="contain"
            />
          </View>

          {/* Buttons Container - Centered */}
          <View className="items-center mb-10">
            {/* Create Custom Package Button */}
            <TouchableOpacity
              className="w-[70%] bg-white border border-[#F2F4F7] py-5 rounded-xl mb-4"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 40,
                elevation: 5,
              }}
              onPress={handleCreateCustomPackage}
            >
              <Text className="text-[#6839CF] text-center font-semibold text-lg">
                Create{"\n"}Custom Package
              </Text>
            </TouchableOpacity>

            {/* Select Package Button */}
            <TouchableOpacity
              className="w-[70%] bg-white border border-[#F2F4F7] py-5 rounded-xl"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 40,
                elevation: 5,
              }}
              onPress={handleSelectPackage}
            >
              <Text className="text-[#6839CF] text-center font-semibold text-lg">
                Select{"\n"}Package
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default SelectOrderType;