import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  BackHandler,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../types/types";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import environment from "@/environment/environment";
import { useFocusEffect } from "@react-navigation/native";
import CustomHeader from "../common/CustomHeader";
import SidebarSkeleton from "./SidebarSkeleton";
import LoadingPage from "../common/LoadingPage";

type SidebarScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "SidebarScreen"
>;

interface SidebarScreenProps {
  navigation: SidebarScreenNavigationProp;
}

const SidebarScreen: React.FC<SidebarScreenProps> = ({ navigation }) => {
  const [complaintsExpanded, setComplaintsExpanded] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    empId: "",
    image: "",
  });
  const [imageLoading, setImageLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setComplaintsExpanded(false);
      setImageLoading(true);
      setProfileLoading(true);
      getUserProfile();
    }, []),
  );

  const getUserProfile = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("authToken");
      if (!storedToken) {
        Alert.alert("Error", "No authentication token found");
        setProfileLoading(false);
        return;
      }
      const response = await axios.get(
        `${environment.API_BASE_URL}api/auth/user/profile`,
        {
          headers: { Authorization: `Bearer ${storedToken}` },
        },
      );

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

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );
      return () => backHandler.remove();
    }, [navigation]),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      enabled
      style={{ flex: 1 }}
    >
      <View className="flex-1 w-full bg-white">
        {loading ? (
          <LoadingPage message="Logging Out..." fullScreen={true} />
        ) : (
          <View className="flex-1 bg-white">
            <ScrollView keyboardShouldPersistTaps="handled">
              <CustomHeader
                title=""
                showBackButton={true}
                navigation={navigation}
                onBackPress={() => navigation.navigate("Main" as any)}
              />

              {profileLoading ? (
                <SidebarSkeleton showHeader={true} />
              ) : (
                <>
                  <View className="flex-row items-center px-5 py-2">
                    {/* Profile Image with Loading State */}
                    <View
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      {formData.image ? (
                        <>
                          {/* Show placeholder while loading */}
                          {imageLoading && (
                            <Image
                              source={require("@/assets/images/profile/profile.webp")}
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
                          source={require("@/assets/images/profile/profile.webp")}
                          className="w-16 h-16 rounded-full"
                          resizeMode="cover"
                        />
                      )}
                    </View>

                    <View style={{ marginLeft: wp(4) }}>
                      <Text className="text-lg font-bold text-gray-900">
                        {formData.firstName} {formData.lastName}
                      </Text>
                      <Text className="text-sm text-gray-500 mt-1">
                        {formData.empId}
                      </Text>
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
                          source={require("@/assets/images/sidebar/user.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>

                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
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
                          source={require("@/assets/images/sidebar/complaints.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>

                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Complaints
                      </Text>

                      <Ionicons
                        name={
                          complaintsExpanded
                            ? "chevron-down-outline"
                            : "chevron-forward-outline"
                        }
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    {complaintsExpanded && (
                      <View style={{ paddingLeft: wp(15) }}>
                        <TouchableOpacity
                          onPress={() =>
                            navigation.navigate("Main", {
                              screen: "AddComplaintScreen",
                            })
                          }
                        >
                          <Text className="text-base text-gray-700 font-bold mb-2">
                            Report a Complaint
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{ marginTop: hp(1), marginBottom: hp(1) }}
                          onPress={() =>
                            navigation.navigate("ViewComplainScreen")
                          }
                        >
                          <Text className="text-base text-gray-700 font-bold">
                            View Complaint History
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={{ marginBottom: hp(2), marginTop: hp(1) }}
                      className="flex-row items-center py-3"
                      onPress={() =>
                        navigation.navigate("ChangePasswordScreen")
                      }
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
                          source={require("@/assets/images/sidebar/passwords.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>

                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Change Password
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{ marginBottom: hp(2) }}
                      className="flex-row items-center py-3"
                      onPress={() => navigation.navigate("PrivacyPolicy")}
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
                          source={require("@/assets/images/sidebar/privacy-policy.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>
                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Privacy & Policy
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
                      onPress={() => navigation.navigate("TermsConditions")}
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
                          source={require("@/assets/images/sidebar/terms-conditions.webp")}
                          style={{
                            width: hp(3),
                            height: hp(3),
                            tintColor: "#8F8F8F",
                          }}
                        />
                      </View>
                      <Text
                        style={{ flex: 1, marginLeft: wp(4), fontSize: hp(2) }}
                        className="text-gray-800"
                      >
                        Terms & Conditions
                      </Text>
                      <Ionicons
                        name="chevron-forward-outline"
                        size={hp(2.5)}
                        color="#8F8F8F"
                        style={{ marginRight: wp(2) }}
                      />
                    </TouchableOpacity>

                    <View className="mb-8">
                      <View className="border-b border-gray-200 my-5" />
                      <TouchableOpacity
                        className="flex-row items-center"
                        onPress={handleLogout}
                      >
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
                          <Ionicons
                            name="log-out-outline"
                            size={hp(3)}
                            color="#FF3B30"
                          />
                        </View>
                        <Text
                          style={{
                            marginLeft: wp(4),
                            fontSize: hp(2),
                            color: "#FF3B30",
                            fontWeight: "bold",
                            marginTop: 13,
                          }}
                        >
                          Logout
                        </Text>
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
