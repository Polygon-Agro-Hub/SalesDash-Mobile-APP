import React from 'react'
import { createStackNavigator } from "@react-navigation/stack";
import Splash from '@/components/Splash';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as ScreenCapture from 'expo-screen-capture';
import { LanguageProvider } from '@/context/LanguageContext';
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


import { RootStackParamList } from '@/components/types';

const Stack = createStackNavigator(); 

//const Stack = createNativeStackNavigator(); 
// const Stack = createStackNavigator<RootStackParamList>();
const index = () => {
  
    // Prevent screenshots and screen recording
    // ScreenCapture.usePreventScreenCapture()

  return (
    <LanguageProvider>
    <GestureHandlerRootView >
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      <Stack.Screen name="ViewScreen" component={ViewScreen as any} />
      <Stack.Screen name="CustomersScreen" component={CustomersScreen} />
      <Stack.Screen name="SidebarScreen" component={SidebarScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="AddComplaintScreen" component={AddComplaintScreen} />
      <Stack.Screen name="ViewComplainScreen" component={ViewComplainScreen} />
      <Stack.Screen name="ViewCustomerScreen" component={ViewCustomerScreen as any} />
      <Stack.Screen name="ReminderScreen" component={ReminderScreen} />
      <Stack.Screen name="AddCustomersScreen" component={AddCustomersScreen} />
      <Stack.Screen name="OtpScreen" component={OtpScreen} />
      <Stack.Screen name="OtpScreenUp" component={OtpScreenUp} />
      <Stack.Screen name="OtpSuccesfulScreen" component={OtpSuccesfulScreen} />
      <Stack.Screen name="EditCustomerScreen" component={EditCustomerScreen} />
      <Stack.Screen name="OrderScreen" component={OrderScreen} />
      <Stack.Screen name="ScheduleScreen" component={ScheduleScreen as any} />
      <Stack.Screen name="SelectPaymentMethod" component={SelectPaymentMethod} />
      <Stack.Screen name="OrderSummeryScreen" component={OrderSummeryScreen} />
      <Stack.Screen name="OrderConfirmedScreen" component={OrderConfirmedScreen} />
      <Stack.Screen name="ViewOrdersScreen" component={ViewOrdersScreen} />
      <Stack.Screen name="View_CancelOrderScreen" component={View_CancelOrderScreen} />
      
    </Stack.Navigator>
   </GestureHandlerRootView>
    </LanguageProvider>
  )
}

export default index

