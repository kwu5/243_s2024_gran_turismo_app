import React, { useState } from "react";
import { Region } from "react-native-maps";

import { Text, View, StyleSheet } from "react-native";

export interface DataDisplayProps {
  destination: Region;
  setDestination: (region: Region) => void;
  currentLocation: Region;
  setCurrentLocation: (region: Region) => void;
}

export default function DataDisplayView({
  destination,
  setDestination,
  currentLocation,
  setCurrentLocation,
}: DataDisplayProps) {
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
