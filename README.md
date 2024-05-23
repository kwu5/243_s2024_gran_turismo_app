# 243_s2024_gran_turismo_mobile_app
The project use : **React Native** with TypeScript and Expo. The app is used for project : http://socialledge.com/sjsu/index.php/S24:_Team_Gran_Turismo




### Feature

* Current destination location, check point locations are marked on the map.
* Sensor data are also shown in the app.
* Click on the map to mark a location and press 'GO' will send out the command and destination to the car. After data is send, the button title will change to "STOP". "Emergency STOP" button is also provided.

The command data sent from the app is either "GO!!" or "STOP". In the "GO!!" case, the app also render the destination data that the user mark on the app to the Bridge. Example of data sent will be "GO!!","LAT:37.720681","LONG: -122.422832","STOP".


### To run
* Install the .apk for physical device;
* For Android emulator, follow instruction from expo go custom build guideline.
 

### Reference
* https://dotintent.github.io/react-native-ble-plx/#introduction
* https://github.com/dotintent/react-native-ble-plx
