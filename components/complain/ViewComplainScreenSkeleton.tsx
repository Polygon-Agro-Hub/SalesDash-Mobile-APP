import React from "react";
import { View, FlatList, Dimensions } from "react-native";
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";
import ContentLoader, { Rect, Circle } from "react-content-loader/native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const ComplaintHistorySkeleton = () => {
  return (
    <View className="flex-1 bg-white">
      {/* Complaints List Skeleton wrapped in responsive container */}
      <View className="flex-1 px-6">
        <View className="flex-1 mx-auto w-full max-w-[500px] mt-4">
          <FlatList
            data={Array.from({ length: 5 }, (_, index) => ({ id: index }))}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={() => (
              <View className="bg-white shadow-md p-4 mb-4 border border-gray-200 rounded-lg">
                <ContentLoader
                  speed={1.5}
                  width="100%"
                  height={130}
                  backgroundColor="#e0e0e0"
                  foregroundColor="#f5f5f5"
                >
                  {/* Reference number placeholder */}
                  <Rect x="0" y="0" rx="4" ry="4" width="60%" height="18" />
                  
                  {/* Date and time placeholder */}
                  <Rect x="0" y="25" rx="4" ry="4" width="40%" height="12" />
                  
                  {/* Complaint description placeholder */}
                  <Rect x="0" y="55" rx="4" ry="4" width="100%" height="14" />
                  <Rect x="0" y="75" rx="4" ry="4" width="85%" height="14" />
                  
                  {/* Bottom section (View Response & Status) */}
                  <Rect x="0" y="110" rx="6" ry="6" width="35%" height="20" />
                  <Rect x="75%" y="110" rx="6" ry="6" width="25%" height="20" />
                </ContentLoader>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
};

export default ComplaintHistorySkeleton;
