import {
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
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
  deviceName: string | null;
  deviceId: string | null;
  serviceUUID: string | null;
  characteristicUUID: string | null;
  destination: Region;
  setDestination: (region: Region) => void;
  setCurrentLocation: (region: Region) => void;
  currentLocation: Region;
}

export default function Bluetooth({
  deviceName,
  deviceId,
  serviceUUID,
  characteristicUUID,
  currentLocation,
  setCurrentLocation,
  destination,
  setDestination,
}: BluetoothProp) {
  return (
    <View style={styles.bluetooth}>
      {deviceId ? <Text>{deviceId}</Text> : <Text>Device ID not provided</Text>}
      <Button title={go ? "STOP" : "GO"} onPress={() => setGo(!go)} />
    </View>
  );
}

const styles = StyleSheet.create({});
