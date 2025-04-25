export interface CartItem {
  id: number;
  name: string;
  price: number;
  normalPrice: number;
  discountedPrice: number;
  quantity: number;
  selected: boolean;
  unitType: string;
  startValue: number;
  changeby: number;
}

export interface PackageItem {
  packageId: number;
  isModifiedPlus: boolean;
  isModifiedMin: boolean;
  isAdditionalItems: boolean;
  packageTotal: number;
  packageDiscount: number;
  modifiedPlusItems: ModifiedPlusItem[];
  modifiedMinItems: ModifiedMinItem[];
  additionalItems: AdditionalItem[];
  finalOrderPackageList?: Array<{
    productId: number;
    quantity: number;
    price: number | string;
    isPacking: number;
  }>;
}

interface ModifiedPlusItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number | string;
  additionalPrice: number;
  additionalDiscount: number;
}

interface ModifiedMinItem {
  packageDetailsId: number;
  originalQuantity: number;
  modifiedQuantity: number;
  originalPrice: number | string;
  additionalPrice: number;
  additionalDiscount: number;
}

interface AdditionalItem {
  mpItemId: number;
  quantity: number;
  price: number;
  discount: number;
}


export type RootStackParamList = {
    Splash: undefined;
    LoginScreen: undefined;
    ChangePasswordScreen: undefined;
    DashboardScreen: undefined;
    

 ViewScreen: { 
    selectedPackageId: number;
    selectedPackageName: string;
    selectedPackageImage: string;
    selectedPackageTotal: string;
    selectedPackageDescription:string;
    selectedPackageportion:number;
    selectedPackageperiod:number;
  
  };
  
    CustomersScreen: undefined;
    SidebarScreen: undefined;
    ProfileScreen: undefined;
    AddComplaintScreen: undefined;
    ViewComplainScreen: undefined;
    ViewCustomerScreen: {number:string,name:string, customerId:string , id: string , title:string}; // Update this type
    ReminderScreen: undefined;
    AddCustomersScreen: undefined;
    OtpScreen:{phoneNumber:string , id: string};
   // OtpSuccesfulScreen:undefined;
   OtpSuccesfulScreen: {
    customerId?: number | string;
   // customerData?: any; // Or define a more specific type for your customer data
  };
    EditCustomerScreen:{ id: string, customerId:string, name: string,title:string}; 
    OtpScreenUp:{phoneNumber:string , id: string, token:string};      
    OrderScreen: {id: string; isCustomPackage:string; isSelectPackage:string;};
    ScheduleScreen: {totalPrice: Number };
    ViewOrdersScreen:undefined;
    View_CancelOrderScreen:{orderId:number};
    SelectOrderType:undefined;
    CreateCustomPackage :{id: string; isCustomPackage:string; isSelectPackage:string;};
   CratScreen: {
    selectedProducts: CartItem[];
    id: string; 
  };
    Main: { screen: keyof RootStackParamList; params?: any };
    SelectPaymentMethod: {
      items: CartItem[];
      subtotal: number;
      discount: number;
      total: number;
      fullTotal: number;
      selectedDate: string;
      selectedTimeSlot: string;
    };
    OrderSummeryScreen: {
      items?: CartItem[];
      subtotal?: number;
      discount?: number;
      total?: number;
      fullTotal?: number;
      selectedDate?: string;
      selectedTimeSlot?: string;
      paymentMethod?: string;
      customerId?: string | number;
      customerid?: string | number;
      isSelectPackage?: number;
      isCustomPackage?: number;
      packageId?: number;
      orderItems?: PackageItem[]; 
    };
    OrderConfirmedScreen: {
      orderId: number;
      total: number;
      subtotal:number,
      discount:number,
      paymentMethod: string;
      customerId: string | number;
      customerid?: string | number;
      items?: Array<CartItem>;
      selectedDate: string;
      selectedTimeSlot: string;
      orderData?: any;
    
    };
  };
  