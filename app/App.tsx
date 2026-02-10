import React, { useEffect, useState } from "react";
import { Alert, StatusBar, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import NavigationBar from "@/components/common/Navbar";
import { LanguageProvider } from "@/context/LanguageContext";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Splash from '@/components/common/Splash';
import ChangePasswordScreen from '@/components/authentication/ChangePasswordScreen';
import LoginScreen from '@/components/authentication/LoginScreen';
import DashboardScreen from '@/components/common/DashboardScreen';
import ViewScreen from '@/components/order/ViewScreen';
import CustomersScreen from '@/components/customer/CustomersScreen';
import SidebarScreen from '@/components/common/SidebarScreen';
import ProfileScreen from '@/components/authentication/ProfileScreen';
import AddComplaintScreen from '@/components/complain/AddComplaintScreen';
import ViewComplainScreen from '@/components/complain/ViewComplainScreen';
import ViewCustomerScreen from '@/components/customer/ViewCustomerScreen';
import ReminderScreen from '@/components/common/ReminderScreen';
import AddCustomersScreen from '@/components/customer/AddCustomersScreen';
import OtpScreen from '@/components/otp/OtpScreen';
import OtpSuccesfulScreen from '@/components/otp/OtpSuccesfulScreen';
import EditCustomerScreen from '@/components/customer/EditCustomerScreen';
import OtpScreenUp from '@/components/otp/OtpScreenUp';
import OrderScreen from '@/components/order/OrderScreen';
import ScheduleScreen from '@/components/order/ScheduleScreen';
import SelectPaymentMethod from '@/components/order/SelectPaymentMethod';
import OrderSummeryScreen from '@/components/order/OrderSummeryScreen';
import OrderConfirmedScreen from '@/components/order/OrderConfirmedScreen';
import ViewOrdersScreen from '@/components/order/ViewOrdersScreen';
import View_CancelOrderScreen from '@/components/order/View_CancelOrderScreen'
import SelectOrderType from "@/components/order/SelectOrderType";
import SelectOrderTypeNewCustomer from "@/components/order/SelectOrderTypeNewCustomer"
import CreateCustomPackage from "@/components/order/CreateCustomPackage";
import CratScreen from "@/components/order/CratScreen"
import ExcludeListAdd from "@/components/excludeItems/ExcludeListAdd"
import ExcludeListSummery from "@/components/excludeItems/ExcludeListSummery"
import ExcludeItemEditSummery from "@/components/excludeItems/ExcludeItemEditSummery"
import ExcludeAddMore from '@/components/excludeItems/ExcludeAddMore'
import PrivacyPolicy from '@/components/common/PrivacyPolicy'
import TermsConditions from '@/components/common/TermsConditions'
import NetInfo from '@react-native-community/netinfo';
import AttachGeoLocationScreen from '@/components/customer/AttachGeoLocationScreen';
import ViewLocationScreen from '@/components/customer/ViewLocationScreen';
import AttachGeoLocationScreenEdit from '@/components/customer/AttachGeoLocationScreenEdit'

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
             <Tab.Screen name="AddCustomersScreen" component={AddCustomersScreen as any} 
             
             />

    </Tab.Navigator>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const [isOfflineAlertShown, setIsOfflineAlertShown] = useState(false);

  useEffect(() => {
    const unsubscribeNetInfo = NetInfo.addEventListener(state => {
      if (!state.isConnected && !isOfflineAlertShown) {
        setIsOfflineAlertShown(true);
        Alert.alert(
          "No Internet Connection",
          "Please check your connection and try again.",
          [
            {
              text: "OK",
              onPress: () => {
                setIsOfflineAlertShown(false);
              },
            },
          ]
        );
      }
    });

    return () => {
      unsubscribeNetInfo();
    };
  }, [isOfflineAlertShown]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={{ 
          flex: 1, 
          paddingBottom: insets ? insets.bottom : 0, 
          backgroundColor: "#fff" 
        }}
        edges={["top", "right", "left"]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
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
      <Stack.Screen name="ViewLocationScreen" component={ViewLocationScreen as any} />
            <Stack.Screen name="AttachGeoLocationScreenEdit" component={AttachGeoLocationScreenEdit as any} />
      <Stack.Screen name="AttachGeoLocationScreen" component={AttachGeoLocationScreen as any} />
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