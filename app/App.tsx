import React from "react";
import { Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import NavigationBar from "@/components/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Splash from '@/components/Splash';
import ChangePasswordScreen from '@/components/ChangePasswordScreen';
import LoginScreen from '@/components/LoginScreen';
import DashboardScreen from '@/components/DashboardScreen';
import ViewScreen from '@/components/ViewScreen';
import CustomersScreen from '@/components/CustomersScreen';
import SidebarScreen from '@/components/SidebarScreen';
import ProfileScreen from '@/components/ProfileScreen';
import AddComplaintScreen from '@/components/AddComplaintScreen';
import ViewComplainScreen from '@/components/ViewComplainScreen';
import ViewCustomerScreen from '@/components/ViewCustomerScreen';
import ReminderScreen from '@/components/ReminderScreen';
import AddCustomersScreen from '@/components/AddCustomersScreen';
import OtpScreen from '@/components/OtpScreen';
import OtpSuccesfulScreen from '@/components/OtpSuccesfulScreen';
import EditCustomerScreen from '@/components/EditCustomerScreen';
import OtpScreenUp from '@/components/OtpScreenUp';
import OrderScreen from '@/components/OrderScreen';
import ScheduleScreen from '@/components/ScheduleScreen';
import SelectPaymentMethod from '@/components/SelectPaymentMethod';
import OrderSummeryScreen from '@/components/OrderSummeryScreen';
import OrderConfirmedScreen from '@/components/OrderConfirmedScreen';
import ViewOrdersScreen from '@/components/ViewOrdersScreen';
import View_CancelOrderScreen from '@/components/View_CancelOrderScreen'
import SelectOrderType from "@/components/SelectOrderType";
import SelectOrderTypeNewCustomer from "@/components/SelectOrderTypeNewCustomer"
import CreateCustomPackage from "@/components/CreateCustomPackage";
import CratScreen from "@/components/CratScreen"
import ExcludeListAdd from "@/components/ExcludeListAdd"
import ExcludeListSummery from "@/components/ExcludeListSummery"
import ExcludeItemEditSummery from "@/components/ExcludeItemEditSummery"
import ExcludeAddMore from '@/components/ExcludeAddMore'
import PrivacyPolicy from '@/components/PrivacyPolicy'
import TermsConditions from '@/components/TermsConditions'
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Example Screens
function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-100">
      <Text className="text-2xl font-bold text-blue-800">Home Screen</Text>
    </View>
  );
}

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: false,
        tabBarStyle: { position: "absolute", backgroundColor: "#fff" },
      })}
      

      
      tabBar={(props) => <NavigationBar {...props} />}
    >
   <Tab.Screen name="DashboardScreen" component={DashboardScreen} />
      <Tab.Screen name="ViewOrdersScreen" component={ViewOrdersScreen} />
      <Tab.Screen name="ReminderScreen" component={ReminderScreen} />
      <Tab.Screen  
      
       options={{
              tabBarHideOnKeyboard: true, // Hides tab bar for this specific screen
                 tabBarVisibilityAnimationConfig: {
      show: { animation: 'timing', config: { duration: 0 } },
      hide: { animation: 'timing', config: { duration: 0 } }
    }
            }} 
            name="CustomersScreen" 
            component={CustomersScreen} />
      <Tab.Screen name="ViewComplainScreen" component={ViewComplainScreen} />
      {/* <Tab.Screen name="SidebarScreen" component={SidebarScreen} /> */}
      <Tab.Screen name="ViewScreen" component={ViewScreen as any} />
      <Tab.Screen name="ViewCustomerScreen" component={ViewCustomerScreen as any} />
      <Tab.Screen name="EditCustomerScreen" component={EditCustomerScreen} />
      <Tab.Screen name="SelectOrderType" component={SelectOrderType as any} />
      <Tab.Screen name="SelectOrderTypeNewCustomer" component={SelectOrderTypeNewCustomer as any} />
      <Tab.Screen name="OrderConfirmedScreen" component={OrderConfirmedScreen as any} />
      <Tab.Screen name="OtpSuccesfulScreen" component={OtpSuccesfulScreen as any} />
            <Tab.Screen name="AddComplaintScreen" component={AddComplaintScreen} />
            <Tab.Screen name="ExcludeListAdd" component={ExcludeListAdd as any} />
            <Tab.Screen name="ExcludeListSummery" component={ExcludeListSummery as any} />
            <Tab.Screen name="ExcludeItemEditSummery" component={ExcludeItemEditSummery as any} />
            <Tab.Screen name="ExcludeAddMore" component={ExcludeAddMore as any} />
             <Tab.Screen name="AddCustomersScreen" 
  component={AddCustomersScreen} 
             
             />

    </Tab.Navigator>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ flex: 1, paddingBottom: insets.bottom, backgroundColor: "#fff" }}
        edges={["top", "right", "left"]}
      >
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
               <Stack.Screen name="Splash" component={Splash} />
                     <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      <Stack.Screen name="SidebarScreen" component={SidebarScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
      <Stack.Screen name="OtpScreenUp" component={OtpScreenUp} />
            <Stack.Screen name="OrderScreen" component={OrderScreen as any} />
      <Stack.Screen name="ScheduleScreen" component={ScheduleScreen as any} />
      <Stack.Screen name="SelectPaymentMethod" component={SelectPaymentMethod as any} />
      <Stack.Screen name="OrderSummeryScreen" component={OrderSummeryScreen as any} />
            <Stack.Screen name="View_CancelOrderScreen" component={View_CancelOrderScreen as any} /> 
      <Stack.Screen name="CreateCustomPackage" component={CreateCustomPackage as any} />
      <Stack.Screen name="CratScreen" component={CratScreen as any} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy as any} />
      <Stack.Screen name="TermsConditions" component={TermsConditions as any} /> 
            <Stack.Screen name="Main" component={MainTabNavigator} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}