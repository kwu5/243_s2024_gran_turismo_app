import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function App() {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  const handleMapPress = (event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    console.log('Latitude:', latitude);
    console.log('Longitude:', longitude);
  };

  const handleZoomIn = () => {
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta / 2,
      longitudeDelta: region.longitudeDelta / 2,
    });
  };

  const handleZoomOut = () => {
    setRegion({
      ...region,
      latitudeDelta: region.latitudeDelta * 2,
      longitudeDelta: region.longitudeDelta * 2,
    });
  };

  return (
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <MapView
              style={styles.map}
              initialRegion={region}
              onPress={handleMapPress}
          >
            <Marker coordinate={{ latitude: region.latitude, longitude: region.longitude }} />
          </MapView>
        </View>
        <View style={styles.zoomButtons}>
          <TouchableOpacity style={styles.button} onPress={handleZoomIn}>
            <Text>Zoom In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleZoomOut}>
            <Text>Zoom Out</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.textContainer}>
          <Text>Hello world!</Text>
        </View>
        <StatusBar style="auto" />
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    height: '50%', // Adjust the height as needed
  },
  map: {
    width: '100%',
    height: '50%',
  },
  zoomButtons: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 5,
    marginVertical: 5,
  },
  textContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 10,
    borderRadius: 5,
    zIndex: 999,
  },
});