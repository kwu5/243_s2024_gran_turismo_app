import React, { useState } from "react";
import { Region, LatLng } from "react-native-maps";

import { Text, View, StyleSheet } from "react-native";

export interface DataDisplayProps {
  destination: LatLng;
  currentLocation: Region;
  sensorData: any;
}

export default function DataDisplayView({
  destination,
  currentLocation,
  sensorData,
}: DataDisplayProps) {
  const { str1, str2, str3 } = sensorData;
  const concatenatedString = str1 + str2 + str3;

  return (
    <View style={styles.textContainer}>
      {
        <Text>
          currentLocation:
          <Text style={styles.data}>{currentLocation.latitude}</Text>,
          <Text style={styles.data}>{currentLocation.longitude}</Text>
        </Text>
      }
      {
        <Text>
          destination:<Text style={styles.data}>{destination.latitude}</Text>,
          <Text style={styles.data}>{destination.longitude}</Text>
        </Text>
      }
      {
        <Text>
          sensorData:<Text style={styles.data}>{concatenatedString}</Text>
        </Text>
      }
    </View>
  );
}

const styles = StyleSheet.create({
  textContainer: {
    backgroundColor: "#D3D3D3",
    justifyContent: "flex-start",
  },

  data: {
    color: "red",
  },
});
