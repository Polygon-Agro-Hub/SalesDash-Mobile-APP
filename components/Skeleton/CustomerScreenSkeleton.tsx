import React from "react";
import { View, FlatList } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";

const CustomersScreenSkeleton: React.FC = () => {
  return (
    <View className="flex-1 bg-white">
      {/* Header Skeleton */}
     
  <ContentLoader
        speed={1.5}
        width={wp(90)}
        height={hp(7)}
        backgroundColor="#e0e0e0"
        foregroundColor="#f5f5f5"
        style={{
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Rect 
          x={wp(25)} 
          y="20" 
          rx="6" 
          ry="6" 
          width={wp(40)} 
          height={hp(2)} 
        />
      </ContentLoader>



      {/* Skeleton for Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "white",
          borderRadius: wp(10),
          padding: wp(3),
          marginBottom: hp(2),
          shadowColor: "#0000001A",
          shadowOpacity: 0.2,
          shadowOffset: { width: 0, height: 2 },
          shadowRadius: 5,
          elevation: 5,
        }}
      >
        <ContentLoader speed={1.5} width={wp(70)} height={hp(4)} backgroundColor="white" foregroundColor="#f5f5f5">
          <Rect x="10" y="8" rx="20" ry="20" width={wp(70)} height={hp(5)} />
        </ContentLoader>
        <Circle cx={wp(85)} cy={hp(4)} r={hp(2)} />
      </View>


      {/* Customer List Skeleton */}
      <FlatList
        data={[...Array(7)]}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ paddingBottom: 120 }}
        renderItem={() => (
          <View className="bg-white shadow-md p-4 mb-3 mx-8 rounded-lg border border-gray-200">
            <ContentLoader speed={1.5} width={wp(90)} height={50} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
              <Rect x="0" y="10" rx="4" ry="4" width="40%" height="10" />
              <Rect x="0" y="35" rx="4" ry="4" width="35%" height="10" />
              <Rect x="78%" y="20" rx="4" ry="4" width="4%" height="20" />
            </ContentLoader>
          </View>
        )}
      />
    </View>
  );
};

export default CustomersScreenSkeleton;
