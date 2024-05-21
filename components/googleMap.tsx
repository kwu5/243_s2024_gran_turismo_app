import { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import React from "react";

interface googleMapProps {
  destination: LatLng;
  setDestination: (latLng: LatLng) => void;
  currentLocation: Region;
  setCurrentLocation: (region: Region) => void;
  handleDestinationChange: (data: any) => void;
}

/**
 * North garage: 37.33934779382195, -121.88073942010605
 * Use North garage as the initial location
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

const regionToLatLng = (region: LatLng): LatLng => {
  return {
    latitude: region.latitude,
    longitude: region.longitude,
  };
};

export default function GoogleMap({
  currentLocation,
  destination,
  setDestination,
  handleDestinationChange,
}: googleMapProps) {
  return (
    <>
      {/* <Text>{currentLocation.latitude + " " + currentLocation.longitude}</Text> */}
      <MapView
        style={styles.map}
        provider="google"
        mapType="satellite"
        initialRegion={getInitialRegion().region}
        onPress={(e) => {
          console.log(e.nativeEvent.coordinate);
          // setTimeout(changeDestin, 1000);
          // setDestination({
          //   ...destination,
          //   latitude: e.nativeEvent.coordinate.latitude,
          //   longitude: e.nativeEvent.coordinate.longitude,
          // });
          handleDestinationChange({
            latitude: e.nativeEvent.coordinate.latitude,
            longitude: e.nativeEvent.coordinate.longitude,
          });
        }}
      >
        {destination && <Marker coordinate={destination} />}
        {currentLocation && (
          <Marker
            coordinate={regionToLatLng(currentLocation)}
            image={require("../assets/images/Map-Marker.png")}
          />
        )}
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
