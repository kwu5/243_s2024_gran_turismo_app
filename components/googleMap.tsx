import { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import React from "react";

interface googleMapProps {
  destination: Region;
  setDestination: (region: Region) => void;
  currentLocation: Region;
  setCurrentLocation: (region: Region) => void;
}

/**
 * North garage: 37.33934779382195, -121.88073942010605
 */

export const getInitialRegion = (): { region: Region } => {
  return {
    region: {
      latitude: 37.33935,
      longitude: -121.88074,
      latitudeDelta: 0.0022,
      longitudeDelta: 0.0021,
    },
  };
};

const regionToLatLng = (region: Region): LatLng => {
  return {
    latitude: region.latitude,
    longitude: region.longitude,
  };
};

export default function GoogleMap({
  currentLocation,

  destination,
  setDestination,
}: googleMapProps) {
  return (
    <>
      <Text>{currentLocation.latitude + " " + currentLocation.longitude}</Text>
      <MapView
        style={styles.map}
        provider="google"
        mapType="satellite"
        initialRegion={getInitialRegion().region}
        onPress={(e) => {
          console.log(e.nativeEvent.coordinate);

          setDestination({
            ...destination,
            latitude: e.nativeEvent.coordinate.latitude,
            longitude: e.nativeEvent.coordinate.longitude,
          });
        }}
      >
        <Marker coordinate={regionToLatLng(destination)} />
        {currentLocation &&
          currentLocation.latitude &&
          currentLocation.longitude && (
            <Marker
              coordinate={regionToLatLng(currentLocation)}
              image={require("../assets/images/Map-Marker.png")}
            />
          )}
        {/* <Marker
          coordinate={regionToLatLng(currentLocation)}
          image={require("../assets/images/Map-Marker.png")}
        /> */}
      </MapView>
    </>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "90%",
    height: "90%",
  },
});
