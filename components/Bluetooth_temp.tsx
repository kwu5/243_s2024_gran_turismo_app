
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Text,
  StyleSheet,
  View,
} from "react-native";
import base64 from "react-native-base64";
import ErrorToast from "./ErrorToast";
import { useEffect, useState } from "react";
import Button from "./Button";
import { Region } from "react-native-maps";
import React from "react";



interface BluetoothProp {
  // bluetoothManager: BleManager;
  destination: Region;
  setDestination: (region: Region) => void;
  setCurrentLocation: (region: Region) => void;
  currentLocation: Region;
}



export default function Bluetooth({
  currentLocation,
  setCurrentLocation,
  destination,
  setDestination,
}: BluetoothProp) {

  
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       //data1 and data2 are the lat and long that are read from the BLE characteristic in two separate reads
  //       const data1 = await readBLECharacteristic();
  //       const data2 = await readBLECharacteristic();
  //       if (data1) {
  //         const updatedCurrentLocation = updateCurrentLocation(data1);
  //         setCurrentLocation(updatedCurrentLocation);
  //       }
  //       if (data2) {
  //         const updatedCurrentLocation = updateCurrentLocation(data2);
  //         setCurrentLocation(updatedCurrentLocation);
  //       }
  //     } catch (error) {
  //       console.error("Failed to read BLE characteristic: ", error);
  //       Alert.alert("Failed to read data");
  //     }
  //   };

  //   const intervalId = setInterval(() => {
  //     fetchData();
  //   }, 1500);

  //   return () => {
  //     clearInterval(intervalId);
  //   };
  // }, []);

  // useEffect(() => {

  // }, [go]);

 

  return (
    
  );
}

const styles = StyleSheet.create({
  
});
