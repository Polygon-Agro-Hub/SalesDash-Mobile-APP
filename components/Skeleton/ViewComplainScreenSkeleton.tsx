// import React from "react";
// import { View, FlatList } from "react-native";
// import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
// import ContentLoader, { Circle, Rect } from "react-content-loader/native";

// const ComplaintHistorySkeleton = () => {
//   return (
//     <View style={{ flex: 1, backgroundColor: "#F5F5F5", padding: wp(4) }}>
//       {/* Header Skeleton */}
//       <Circle cx="10%" cy="43" r="20" />
//       <View style={{ height: hp(10), justifyContent: "center", alignItems: "center", marginBottom: hp(2) }}>
//         <ContentLoader speed={1.5} width={wp(100)} height={hp(8)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
//           <Rect x="20%" y="30%" rx="6" ry="6" width="60%" height="18" />
//         </ContentLoader>
//       </View>
      
//       {/* Complaints List Skeleton */}
//       <FlatList
//         data={[...Array(4)]} // Placeholder array for skeleton items
//         keyExtractor={(item, index) => index.toString()}
//         renderItem={() => (
//           <View style={{ backgroundColor: "white", padding: wp(4), borderRadius: 8, marginBottom: hp(2), shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}>
//             <ContentLoader speed={1.5} width={wp(90)} height={hp(15)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
//               {/* Reference number placeholder */}
//               <Rect x="0" y="10" rx="4" ry="4" width="70%" height="12" />
//               {/* Date and time placeholder */}
//               <Rect x="0" y="30" rx="4" ry="4" width="50%" height="10" />
//               {/* Complaint description placeholder */}
//               <Rect x="0" y="50" rx="4" ry="4" width="100%" height="40" />
//               {/* Status and Button placeholders */}
//               <Rect x="0" y="100" rx="4" ry="4" width="30%" height="12" />
//               <Rect x="70%" y="100" rx="4" ry="4" width="20%" height="12" />
//             </ContentLoader>
//           </View>
//         )}
//       />
//     </View>
//   );
// };

// export default ComplaintHistorySkeleton;



import React from "react";
import { View, FlatList, Text } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";

const ComplaintHistorySkeleton = () => {
  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5", padding: wp(4) }}>
      {/* Header Skeleton */}
      <ContentLoader speed={1.5} width={wp(100)} height={hp(8)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
        <Circle cx={wp(6)} cy={hp(4)} r={hp(2.5)} />
        <Rect x="25%" y="30%" rx="6" ry="6" width="50%" height="18" />
      </ContentLoader>

      {/* Complaints List Skeleton */}
      <FlatList
        data={Array.from({ length: 4 }, (_, index) => ({ id: index }))}
        keyExtractor={(item) => item.id.toString()}
        renderItem={() => (
          <View style={{ backgroundColor: "white", padding: wp(4), borderRadius: 8, marginBottom: hp(2), shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 }}>
            <ContentLoader speed={1.5} width={wp(90)} height={hp(15)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
              {/* Reference number placeholder */}
              <Rect x="0" y="10" rx="4" ry="4" width="70%" height="12" />
              {/* Date and time placeholder */}
              <Rect x="0" y="30" rx="4" ry="4" width="50%" height="10" />
              {/* Complaint description placeholder */}
              <Rect x="0" y="50" rx="4" ry="4" width="100%" height="40" />
              {/* Status and Button placeholders */}
              <Rect x="0" y="100" rx="4" ry="4" width="30%" height="12" />
              <Rect x="70%" y="100" rx="4" ry="4" width="20%" height="12" />
            </ContentLoader>
          </View>
        )}
      />
    </View>
  );
};

export default ComplaintHistorySkeleton;


