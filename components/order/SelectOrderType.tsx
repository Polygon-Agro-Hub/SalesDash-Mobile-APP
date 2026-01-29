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
import BackButton from "../common/BackButton";
import { AntDesign } from "@expo/vector-icons";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useFocusEffect } from '@react-navigation/native';
type SelectOrderTypeNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SelectOrderType"
>;

interface SelectOrderTypeProps {
  navigation: SelectOrderTypeNavigationProp;
  route: {
    params: {
      id: string; 
     isPackage:string;

     customerId:string;
      name: string;
      title:string
    };
  };
}

const SelectOrderType: React.FC<SelectOrderTypeProps> = ({ navigation, route }) => {

  const  { id , customerId,name, title} = route.params || {};

  const handleCreateCustomPackage = () => {
    navigation.navigate("CreateCustomPackage" as any, { 
      id, 
      isPackage: 0
   
    });
  };

   useFocusEffect(
       useCallback(() => {
         const onBackPress = () => {
           // Navigate to ViewCustomerScreen instead of going back to main dashboard
           navigation.navigate("ViewCustomerScreen" as any, { 
             id: id, 
             customerId: customerId, 
             name: name, 
             title: title 
           });
           return true; // Prevent default back behavior
         };
   
         const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
   
         return () => backHandler.remove(); // Cleanup on unmount
       }, [navigation, id, customerId, name, title])
     );  
  


  const handleSelectPackage = () => {
    navigation.navigate("OrderScreen" as any, { 
      id, 
   
      isPackage: 1 
    });
  };

  console.log("----------",id)
  return (
    <View className="flex-1 bg-white ">
      <View className="flex-row items-center h-16 shadow-md px-4 bg-white mt-3 ">
        {/* <BackButton navigation={navigation} /> */}
        <TouchableOpacity 
        style = {{ paddingHorizontal: wp(2), paddingVertical: hp(2)}}
        onPress={() => navigation.navigate("ViewCustomerScreen" as any, { id: id, customerId:customerId, name: name, title:title })}
        >
         <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center ">
           <AntDesign name="left" size={20} color="black" />
         </View>
       </TouchableOpacity> 
        <Text className="text-lg font-bold text-[#6C3CD1] flex-grow text-center mr-7">
          Select Order Type
        </Text>
      </View>
      
      <ScrollView>
        <View className="flex-1 items-center justify-center relative">
          <Image
            source={require("../../assets/images/cart.webp")}
            className="w-[70%] h-40 mt-[20%]"
            resizeMode="contain"
          />
          
        
          <TouchableOpacity
  style={{
    width: '70%',
    borderWidth: 1,
    borderColor: '#F2F4F7',
    paddingVertical: 20,
    borderRadius: 16,
    marginVertical: 8,
    alignItems: 'center',
    marginTop: 50,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 5, // for Android shadow
  }}
  onPress={handleCreateCustomPackage}
>
  <Text style={{
    fontSize: 18,
    fontWeight: '600',
    color: '#6839CF',
    textAlign: 'center'
  }}>
    Create{"\n"}Custom Package
  </Text>
</TouchableOpacity>

<TouchableOpacity
  style={{
    width: '70%',
    borderWidth: 1,
    borderColor: '#F2F4F7',
    paddingVertical: 20,
    borderRadius: 16,
    marginVertical: 8,
    alignItems: 'center',
    marginTop: 30,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 40,
    elevation: 5, // for Android shadow
  }}
  className="mb-40"
  onPress={handleSelectPackage}
>
  <Text style={{
    fontSize: 18,
    fontWeight: '600',
    color: '#6839CF',
    textAlign: 'center'
  }}>
    Select{"\n"}Package
  </Text>
</TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

export default SelectOrderType;