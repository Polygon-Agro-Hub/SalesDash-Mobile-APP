import React, { useCallback, useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, BackHandler, Animated } from "react-native";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import BackButton from "./BackButton";
import LottieView from "lottie-react-native";
import { useFocusEffect } from '@react-navigation/native';
import { ActionSheetIOS } from "react-native";

type SidebarScreenNavigationProp = StackNavigationProp<RootStackParamList, "SidebarScreen">;

interface SidebarScreenProps {
  navigation: SidebarScreenNavigationProp;
}

// Skeleton Loader Component
const SkeletonLoader: React.FC = () => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View className="flex-1 p-5">
      {/* Profile Section Skeleton */}
      <View className="flex-row items-center mb-5">
        <Animated.View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: '#E0E0E0',
            opacity,
          }}
        />
        <View style={{ marginLeft: wp(4), flex: 1 }}>
          <Animated.View
            style={{
              width: '60%',
              height: 20,
              backgroundColor: '#E0E0E0',
              borderRadius: 4,
              marginBottom: 8,
              opacity,
            }}
          />
          <Animated.View
            style={{
              width: '40%',
              height: 16,
              backgroundColor: '#E0E0E0',
              borderRadius: 4,
              opacity,
            }}
          />
        </View>
      </View>

      <View className="border-b border-gray-200 my-1" />

      {/* Menu Items Skeleton */}
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} className="flex-row items-center py-4">
          <Animated.View
            style={{
              width: hp(5),
              height: hp(5),
              borderRadius: hp(2.5),
              backgroundColor: '#E0E0E0',
              opacity,
            }}
          />
          <Animated.View
            style={{
              flex: 1,
              height: 16,
              backgroundColor: '#E0E0E0',
              borderRadius: 4,
              marginLeft: wp(4),
              marginRight: wp(4),
              opacity,
            }}
          />
        </View>
      ))}
    </View>
  );
};

const SidebarScreen: React.FC<SidebarScreenProps> = ({ navigation }) => {
  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({ firstName: "", lastName:"", empId: "", image:"" });
  const [imageLoading, setImageLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setComplaintsExpanded(false);
      setImageLoading(true);
      setProfileLoading(true);
      getUserProfile();
    }, [])
  );

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        setProfileLoading(false);
        return;
      }
      setToken(storedToken);
      const response = await axios.get(`${environment.API_BASE_URL}api/auth/user/profile`, {
        headers: { Authorization: `Bearer ${storedToken}` },
      });
      
      // Preload the image before setting formData
      if (response.data.data.image) {
        Image.prefetch(response.data.data.image)
          .then(() => {
            setFormData(response.data.data);
            setImageLoading(false);
            setProfileLoading(false);
          })
          .catch(() => {
            setFormData(response.data.data);
            setImageLoading(false);
            setProfileLoading(false);
          });
      } else {
        setFormData(response.data.data);
        setImageLoading(false);
        setProfileLoading(false);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to fetch user profile");
      console.error(error);
      setImageLoading(false);
      setProfileLoading(false);
    }
  };

  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true); 
    try {
      await AsyncStorage.removeItem("authToken");
      setTimeout(() => {
        navigation.replace("LoginScreen"); 
      }, 5000);
    } catch (error) {
      console.error("Error removing authToken:", error);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate("Main" as any);
        return true;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [navigation])
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled 
      style={{flex: 1}}
    >
      <View className="flex-1 w-full bg-white">
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#693ACF" />
            <Text className="mt-4 text-[#693ACF] font-semibold">Logging out...</Text>
          </View>
        ) : (
          <View className="flex-1 w-full bg-white">
            <ScrollView 
              style={{ paddingHorizontal: wp(4) }}
              keyboardShouldPersistTaps="handled"
            >
              <TouchableOpacity 
                style={{ paddingHorizontal: wp(2), paddingVertical: hp(2) }}
                onPress={() => navigation.navigate("Main" as any)}
              >
                <View className="w-9 h-9 bg-[#F6F6F680] rounded-full justify-center items-center">
                  <AntDesign name="left" size={20} color="black" />
                </View>
              </TouchableOpacity> 

              {profileLoading ? (
                <SkeletonLoader />
              ) : (
                <>
                  <View className="flex-row items-center p-5">
                    {/* Profile Image with Loading State */}
                    <View style={{ width: 64, height: 64, borderRadius: 32, overflow: 'hidden', position: 'relative' }}>
                      {formData.image ? (
                        <>
                          {/* Show placeholder while loading */}
                          {imageLoading && (
                            <Image
                              source={require("../../assets/images/profile.webp")}
                              className="w-16 h-16 rounded-full absolute"
                              resizeMode="cover"
                            />
                          )}
                          {/* Actual profile image */}
                          <Image
                            source={{ uri: formData.image }}
                            className="w-16 h-16 rounded-full"
                            resizeMode="cover"
                            onLoadStart={() => setImageLoading(true)}
                            onLoadEnd={() => setImageLoading(false)}
                            onError={() => setImageLoading(false)}
                          />
                        </>
                      ) : (
                        <Image
                          source={require("../../assets/images/profile.webp")}
                          className="w-16 h-16 rounded-full"
                          resizeMode="cover"
                        />
                      )}
                    </View>

                    <View style={{ marginLeft: wp(4) }}>
                      <Text className="text-lg font-bold text-gray-900">{formData.firstName} {formData.lastName}</Text>
                      <Text className="text-sm text-gray-500 mt-1">{formData.empId}</Text>
                    </View>
                  </View>

                  <View className="border-b border-gray-200 my-1 ml-4 mr-4" />

                  <View className="flex-1 p-5">
                    <TouchableOpacity
                      style={{ marginBottom: hp(2) }}
                      className="flex-row items-center"
                      onPress={() => navigation.navigate("ProfileScreen")}
                    >
                      <View
                        style={{
                          width: hp(5), 
                          height: hp(5), 
                          borderRadius: hp(2.5),
                          backgroundColor: "#F4F9FB", 
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image 
                          source={require('../../assets/images/Account.webp')} 
                          style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
                        />
                      </View>

                      <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
                        Profile
                      </Text>

                      <Ionicons
                        name="chevron-forward-outline"
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      className="flex-row items-center py-3" 
                      onPress={() => setComplaintsExpanded(!complaintsExpanded)}
                    >
                      <View
                        style={{
                          width: hp(5), 
                          height: hp(5), 
                          borderRadius: hp(2.5), 
                          backgroundColor: "#F4F9FB", 
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image 
                          source={require('../../assets/images/Help.webp')} 
                          style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
                        />
                      </View>
                      
                      <Text 
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} 
                        className="text-gray-800"
                      >
                        Complaints
                      </Text>
                      
                      <Ionicons 
                        name={complaintsExpanded ? "chevron-down-outline" : "chevron-forward-outline"}  
                        size={hp(2.5)} 
                        color="#8F8F8F" 
                        style={{ marginRight: wp(2) }} 
                      />
                    </TouchableOpacity>

                    {complaintsExpanded && (
                      <View style={{ paddingLeft: wp(15) }}>
                        <TouchableOpacity onPress={() => navigation.navigate("Main",{screen:"AddComplaintScreen"})}>
                          <Text className="text-base text-gray-700 font-bold mb-2">Report a Complaint</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ marginTop: hp(1), marginBottom: hp(1) }} onPress={() => navigation.navigate("Main",{screen:"ViewComplainScreen"})}>
                          <Text className="text-base text-gray-700 font-bold">View Complaint History</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity style={{ marginBottom: hp(2),marginTop: hp(1) }} className="flex-row items-center py-3" onPress={() => navigation.navigate("ChangePasswordScreen")}> 
                      <View
                        style={{
                          width: hp(5), 
                          height: hp(5),
                          borderRadius: hp(2.5), 
                          backgroundColor: "#F4F9FB", 
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image 
                          source={require('../../assets/images/Password.webp')} 
                          style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
                        />
                      </View>

                      <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
                        Change Password
                      </Text>
                      <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginBottom: hp(2) }} className="flex-row items-center py-3" onPress={() => navigation.navigate("PrivacyPolicy")}> 
                      <View
                        style={{
                          width: hp(5),
                          height: hp(5), 
                          borderRadius: hp(2.5), 
                          backgroundColor: "#F4F9FB", 
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image 
                          source={require('../../assets/images/Privacy.webp')}
                          style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
                        />
                      </View>
                      <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
                        Privacy & Policy
                      </Text>
                      <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
                    </TouchableOpacity>

                    <TouchableOpacity className="flex-row items-center py-3" onPress={() => navigation.navigate("TermsConditions")}> 
                      <View
                        style={{
                          width: hp(5),
                          height: hp(5), 
                          borderRadius: hp(2.5),
                          backgroundColor: "#F4F9FB", 
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Image 
                          source={require('../../assets/images/Terms and Conditions.webp')} 
                          style={{ width: hp(3), height: hp(3), tintColor: '#8F8F8F' }} 
                        />
                      </View>
                      <Text style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }} className="text-gray-800">
                        Terms & Conditions
                      </Text>
                      <Ionicons name="chevron-forward-outline" size={hp(2.5)} color="#8F8F8F" style={{ marginRight: wp(2) }} />
                    </TouchableOpacity>

                    <View className="mb-8">
                      <View className="border-b border-gray-200 my-5" />

                      <TouchableOpacity className="flex-row items-center" onPress={handleLogout}> 
                        <View
                          className="mt-4"
                          style={{
                            width: hp(5), 
                            height: hp(5),
                            borderRadius: hp(2.5), 
                            backgroundColor: "#FFF2EE",
                            justifyContent: "center",
                            alignItems: "center",
                          }}
                        >
                          <Ionicons name="log-out-outline" size={hp(3)} color="#FF3B30" />
                        </View>
                        <Text style={{ marginLeft: wp(4), fontSize: hp(2), color: "#FF3B30", fontWeight: "bold", marginTop: 13}}>Logout</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

export default SidebarScreen;