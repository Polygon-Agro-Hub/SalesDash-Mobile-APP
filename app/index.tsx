import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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



const Stack = createNativeStackNavigator(); 
const index = () => {
  
    // Prevent screenshots and screen recording
    // ScreenCapture.usePreventScreenCapture()

  return (
    <LanguageProvider>
    <GestureHandlerRootView >
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={Splash} />
      <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="DashboardScreen" component={DashboardScreen} />
      <Stack.Screen name="ViewScreen" component={ViewScreen} />
      <Stack.Screen name="CustomersScreen" component={CustomersScreen} />
      <Stack.Screen name="SidebarScreen" component={SidebarScreen} />
      <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
      <Stack.Screen name="AddComplaintScreen" component={AddComplaintScreen} />
     
    </Stack.Navigator>
   </GestureHandlerRootView>
    </LanguageProvider>
  )
}

export default index

