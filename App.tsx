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
import GoogleMap, { getInitialRegion } from "./components/googleMap";
import { Region, LatLng } from "react-native-maps";
import DataDisplayView from "./components/DataDisplayView";
import Button from "./components/Button";

type PermissionStatus = "granted" | "denied" | "never_ask_again";

let characteristicReference: Characteristic | undefined = undefined;
let deviceConnected: Device | null = null;

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
  let counter = 0;

  const [currentLocation, setCurrentLocation] = useState<Region>(
    getInitialRegion().region
  );
  const [destination, setDestination] = useState<LatLng>(
    getInitialRegion().region
  );
  const [goState, setGostate] = useState(false);
  // const [device, setDevice] = useState<Device | null>(null);
  const [sensorData, setSensorData] = useState({
    str1: " ",
    str2: " ",
    str3: " ",
  });

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
              // bluetoothManager.setLogLevel(LogLevel.Verbose);

              device
                .connect()
                .then(async (device) => {
                  deviceConnected = device;
                  console.log("Connected to device: ", device.id);
                  Alert.alert("Connected to device: ", device.id);
                  await subscriptBLE();

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

                  if (deviceConnected)
                    startReadBLECharacteristic(deviceConnected);
                })
                .catch((error) => {
                  console.error("Connection failed", error);
                });
            }
          });
        }
      });
    };

    const subscriptBLE = async () => {
      // console.log("subscriptBLE: Subscribing to BLE events");
      if (!deviceConnected) {
        return;
      }
      bluetoothManager.onDeviceDisconnected(
        deviceConnected.id,
        (error, device) => {
          if (error) {
            console.error(
              "subscriptBLE: An error occurred while disconnecting",
              error
            );
            return;
          }
          console.log(`Device ${device?.id} has disconnected`);
          Alert.alert("Device has disconnected, attempting to reconnect");
          reconnectToDevice(device);
        }
      );
    };

    bluetooth_init();

    return () => {
      bluetoothManager.destroy();
      // clearInterval(intervalId);
    };
  }, []);

  const updateLogdata = (bridgedata: string): void => {
    if (typeof bridgedata != "string") {
      console.warn(": Expected bridgedata to be a string");
      return;
    }

    const regionArray = bridgedata.split(/[:,\n]/);
    // console.log("updateLogdata: ", regionArray);

    if (regionArray.length < 2) {
      console.warn(
        "updateLogdata: Expected bridgedata to have at least 2 elements"
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
      if (counter == 0) {
        setSensorData((prevState) => ({
          ...prevState,
          str1: bridgedata,
        }));
      } else if (counter == 1) {
        setSensorData((prevState) => ({
          ...prevState,
          str2: bridgedata,
        }));
      } else if (counter == 2) {
        setSensorData((prevState) => ({
          ...prevState,
          str3: bridgedata,
        }));
      }
      //  else if (counter == 3) {
      //   setSensorData((prevState) => ({
      //     ...prevState,
      //     str4: bridgedata,
      //   }));
      // }
      counter++;
      if (counter > 2) {
        counter = 0;
      }
    }
  };

  async function writeBLECharacteristic(data: string): Promise<void> {
    if (
      !characteristicReference ||
      characteristicReference == null ||
      !characteristicReference.isWritableWithoutResponse
    ) {
      console.warn(
        "writeBLECharacteristic: No characteristic reference available."
      );
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

  async function startReadBLECharacteristic(device: Device): Promise<void> {
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

              updateLogdata(decodedData);

              // checkReachDestination();
            }
          }
        );
      }
    } catch (error) {
      console.error("Failed to read data from BLE:", error);
    }
  }

  const reconnectToDevice = async (device: Device | null): Promise<void> => {
    if (!device) {
      console.error("reconnectToDevice: Device is undefined");
      return;
    }
    try {
      await bluetoothManager.connectToDevice(device.id);
      console.log("Device has been reconnected");
      Alert.alert("Device has been reconnected");

      // startReadBLECharacteristic(deviceConnected);
    } catch (error) {
      console.error("Failed to reconnect to device:", error);
    }
  };

  const sendEmergencyStop = async () => {
    writeBLECharacteristic(`STOP\n`);
    setGostate(false);
    Alert.alert(`EMERGENCY STOP!!`);
  };

  const handleSendData = async () => {
    if (!goState) {
      writeBLECharacteristic(`GO!!\n`);
      writeBLECharacteristic(`LAT:${destination.latitude.toFixed(6)}\n`);
      writeBLECharacteristic(`LONG:${destination.longitude.toFixed(6)}\n`);

      Alert.alert(
        `data sent: ${destination.latitude.toFixed(
          6
        )},${destination.longitude.toFixed(6)}`
      );
    } else {
      writeBLECharacteristic(`STOP\n`);
      Alert.alert(`STOP!!`);
    }

    setGostate(!goState);
  };

  const handleDestinationChange = (data: any) => {
    if (data) {
      if (goState) {
        console.log("data lat: ", data.latitude);
        console.log("data long: ", data.longitude);
        writeBLECharacteristic(`LAT:${data.latitude.toFixed(6)}\n`);
        writeBLECharacteristic(`LONG:${data.longitude.toFixed(6)}\n`);
        setDestination({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        Alert.alert(
          `data sent: ${data.latitude.toFixed(6)},${data.longitude.toFixed(6)}`
        );
      } else {
        setDestination({
          latitude: data.latitude,
          longitude: data.longitude,
        });
      }
    } else {
      console.log("data lat: ", destination.latitude);
      console.log("data long: ", destination.longitude);

      writeBLECharacteristic(`LAT:${destination.latitude.toFixed(6)}\n`);
      writeBLECharacteristic(`LONG:${destination.longitude.toFixed(6)}\n`);
    }
  };

  return (
    <>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <View style={styles.mapContainer}>
          <GoogleMap
            destination={destination}
            setDestination={setDestination}
            currentLocation={currentLocation}
            setCurrentLocation={setCurrentLocation}
            handleDestinationChange={handleDestinationChange}
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
          onPress={handleSendData}
          isPressed={goState}
        />
        <Button
          title={"Emergency STOP"}
          onPress={sendEmergencyStop}
          isPressed={false}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 7,
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
    // backgroundColor: "#808080",
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
