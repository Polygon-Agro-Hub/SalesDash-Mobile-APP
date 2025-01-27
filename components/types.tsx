export type RootStackParamList = {
    Splash: undefined;
    ChangePasswordScreen: undefined;
    LoginScreen: undefined;
    DashboardScreen: undefined;
    ViewScreen: undefined;
    CustomersScreen: undefined;
    SidebarScreen: undefined;
    ProfileScreen: undefined;
    AddComplaintScreen: undefined;
    ViewComplainScreen: undefined;
    ViewCustomerScreen: { customer: { id: string; customerID:string; name: string; phoneNumber: string; order: string; orders: { id: string; orderNumber: string; schedule: string; time: string; status: string; type: string; }[]; } }; // Update this type
    ReminderScreen: undefined;
  };
  