import React, { useState } from "react";
import { Region } from "react-native-maps";
import { getInitialState } from "./googleMap";
import { Text } from "react-native";

export interface DataDisplayProps {
  region: Region;
  setRegion: (region: Region) => void;
  currentLocation: Region;
  setCurrentLocation: (region: Region) => void;
}

export default function DataDisplayView() {
  const [region, setRegion] = useState<Region>(getInitialState().region);
  const [currentLocation, setCurrentLocation] = useState<Region>(
    getInitialState().region
  );

  return (
    <>
      {
        <Text>
          currentLocation:{currentLocation.latitude},{currentLocation.longitude}
        </Text>
      }
    </>
  );
}
