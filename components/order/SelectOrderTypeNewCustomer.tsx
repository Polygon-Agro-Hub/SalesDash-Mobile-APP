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
import CustomHeader from "../common/CustomHeader";
import { useFocusEffect } from "@react-navigation/native";

type SelectOrderTypeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SelectOrderType"
>;

interface SelectOrderTypeProps {
  navigation: SelectOrderTypeNavigationProp;
  route: {
    params: {
      id: string;
      isCustomPackage: string;
      isSelectPackage: string;
      customerId: string;
      name: string;
      title: string;
      phoneNumber: string;
    };
  };
}

const SelectOrderType: React.FC<SelectOrderTypeProps> = ({
  navigation,
  route,
}) => {
  const { id, name, title, customerId, phoneNumber } = route.params || {};

  const handleCreateCustomPackage = () => {
    navigation.navigate("CreateCustomPackage" as any, {
      id,
      isPackage: 0,
      customerId: customerId,
      name: name,
      title: title,
      number: phoneNumber,
      customerscreencustomerid: customerId,
      isNewCustomer: true,
    });
  };

  const handleSelectPackage = () => {
    navigation.navigate("OrderScreen" as any, {
      id,
      isPackage: 1,
      customerId: customerId,
      name: name,
      title: title,
      number: phoneNumber,
      customerscreencustomerid: customerId,
      isNewCustomer: true,
    });
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("ViewCustomerScreen" as any, {
          name: name,
          title: title,
          number: phoneNumber,
          customerId: customerId,
          id: id,
        });
        return true;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => backHandler.remove();
    }, [navigation, name, title, phoneNumber, customerId, id]),
  );

  return (
    <View className="flex-1 bg-white">
      <CustomHeader
        title="Select Order Type"
        titleColor="#6C3CD1"
        showBackButton={true}
        navigation={navigation}
        onBackPress={() =>
          navigation.navigate("ViewCustomerScreen" as any, {
            name: name,
            title: title,
            number: phoneNumber,
            customerId: customerId,
            id: id,
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
                backgroundColor: "white",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                width: "80%",
                maxWidth: 500,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              onPress={handleCreateCustomPackage}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#6839CF",
                  textAlign: "center",
                }}
              >
                Create{"\n"}Custom Package
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="w-[70%] bg-white border border-[#F2F4F7] py-5 rounded-xl"
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
                width: "80%",
                maxWidth: 500,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              onPress={handleSelectPackage}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#6839CF",
                  textAlign: "center",
                }}
              >
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
