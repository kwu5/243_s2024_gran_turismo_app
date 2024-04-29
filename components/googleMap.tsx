import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { LatLng, Marker, Region } from "react-native-maps";
import Geolocation from "@react-native-community/geolocation";
import React from "react";

interface googleMapProps {
  region: Region;
  setRegion: (region: Region) => void;
}

export const getInitialState = (): { region: Region } => {
  return {
    region: {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    },
  };
};

//   const onRegionChange = (region: State['region']) => {
//     this.setState({ region });
//   };

//   render() {
//     return (
//       <MapView
//         region={this.state.region}
//         onRegionChange={this.onRegionChange}
//       />
//     );
//   }

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
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 1000 }
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
    width: "70%",
    height: "70%",
  },
});
