import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RootStackParamList } from "../types/types";
import { Text } from "react-native";
import BackButton from "./BackButton";

type PrivacyPolicyNavigationProp = StackNavigationProp<
  RootStackParamList,
  "PrivacyPolicy"
>;

interface PrivacyPolicyProps {
  navigation: PrivacyPolicyNavigationProp;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ navigation }) => {
  return (
    <View className="flex-1 bg-white">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        className=""
      >
        {/* Header */}
        <View className="flex-row  mb-5 mt-[-1] px-2">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="p-1 "
          >
             <BackButton navigation={navigation} />
          </TouchableOpacity>
          <View className="flex-1 items-center justify-center mr-[10%]">
            <Text className="text-xl font-bold text-gray-900">Privacy Policy</Text>
          </View>
        </View>

      <View className="px-7">

        {/* Effective Date */}
        <Text className="text-base font-bold text-gray-900 mb-4 ">
          Effective Date: 28th of July in 2025
        </Text>

        {/* Introduction */}
        <Text className="text-base  text-gray-900 leading-relaxed mb-6 text-justify">
          Polygon Holdings Private Limited ("we", "our", or "us") values the privacy of our users and is committed to protecting the information you provide when using the Sales Dash mobile application ("App"). This Privacy Policy explains how we handle user data and outlines our data collection, use, and sharing practices.
        </Text>

        {/* Section 1 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          1. Information We Collect
        </Text>
        
        <Text className="text-base  text-gray-900 mb-3">
          We do not collect any personal or sensitive user data from customers.
        </Text>
        
        <Text className="text-base  text-gray-900 mb-3">
          However, to enable internal company operations and measure productivity of our sales agents, we may collect the following information from authorized users (sales agents) only:
        </Text>

        <View className="mb-4 ml-4">
          <Text className="text-base  text-gray-900 mb-2">
            • User Identification Data: such as employee ID or internal usernames.
          </Text>
          <Text className="text-base  text-gray-900 mb-2">
            • Order Records: details of food packages sold, date and time of sale.
          </Text>
          <Text className="text-base  text-gray-900 mb-2">
            • Delivery Confirmation: sales status (delivered/pending).
          </Text>
          <Text className="text-base  text-gray-900 mb-2">
            • Productivity Metrics: total sales completed, performance reports.
          </Text>
          <Text className="text-base  text-gray-900 mb-2">
            • Device Information: basic information like device model and operating system (for debugging and optimization purposes only).
          </Text>
        </View>

        <Text className="text-base  text-gray-900 mb-6">
          We do not collect or track your live location or any form of real-time GPS data.
        </Text>

        {/* Section 2 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          2. How We Use the Information
        </Text>
        
        <Text className="text-base  text-gray-900 mb-3">
          We use the collected data solely for the following purposes:
        </Text>

        <View className="mb-6 ml-4">
          <Text className="text-base  text-gray-900 mb-2">
            • To manage and record food package orders.
          </Text>
          <Text className="text-base  text-gray-900 mb-2">
            • To track and evaluate sales agent performance.
          </Text>
          <Text className="text-base  text-gray-900 mb-2">
            • To maintain secure and smooth app functionality.
          </Text>
          <Text className="text-base  text-gray-900 mb-2">
            • For internal analytics and operational improvements.
          </Text>
        </View>

        {/* Section 3 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          3. Data Sharing and Disclosure
        </Text>
        
        <Text className="text-base  text-gray-900 mb-3">
          We do not sell or share any user data with third parties.
        </Text>
        
        <Text className="text-base  text-gray-900 mb-6">
          Data is only accessed and processed by authorized personnel within Polygon Holdings Private Limited for legitimate business purposes.
        </Text>

        {/* Section 4 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          4. Data Security
        </Text>
        
        <Text className="text-base  text-gray-900 mb-6 text-justify">
          We implement reasonable security measures to protect user information from unauthorized access, modification, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure.
        </Text>

        {/* Section 5 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          5. Children's Privacy
        </Text>
        
        <Text className="text-base  text-gray-900 mb-6 text-justify">
          The Sales Dash app is not intended for use by children. It is strictly used by employees or agents authorized by Polygon Holdings Private Limited.
        </Text>

        {/* Section 6 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          6. User Rights and Access
        </Text>
        
        <Text className="text-base  text-gray-900 mb-6 text-justify">
          Since the app is intended solely for internal use, access and data rights are governed under employment or contractual agreements. For any concerns or access requests, please contact your supervisor or our company data officer.
        </Text>

        {/* Section 7 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          7. Contact Us
        </Text>
        
        <Text className="text-base  text-gray-900 mb-3">
          If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
        </Text>
        
        <Text className="text-base  text-gray-900 mb-2">
          Polygon Holdings Private Limited
        </Text>
        <Text className="text-base  text-gray-900 mb-2">
          Forbes & Walkers Building 2,
        </Text>
        <Text className="text-base  text-gray-900 mb-2">
          No.46/42
        </Text>
        <Text className="text-base  text-gray-900 mb-6">
          Colombo 02. Email: Info@polygon.lk
        </Text>

        {/* Section 8 */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          8. Changes to This Policy
        </Text>
        
        <Text className="text-base  text-gray-900 mb-8 text-justify">
          We may update this Privacy Policy from time to time. Any changes will be posted within the app or communicated to relevant users directly.
        </Text>
        </View>

      </ScrollView>
    </View>
  );
};

export default PrivacyPolicy;