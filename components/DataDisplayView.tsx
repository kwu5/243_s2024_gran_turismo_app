import React, { useState } from "react";
import { Region } from "react-native-maps";
import { getInitialState } from "./googleMap";
import { Text } from "react-native";

export interface DataDisplayProps {
  region: Region;
  // setRegion: (region: Region) => void;
  currentLocation: Region;
  // setCurrentLocation: (region: Region) => void;
}

export default function DataDisplayView({
  region,
  currentLocation,
}: DataDisplayProps) {
  return (
    <>
      {
        <Text>
          currentLocation:{currentLocation.latitude},{currentLocation.longitude}
        </Text>
      }
      {
        <Text>
          destination:{region.latitude},{region.longitude}
        </Text>
      }
    </>
  );
}
