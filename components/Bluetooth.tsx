import {
  BleManager,
  Characteristic,
  Device,
  Subscription,
} from "react-native-ble-plx";
import { Alert, PermissionsAndroid, Platform, Text } from "react-native";
import base64 from "react-native-base64";
import ErrorToast from "./ErrorToast";
import { Children, useEffect, useState } from "react";
import Button from "./Button";
import { Region } from "react-native-maps";
import React from "react";

type PermissionStatus = "granted" | "denied" | "never_ask_again";

const bluetoothManager = new BleManager();
let characteristicReference: Characteristic | null = null;
let notificationSubscription: Subscription | null = null;

interface BluetoothProp {
  deviceName: string | null;
  deviceId: string | null;
  serviceUUID: string | null;
  characteristicUUID: string | null;
  region: Region;
}

const requestBluetoothPermission = async () => {
  if (Platform.OS === "ios") {
    console.log("ios platform detected");
    return true;
  }

  if (
    Platform.OS === "android" &&
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  ) {
    const apiLevel = parseInt(Platform.Version.toString(), 10);

    if (apiLevel < 31) {
      const granted: PermissionStatus = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    if (
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN &&
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    ) {
      const result: Record<string, PermissionStatus> =
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);

      return (
        result["android.permission.BLUETOOTH_CONNECT"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result["android.permission.BLUETOOTH_SCAN"] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        result["android.permission.ACCESS_FINE_LOCATION"] ===
          PermissionsAndroid.RESULTS.GRANTED
      );
    }
  }
  ErrorToast("BLE Permission have not been granted");
  return false;
};

const initBluetooth = async ({
  deviceName,
  deviceId,
  serviceUUID,
  characteristicUUID,
}: BluetoothProp) => {
  bluetoothManager.startDeviceScan(null, null, async (error, device) => {
    if (error) {
      console.error("ScanAndConnect failed: ", error);
      return false;
    }

    if (device && (device.name == deviceName || device.id == deviceId)) {
      bluetoothManager.stopDeviceScan();
      console.log(`Device found: ${device.name}, id: ${device.id}`);

      initBLEConnection(
        device,
        serviceUUID ? serviceUUID : "",
        characteristicUUID ? characteristicUUID : ""
      );
    }
    return false;
  });
};

async function initBLEConnection(
  device: Device,
  serviceUUID: string,
  characteristicUUID: string
): Promise<boolean> {
  try {
    const connectedDevice = await device.connect();
    await connectedDevice.discoverAllServicesAndCharacteristics();
    const services = await connectedDevice.services();

    for (const service of services) {
      console.log(`Service: ${service.uuid}`);
      const characteristics = await service.characteristics();
      for (const characteristic of characteristics) {
        console.log(`  Characteristic: ${characteristic.uuid}`);
      }
    }

    const customService = services.find((s) => s.uuid === serviceUUID);
    if (!customService) {
      console.error("Custom service: (FFE0) not found");
      return false;
    }

    const customCharacteristic = await customService.characteristics();
    const characteristic = customCharacteristic.find(
      (c) => c.uuid === characteristicUUID
    );
    if (!characteristic) {
      console.error("Custom characteristic: (FFE1) not found");
      return false;
    }

    characteristicReference = characteristic;
    return true;
  } catch (error) {
    console.error("Error in initBLEConnection: ", error);
    return false;
  }
}

async function readBLECharacteristic(): Promise<string | null> {
  if (characteristicReference == null) {
    return null;
  }

  notificationSubscription = characteristicReference.monitor(
    (error, characteristic) => {
      if (error) {
        console.error(
          "readBLECharacteristic: Error during notification setup:",
          error
        );
        return;
      }
      if (characteristic?.value) {
        const decodedData = base64.decode(characteristic.value);
        console.log("Received Notification with Decoded Data:", decodedData);
        return decodedData;
      }
    }
  );
  return null;
}

async function writeBLECharacteristic(data: string): Promise<void> {
  if (characteristicReference == null) {
    return;
  }

  const encodedData = base64.encode(data);
  await characteristicReference.writeWithoutResponse(encodedData);
  console.log("Data has been written to BLE: ", data);
}

function stopMonitoringBLECharacteristic() {
  if (notificationSubscription) {
    notificationSubscription.remove();
    notificationSubscription = null;
    console.log("Monitoring stopped.");
  } else {
    console.log("No monitoring to stop.");
  }
}

export default function Bluetooth({
  deviceName,
  deviceId,
  serviceUUID,
  characteristicUUID,
  region,
}: BluetoothProp) {
  const [go, setGo] = useState(false);
  // const [isConnected, setIsConnected] = useState(false);
  const [readMode, setreadMode] = useState(true);

  useEffect(() => {
    requestBluetoothPermission().then((result) => {
      console.log(
        "Android detected, requestBluetoothPermission is " + [result]
      );
      if (result) {
        console.log("Scanning for devices");
        initBluetooth({
          deviceName,
          deviceId,
          serviceUUID,
          characteristicUUID,
          region,
        });
      }
    });
  }, []);

  // useEffect(() => {
  //   if (deviceId) {
  //     const checkConnection = async () => {
  //       const isConnected = await bluetoothManager.isDeviceConnected(deviceId);
  //       setIsConnected(isConnected);
  //     };

  //     checkConnection();
  //   }
  // }, [deviceId]);

  useEffect(() => {
    if (go) {
      stopMonitoringBLECharacteristic();
      writeBLECharacteristic(
        `latitude:${region.latitude.toFixed(
          2
        )},longitude:${region.longitude.toFixed(2)}`
      );
      Alert.alert("command sent to device, reading data.");
      // setreadMode(false);
      readBLECharacteristic();
    } else {
      // readBLECharacteristic();
      // setreadMode(true);
      stopMonitoringBLECharacteristic();
      writeBLECharacteristic("STOP");
      Alert.alert("Car Stopped, monitoring stopped.");
    }
  }, [go]);

  return (
    <>
      {deviceId ? <Text>{deviceId}</Text> : <Text>Device ID not provided</Text>}
      <Button title={go ? "Stop" : "go"} onPress={() => setGo(!go)} />
    </>
  );
}
