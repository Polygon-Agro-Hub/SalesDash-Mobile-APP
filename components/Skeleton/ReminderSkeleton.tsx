// import React from "react";
// import { View, Text, Image } from "react-native";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
// import { Skeleton } from "@rneui/themed"; // You can use RNE Skeleton for easier implementation

// const ReminderScreenSkeleton = () => {
//   return (
//     <View className="flex-1 bg-white">
//       {/* Header Section */}
//       <View style={{ height: hp(10), width: wp(100), justifyContent: "center", alignItems: "center", backgroundColor: "#854BDA" }}>
//         <Skeleton width={wp(50)} height={hp(3)} />
//       </View>

//       <View style={{ flex: 1, paddingVertical: hp(2) }}>
//         {/* Skeleton for No Notifications */}
//         <View className="flex-1 justify-center items-center px-4">
//           <Skeleton width={wp("50%")} height={hp("20%")} circle />
//           <Skeleton width={wp(60)} height={hp(3)} style={{ marginTop: hp(4) }} />
//         </View>

//         {/* Skeleton for FlatList Item */}
//         <View className="pt-4">
//           <Skeleton width={wp(90)} height={hp(8)} style={{ marginBottom: hp(2) }} />
//           <Skeleton width={wp(90)} height={hp(8)} style={{ marginBottom: hp(2) }} />
//           <Skeleton width={wp(90)} height={hp(8)} style={{ marginBottom: hp(2) }} />
//         </View>
//       </View>
//     </View>
//   );
// };

// export default ReminderScreenSkeleton;


// import React from "react";
// import { View, FlatList } from "react-native";
// import ContentLoader, { Rect } from "react-content-loader/native";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

// const ReminderScreenSkeleton = () => {
//   return (
//   <View style={{ flex: 1, paddingHorizontal: wp(4), paddingVertical: hp(2), backgroundColor: "#F8F8F8" }}>



//       {/* Skeleton for Order Cards */}
//       <FlatList
//         data={[...Array(7)]} // Show 7 skeleton items
//         keyExtractor={(item, index) => index.toString()}
//         renderItem={() => (
//             <View
//             style={{
//               backgroundColor: "white",
//               borderRadius: wp(4),
//               padding: wp(1),
//               marginBottom: hp(1),
//               borderWidth: 1,
//               borderColor: "#EAEAEA",
//               marginHorizontal: wp(1),
//               shadowColor: "#0000001A",
//               shadowOpacity: 0.2,
//               shadowOffset: { width: 0, height: 1 },
//               shadowRadius: 5,
//               elevation: 4,
//             }}
//           >
//             <ContentLoader
//               speed={1.5}
//               width={wp(100)}
//               height={hp(11)} // Reduced height here
//               backgroundColor="#e0e0e0"
//               foregroundColor="#f5f5f5"
//             >
//               {/* Skeleton for Left Icon */}
//               <Rect x="2%" y="30%" rx="6" ry="6" width="10%" height="35%" />
          
//               {/* Skeleton for Notification Type */}
//               <Rect x="15%" y="20%" rx="6" ry="6" width="40%" height="12" />
          
//               {/* Skeleton for Order Number */}
//               <Rect x="15%" y="40%" rx="4" ry="4" width="35%" height="10" />
          
//               {/* Skeleton for Customer ID */}
//               <Rect x="15%" y="60%" rx="4" ry="4" width="50%" height="10" />
          
//               {/* Skeleton for More Options Icon */}
//               <Rect x="85%" y="30%" rx="5" ry="5" width="2%" height="30" />
//             </ContentLoader>
//           </View>
          
//         )}
//         contentContainerStyle={{ paddingBottom: hp(4) }}
//       />
//     </View>
//   );
// };

// export default ReminderScreenSkeleton;


import React from "react";
import { View, FlatList } from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";

const ReminderScreenSkeleton = () => {
  return (
    <View style={{ flex: 1, paddingHorizontal: wp(1), paddingVertical: hp(1), backgroundColor: "#F8F8F8" }}>

      {/* Skeleton for Header Section */}
      <View style={{ height: hp(10), justifyContent: "center", alignItems: "center", marginBottom: hp(2) }}>
        <ContentLoader
          speed={1.5}
          width={wp(100)}
          height={hp(10)}
          backgroundColor="#e0e0e0"
          foregroundColor="#f5f5f5"
        >
          {/* Skeleton for Header Text */}
          <Rect x="20%" y="40%" rx="6" ry="6" width="60%" height="12" />
        </ContentLoader>
      </View>

      {/* Skeleton for Order Cards */}
      <FlatList
        data={[...Array(7)]} // Show 7 skeleton items
        keyExtractor={(item, index) => index.toString()}
        renderItem={() => (
          <View
            style={{
              backgroundColor: "white",
              borderRadius: wp(4),
              padding: wp(1),
              marginBottom: hp(1),
              borderWidth: 1,
              borderColor: "#EAEAEA",
              marginHorizontal: wp(1),
              shadowColor: "#0000001A",
              shadowOpacity: 0.2,
              shadowOffset: { width: 0, height: 1 },
              shadowRadius: 5,
              elevation: 4,
            }}
          >
            <ContentLoader
              speed={1.5}
              width={wp(100)}
              height={hp(11)} // Reduced height here
              backgroundColor="#e0e0e0"
              foregroundColor="#f5f5f5"
            >
              {/* Skeleton for Left Icon */}
              <Rect x="2%" y="30%" rx="6" ry="6" width="10%" height="35%" />
          
              {/* Skeleton for Notification Type */}
              <Rect x="15%" y="20%" rx="6" ry="6" width="40%" height="12" />
          
              {/* Skeleton for Order Number */}
              <Rect x="15%" y="40%" rx="4" ry="4" width="35%" height="10" />
          
              {/* Skeleton for Customer ID */}
              <Rect x="15%" y="60%" rx="4" ry="4" width="50%" height="10" />
          
              {/* Skeleton for More Options Icon */}
              <Rect x="85%" y="30%" rx="5" ry="5" width="2%" height="30" />
            </ContentLoader>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: hp(4) }}
      />
    </View>
  );
};

export default ReminderScreenSkeleton;





