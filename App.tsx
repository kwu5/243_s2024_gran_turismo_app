import { StatusBar } from "expo-status-bar";
import {
  StyleSheet,
  Text,
  View,
  PermissionsAndroid,
  Platform,
  Alert,
} from "react-native";
import { Device, Subscription } from "react-native-ble-plx";
import React, { useEffect, useState } from "react";

import { BleManager, Characteristic, LogLevel } from "react-native-ble-plx";
import base64 from "react-native-base64";
import GoogleMap, { getInitialLatLng } from "./components/googleMap";
import { Region, LatLng } from "react-native-maps";
import DataDisplayView from "./components/DataDisplayView";
import Button from "./components/Button";

let characteristicReference: Characteristic | undefined = undefined;
let deviceConnected: Device | null = null;

type PermissionStatus = "granted" | "denied" | "never_ask_again";
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

  return false;
};

export default function App() {
  let bluetoothManager: BleManager;
  let sensor_index = 0;

  const [currentLocation, setCurrentLocation] = useState<LatLng>(
    getInitialLatLng().latlng
  );
  const [destination, setDestination] = useState<LatLng>(
    getInitialLatLng().latlng
  );
  const [goState, setGostate] = useState(false);
  const [sensorData, setSensorData] = useState({
    str1: " ",
    str2: " ",
    str3: " ",
  });
  const [BLEconnected, setBLEconnected] = useState(false);

  useEffect(() => {
    bluetoothManager = new BleManager();
    const bluetooth_init = async () => {
      requestBluetoothPermission().then((result) => {
        console.log("RequestBluetoothPermission on this device is " + [result]);
        if (result) {
          console.log("Scanning for devices");

          bluetoothManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
              console.error("Scan failed", error);
              return;
            }

            if (device && device.name === "DSD TECH") {
              bluetoothManager.stopDeviceScan();
              device
                .connect()
                .then(async (device) => {
                  deviceConnected = device;
                  console.log("Connected to device: ", device.id);
                  Alert.alert("Connected to device: ", device.id);
                  await subscribleBLE();

                  return device.discoverAllServicesAndCharacteristics();
                })

                .then((device) => {
                  return device.services();
                })
                .then((services) => {
                  const promises = services.map((service) =>
                    service.characteristics()
                  );
                  return Promise.all(promises);
                })
                .then((characteristicsNestedArray) => {
                  const characteristics = characteristicsNestedArray.flat();
                  characteristicReference = characteristics.find(
                    (char) =>
                      char.uuid === "0000ffe1-0000-1000-8000-00805f9b34fb"
                  );

                  if (deviceConnected) startReadBLEData(deviceConnected);
                  setBLEconnected(true);
                })
                .catch((error) => {
                  console.error("Connection failed", error);
                });
            }
          });
        }
      });
    };

    const subscribleBLE = async () => {
      // console.log("subscribleBLE: Subscribing to BLE events");
      if (!deviceConnected) {
        return;
      }
      bluetoothManager.onDeviceDisconnected(
        deviceConnected.id,
        (error, device) => {
          if (error) {
            console.error(
              "subscribleBLE: An error occurred while disconnecting",
              error
            );
            return;
          }
          setBLEconnected(false);
          console.log(`Device ${device?.id} has disconnected`);
          Alert.alert("Device has disconnected, attempting to reconnect");
          // reconnectToDevice(device);
        }
      );
    };

    bluetooth_init();

    return () => {
      bluetoothManager.destroy();
    };
  }, []);

  const updateData = (bridgedata: string): void => {
    if (typeof bridgedata != "string") {
      console.warn(": Expected bridgedata to be a string");
      return;
    }

    const regionArray = bridgedata.split(/[:,\n]/);

    if (regionArray.length < 2) {
      console.warn(
        "updateData: Expected bridgedata to have at least 2 elements"
      );
      return;
    }

    if (regionArray[0] == "LAT") {
      const latitude_update = parseFloat(regionArray[1]);
      // console.log("latitude_update: ", latitude_update);
      setCurrentLocation((prevState) => ({
        ...prevState,
        latitude: latitude_update,
      }));
    } else if (regionArray[0] == "LONG") {
      const longitude_update = parseFloat(regionArray[1]);
      // console.log("longitude_update: ", longitude_update);
      setCurrentLocation((prevState) => ({
        ...prevState,
        longitude: longitude_update,
      }));
    } else {
      if (sensor_index == 0) {
        setSensorData((prevState) => ({
          ...prevState,
          str1: bridgedata,
        }));
      } else if (sensor_index == 1) {
        setSensorData((prevState) => ({
          ...prevState,
          str2: bridgedata,
        }));
      } else if (sensor_index == 2) {
        setSensorData((prevState) => ({
          ...prevState,
          str3: bridgedata,
        }));
      }
      sensor_index++;
      if (sensor_index > 2) {
        sensor_index = 0;
      }
    }
  };

  async function writeBLEData(data: string): Promise<void> {
    if (
      !characteristicReference ||
      characteristicReference == null ||
      !characteristicReference.isWritableWithoutResponse
    ) {
      console.warn("writeBLEData: No characteristic reference available.");
      return;
    }

    try {
      const encodedData = base64.encode(data);
      await characteristicReference.writeWithoutResponse(encodedData);
      console.log("Data has been written to BLE without response: ", data);
    } catch (error) {
      console.error("Failed to write data to BLE without response:", error);
    }
  }

  async function startReadBLEData(device: Device): Promise<void> {
    try {
      if (device && characteristicReference) {
        bluetoothManager.monitorCharacteristicForDevice(
          device.id,
          "0000ffe0-0000-1000-8000-00805f9b34fb",
          characteristicReference.uuid,
          (error, characteristic) => {
            if (error) {
              console.error("Reading data fail", error);
              return;
            }
            if (characteristic && characteristic.value) {
              const decodedData = base64.decode(characteristic.value);
              // console.log("Data received: ", decodedData);
              updateData(decodedData);
            }
          }
        );
      } else {
        console.warn("BLE CharacteristicReference is undefined");
      }
    } catch (error) {
      console.error("Failed to read data from BLE:", error);
    }
  }

  const onClicksendEmergencyStop = async () => {
    writeBLEData(`STOP\n`);
    setGostate(false);
    Alert.alert(`Command sent: EMERGENCY STOP`);
  };

  const onClicksendData = async () => {
    if (!goState) {
      writeBLEData(`GO!!\n`);
      writeBLEData(`LAT:${destination.latitude.toFixed(6)}\n`);
      writeBLEData(`LONG:${destination.longitude.toFixed(6)}\n`);
      Alert.alert(
        `Destination sent: ${destination.latitude.toFixed(
          6
        )},${destination.longitude.toFixed(6)}`
      );
    } else {
      writeBLEData(`STOP\n`);
      Alert.alert(`Command sent: STOP`);
    }
    setGostate(!goState);
  };

  const onClickDestinationChange = (data: any) => {
    if (data) {
      if (goState) {
        console.log("data lat: ", data.latitude);
        console.log("data long: ", data.longitude);
        writeBLEData(`LAT:${data.latitude.toFixed(6)}\n`);
        writeBLEData(`LONG:${data.longitude.toFixed(6)}\n`);
        Alert.alert(
          `data sent: ${data.latitude.toFixed(6)},${data.longitude.toFixed(6)}`
        );
      }
      setDestination({
        latitude: data.latitude,
        longitude: data.longitude,
      });
    }
  };

  return (
    <>
      <Text style={{ textAlign: "center", fontSize: 20, fontWeight: "bold" }}>
        BLE Connected: {BLEconnected ? "True" : "False"}
      </Text>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <GoogleMap
            destination={destination}
            currentLocation={currentLocation}
            onClickDestinationChange={onClickDestinationChange}
          />
        </View>

        <DataDisplayView
          destination={destination}
          currentLocation={currentLocation}
          sensorData={sensorData}
        />
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={goState ? "STOP" : "GO"}
          onPress={onClicksendData}
          isPressed={goState}
        />
        <Button
          title={"Emergency STOP"}
          onPress={onClicksendEmergencyStop}
          isPressed={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 6,
    marginTop: 50,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
  },
  buttonContainer: {
    flex: 1,
    marginTop: 50,
    paddingHorizontal: 20,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    alignItems: "baseline",
    justifyContent: "flex-start",
  },
  mapContainer: {
    width: "100%",
    flex: 1,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  zoomButtons: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "column",
    alignItems: "center",
  },
  button: {
    backgroundColor: "#FFFFFF",
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
