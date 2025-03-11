import React from "react";
import { FlatList, View, Text } from "react-native";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const OrderScreenSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, paddingHorizontal: wp(4), paddingVertical: hp(2), backgroundColor: "#F8F8F8" }}>
      {/* Skeleton for Header */}
      <ContentLoader speed={1.5} width={wp(90)} height={hp(7)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
        
        <Rect x="100" y="20" rx="6" ry="6" width={wp(40)} height={hp(2)} />
      </ContentLoader>

      {/* Skeleton for Search Bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
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

      {/* Skeleton for Filter Tabs */}
      <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: hp(2) }}>
        <ContentLoader speed={1.5} width={wp(30)} height={hp(4)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
          <Rect x="10" y="0" rx="20" ry="12" width={wp(20)} height={hp(4)} />
        </ContentLoader>
        <ContentLoader speed={1.5} width={wp(30)} height={hp(4)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
          <Rect x="15" y="0" rx="20" ry="12" width={wp(20)} height={hp(4)} />
        </ContentLoader>
        <ContentLoader speed={1.5} width={wp(30)} height={hp(4)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
          <Rect x="20" y="0" rx="20" ry="12" width={wp(20)} height={hp(4)} />
        </ContentLoader>
        <ContentLoader speed={1.5} width={wp(30)} height={hp(4)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
          <Rect x="25" y="0" rx="20" ry="12" width={wp(20)} height={hp(4)} />
        </ContentLoader>
      </View>

      {/* Skeleton for Order Cards */}
      <FlatList
        data={[...Array(6)]} // Show 5 skeleton items
        keyExtractor={(item, index) => index.toString()}
        renderItem={() => (
          <View
            // style={{
            //   backgroundColor: "white",
            //   borderRadius: wp(4),
            //   padding: wp(1),
            //   marginBottom: hp(1),
            //   borderWidth: 1,
            //   borderColor: "#EAEAEA",
            //   marginHorizontal: wp(1),
            //   shadowColor: "#0000001A",
            //   shadowOpacity: 0.2,
            //   shadowOffset: { width: 0, height: 1 },
            //   shadowRadius: 5,
            //   elevation: 5,
            // }}
            style={{
              backgroundColor: "white",
              borderRadius: wp(4),
              padding: wp(0.8),  // Reduced padding
              marginBottom: hp(0.8),  // Reduced bottom margin
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
            <ContentLoader speed={1.5} width={wp(100)} height={hp(10)} backgroundColor="#e0e0e0" foregroundColor="#f5f5f5">
              {/* Skeleton for Order Number */}
              <Rect x="10" y="10" rx="6" ry="6" width="20%" height="12" />
              {/* Skeleton for Status Badge */}
              <Rect x="65%" y="10" rx="10" ry="10" width="20%" height="20" />
              {/* Skeleton for Schedule */}
              <Rect x="10" y="40" rx="4" ry="4" width="35%" height="10" />
              {/* Skeleton for Time */}
              <Rect x="10" y="60" rx="4" ry="4" width="40%" height="10" />
            </ContentLoader>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: hp(4) }}
      />
    </View>
  );
};

export default OrderScreenSkeleton;
