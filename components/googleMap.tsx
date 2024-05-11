import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import React from "react";

interface googleMapProps {
  region: Region;
  setRegion: (region: Region) => void;
}

/**
 * North garage: 37.33934779382195, -121.88073942010605
 */

export const getInitialState = (): { region: Region } => {
  return {
    region: {
      latitude: 37.33935,
      longitude: -121.88074,
      latitudeDelta: 0.0022,
      longitudeDelta: 0.0021,
    },
  };
};

export default function GoogleMap({ region, setRegion }: googleMapProps) {
  //   const [region, setRegion] = useState<Region>(getInitialState().region);
  const [marker, setMarker] = useState<LatLng>();

  useEffect(() => {
    Geolocation.getCurrentPosition(
      (position) => {
        setRegion({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      },
      (error) =>
        console.log(
          "getCurrentPosition fail, use default location, error:",
          error.message
        ),
      { enableHighAccuracy: true, timeout: 3000, maximumAge: 1000 }
    );
    console.log("Map: initalizing current location.");
  }, []);

  return (
    <MapView
      style={styles.map}
      provider="google"
      initialRegion={region}
      onRegionChange={(region) => setRegion(region)}
      onPress={(e) => {
        console.log(e.nativeEvent.coordinate);
        setMarker(e.nativeEvent.coordinate);
        setRegion({
          ...region,
          latitude: e.nativeEvent.coordinate.latitude,
          longitude: e.nativeEvent.coordinate.longitude,
        });
      }}
    >
      {marker && <Marker coordinate={marker} />}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    width: "90%",
    height: "90%",
  },
});
