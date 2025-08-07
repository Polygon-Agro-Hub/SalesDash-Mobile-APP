import { StackNavigationProp } from "@react-navigation/stack";
import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import BackButton from "./BackButton";
import { RootStackParamList } from "./types";

type TermsConditionsNavigationProp = StackNavigationProp<
  RootStackParamList,
  "TermsConditions"
>;

interface TermsConditionsProps {
  navigation: TermsConditionsNavigationProp;
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ navigation }) => {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="flex-row items-center mt-[-1] px-2">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="p-1 mr-4"
          >
              <BackButton navigation={navigation} />
          </TouchableOpacity>
       
           <View className="flex-1 items-center justify-center mr-[20%]">
                      <Text className="text-xl font-bold text-gray-900">Terms & Conditions</Text>
                    </View>
        </View>

        <View className="px-7">
          {/* Effective Date */}
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-900">Effective Date:</Text>
            <Text className="text-base text-gray-700">28th of July, 2025</Text>
          </View>

         

          {/* Introduction */}
          <Text className="text-base text-gray-700 leading-6 mb-8">
            Welcome to the <Text className="font-semibold">Sales Dash</Text> mobile application ("App"), developed and operated by <Text className="font-semibold">Polygon Holdings Private Limited</Text> ("we", "our", or "us"). These Terms and Conditions ("Terms") govern your access to and use of the App. By using the App, you ("User", "you", or "your") agree to comply with and be bound by these Terms.
          </Text>

          {/* Section 1 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              1. Purpose and Scope
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              Sales Dash is an internal application intended solely for use by authorized employees or agents of <Text className="font-semibold">Polygon Holdings Private Limited</Text>. It is designed to track sales operations, measure productivity, and assist in internal workflow management.
            </Text>
          </View>

          {/* Section 2 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              2. Eligibility
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              Only individuals who are:
            </Text>
            <View className="ml-4 space-y-2">
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Employed or officially contracted by Polygon Holdings Private Limited, and
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Provided with login credentials by the company
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mt-3">
              are authorized to use this application. Unauthorized access or use is strictly prohibited.
            </Text>
          </View>

          {/* Section 3 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              3. User Responsibilities
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              You agree to:
            </Text>
            <View className="ml-4 space-y-2">
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Use the App only for purposes related to your employment or contract with Polygon Holdings.
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Keep login credentials confidential and not share them with unauthorized persons.
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Immediately report any unauthorized access or security breaches to the management or IT team.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 4 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              4. Data Usage and Ownership
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-4">
              All data entered, generated, or collected via the App—including order information, sales data, and performance metrics—remains the exclusive property of Polygon Holdings Private Limited.
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              Data is used exclusively for:
            </Text>
            <View className="ml-4 space-y-2">
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Monitoring sales performance,
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Operational reporting,
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Internal process optimization.
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mt-4">
              No personal or sensitive customer data is collected or stored through the App.
            </Text>
          </View>

          {/* Section 5 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              5. Prohibited Conduct
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              You must not:
            </Text>
            <View className="ml-4 space-y-2">
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Attempt to reverse-engineer, decompile, or alter the app's code or features.
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Use the App for any fraudulent, unauthorized, or illegal activity.
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Interfere with the app's performance or security mechanisms.
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mt-4">
              Violation of these terms may result in disciplinary action, legal consequences, or termination of access.
            </Text>
          </View>

          {/* Section 6 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              6. App Availability and Maintenance
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              We strive to ensure continuous availability of the App but do not guarantee uninterrupted access. The app may be temporarily unavailable due to maintenance, updates, or unforeseen technical issues.
            </Text>
          </View>

          {/* Section 7 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              7. Intellectual Property
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              All content, design elements, and functionality of the App, including logos, branding, and source code, are the intellectual property of <Text className="font-semibold">Polygon Holdings Private Limited</Text> and protected under applicable laws.
            </Text>
          </View>

          {/* Section 8 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              8. Termination of Access
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              Your access to the App may be terminated at any time by the company:
            </Text>
            <View className="ml-4 space-y-2">
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Upon termination of your employment or contract,
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Due to violation of these Terms,
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Based on operational requirements.
                </Text>
              </View>
            </View>
            <Text className="text-base text-gray-700 leading-6 mt-4">
              Upon termination, you must cease all use of the App and delete any downloaded materials from your device.
            </Text>
          </View>

          {/* Section 9 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              9. Limitation of Liability
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              The App is provided "as is." While we make every effort to ensure the App's reliability, we are not liable for:
            </Text>
            <View className="ml-4 space-y-2">
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Any data loss, downtime, or errors caused by system faults or misuse.
                </Text>
              </View>
              <View className="flex-row">
                <Text className="text-base text-gray-700 mr-2">•</Text>
                <Text className="text-base text-gray-700 flex-1 leading-6">
                  Any indirect or consequential damages resulting from the use or inability to use the App.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 10 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              10. Modifications to Terms
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              We may revise these Terms at any time. Updated versions will be communicated via internal channels or in-app notifications. Continued use of the App after such updates constitutes acceptance of the revised Terms.
            </Text>
          </View>

          {/* Section 11 */}
          <View className="mb-8">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              11. Governing Law
            </Text>
            <Text className="text-base text-gray-700 leading-6">
              These Terms are governed by the laws of the <Text className="font-semibold">Democratic Socialist Republic of Sri Lanka</Text>. Any disputes arising from or related to these Terms will be subject to the exclusive jurisdiction of the courts of Sri Lanka.
            </Text>
          </View>

          {/* Section 12 - Contact Information */}
          <View className="mb-12">
            <Text className="text-base font-semibold text-gray-900 mb-4">
              12. Contact Information
            </Text>
            <Text className="text-base text-gray-700 leading-6 mb-3">
              For questions about these Terms, please contact:
            </Text>
            <View className="mt-3">
              <Text className="text-base font-semibold text-gray-900">Polygon Holdings Private Limited</Text>
              <Text className="text-base text-gray-700 italic leading-6">Forbes & Walkers Building 2,</Text>
              <Text className="text-base text-gray-700 italic leading-6">No.46/42,</Text>
              <Text className="text-base text-gray-700 italic leading-6">Colombo 02,</Text>
              <Text className="text-base text-gray-700 leading-6 mt-2">
                <Text className="font-semibold">Email:</Text> info@polygon.lk
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default TermsConditions;