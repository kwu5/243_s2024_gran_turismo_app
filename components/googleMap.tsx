import { useEffect, useState } from "react";
import { StyleSheet, View, Text } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import React from "react";

interface googleMapProps {
  destination: LatLng;
  currentLocation: LatLng;
  onClickDestinationChange: (data: any) => void;
}

const checkptr: LatLng = {
  latitude: 37.339207,
  longitude: -121.8807834,
};

const checkptr2: LatLng = {
  latitude: 37.3391488,
  longitude: -121.880452,
};
const checkptr3: LatLng = {
  latitude: 37.33939,
  longitude: -121.880593,
};

const checkptr4: LatLng = {
  latitude: 37.3393568,
  longitude: -121.8810345,
};

const checkptr5: LatLng = {
  latitude: 37.3395098,
  longitude: -121.8810304,
};

const checkptr6: LatLng = {
  latitude: 37.3390484,
  longitude: -121.8806798,
};

/**
 * North garage: 37.33934779382195, -121.88073942010605
 * Use North garage as the initial location
 */
export const getInitialLatLng = (): { latlng: LatLng } => {
  return {
    latlng: {
      latitude: 37.33935,
      longitude: -121.88074,
    },
  };
};

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

export default function GoogleMap({
  currentLocation,
  destination,
  onClickDestinationChange,
}: googleMapProps) {
  return (
    <>
      <MapView
        style={styles.map}
        provider="google"
        mapType="satellite"
        initialRegion={getInitialRegion().region}
        onPress={(e) => {
          console.log(e.nativeEvent.coordinate);
          onClickDestinationChange({
            latitude: e.nativeEvent.coordinate.latitude,
            longitude: e.nativeEvent.coordinate.longitude,
          });
        }}
      >
        {destination && <Marker coordinate={destination} />}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            image={require("../assets/images/Map-Marker.png")}
          />
        )}
        <Marker
          coordinate={checkptr}
          image={require("../assets/images/checkptr.png")}
        />
        <Marker
          coordinate={checkptr2}
          image={require("../assets/images/checkptr.png")}
        />
        <Marker
          coordinate={checkptr3}
          image={require("../assets/images/checkptr.png")}
        />
        <Marker
          coordinate={checkptr4}
          image={require("../assets/images/checkptr.png")}
        />
        <Marker
          coordinate={checkptr5}
          image={require("../assets/images/checkptr.png")}
        />
        <Marker
          coordinate={checkptr6}
          image={require("../assets/images/checkptr.png")}
        />
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
