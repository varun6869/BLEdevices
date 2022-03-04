
import React, {
  useState,
  useEffect,
} from 'react'; 
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  NativeModules,
  NativeEventEmitter,
  Button,
  Platform,
  PermissionsAndroid,
  FlatList,
  TouchableHighlight,
  Image,
  TouchableOpacity,
  Icon,
} from 'react-native';

import {
  Colors,
} from 'react-native/Libraries/NewAppScreen';

import BleManager from 'react-native-ble-manager';  // need to import ble manager library

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);


const App = () => {
  const [isScanning, setIsScanning] = useState(false);
  const peripherals                 = new Map();
  const [list, setList]             = useState([]);
  const [spo2, setSpo2]             = useState("0")
  const [PR, setPR]                 = useState("0")
  const [PI, setPI]                 = useState("0")
  const [bpMax ,setbpMax]           = useState("0")
  const [bpMin, setbpMin]           = useState("0")
  const [heartRate, setheartRate]   = useState("0")
  const [weight, setWeight]         = useState("0")
  const [temp, setTemp]             = useState("0")
  const [ConnectedBp,setConnectedBp]      = useState("")
  const [ConnectedSpo2,setConnectedSpo2]  = useState("")
  const [ConnectedTemp,setConnectedTemp]  = useState("")
  const [ConnectedWeight,setConnectedWeight]  = useState("")

// service and characteristics of devices
  var bp_service              = '00001523-1212-efde-1523-785feabcd123';
  var bp_characteristics      = '00001524-1212-efde-1523-785feabcd123';

  var spo2_service            = 'cdeacb80-5235-4c07-8846-93a37ee6b86d';
  var spo2_Characteristic     = 'cdeacb81-5235-4c07-8846-93a37ee6b86d';


  /*
  var temp_service            = "cdeacb80-5235-4c07-8846-93a37ee6b86d";
  var temp_characteristics    = "cdeacb81-5235-4c07-8846-93a37ee6b86d";
  */
  var temp_service            = "0x2A05";
  var temp_characteristics    = "0x2902";


  var weight_service_0                   = '0000fff0';
  var weight_characterisitics_0          = '0000fff1';

  var weight_service          = '0000fff0-0000-1000-8000-00805f9b34fb';
  var weight_characterisitics = '0000fff1-0000-1000-8000-00805f9b34fb';


// scan for devices
  const startScan = () => {
    console.log("1")
    if (!isScanning) {
      BleManager.scan([], 10, true).then((results) => {
        console.log('Scanning...');
        setIsScanning(true);
        console.log("2")
      }).catch(err => {
        console.error(err);
      });
    }    
  }

//Stop scanning
  const handleStopScan = () => {
    console.log('Scan is stopped');
    setIsScanning(false);
  }

//To disconnnect the devices
  const handleDisconnectedPeripheral = (data) => {
    let peripheral = peripherals.get(data.peripheral);
    if (peripheral) {
      peripheral.connected = false;
      peripherals.set(peripheral.id, peripheral);
      setList(Array.from(peripherals.values()));
    }
    console.log('Disconnected from ' + data.peripheral);
  }


/*Temperature Data handling */ 
  const tempData = (data) => {
      console.log("tempData",data)

      /* temp output packet */
      /*
      data = {
        "characteristic": "cdeacb81-5235-4c07-8846-93a37ee6b86d",
        "peripheral": "50:33:8B:18:1C:92",
        "service": "cdeacb80-5235-4c07-8846-93a37ee6b86d",
        "value": [170, 34, 11, 71, 30]
      }
      */

      var x = Number(data.value[2]).toString(16) // convert to string
      var y = Number(data.value[3]).toString(16)// convert to string
      console.log(x.length)
      if(x.length == 1&& y.length ==1){
        var lsb=0+String(x); // attach zero 
        var msb = 0+String(y) // attach zero 
        var z =lsb+msb // concat both lsb and msb
        var output = z.slice(1,4) // 
        //console.log(output)
        console.log("output",output)
        var tempOutput = (parseInt(output, 16)/100) // convert string to int and divide by 100
        var Farenheit = (tempOutput * (9/5) + 32)   // celcius to farenheit
        console.log(Math.floor(Farenheit))
        setTemp(Math.floor(Farenheit)) // removing decimal points

      };if (x.length == 1&& y.length ==2){
        lsb=0+String(x);
        msb = String(y)
        var z =lsb+msb
        var output = z.slice(1,4)
        console.log("output",output)
        var tempOutput = (parseInt(output, 16)/100)
        var Farenheit = (tempOutput * (9/5) + 32)
        console.log(Farenheit)
        console.log(Math.floor(Farenheit))
        setTemp(Math.floor(Farenheit))

      };if(x.length == 1&& y.length ==3){
        lsb=0+String(x);
        msb = String(y)
        var z =lsb+msb
        var output = z.slice(1,4)
        console.log(output)
        var tempOutput = (parseInt(output, 16)/100)
        var Farenheit = (tempOutput * (9/5) + 32)
        console.log(Math.floor(Farenheit))
        setTemp(Math.floor(Farenheit))
      }
      else{
        console.log("check tempData logic")
      }

  }

// Final Data handle
  const handleUpdateValueForCharacteristic = (data) => {
    //console.log("2")
    console.log('Received data from ' + data.peripheral + ' characteristic ' + data.characteristic, data.value); // Output for all devices
     
    //Spo2 Output 
    if (data.value.length == 4 && data.value[0] == 129 && data.value[2]!=127){
        console.log(data.value[0])
        console.log("pulse rate:",data.value[1])
        console.log("spo2:",data.value[2]) // final spo2 output
        console.log("PI:",data.value[3]*0.10)
        setSpo2(data.value[2]) // assigning value to state
        setPR(data.value[1])
        setPI(Math.floor(data.value[3]*0.10))

    //Weight Output
    };if(data.value[0] ==255 && data.value.length ==8){
      console.log("weight",data.value[3]*0.1) // final Weight value
      setWeight(Math.floor(data.value[3]*0.1)) // assigning value to state

    //Temperature Output      
    };if(data.value[0]== 170 && data.value.length == 5){
      console.log("Temperature",data.value)
      //setTemp(data.value[3])
      tempData(data) // calling tempData function

    //Blood pressure output
    };if(data.value[0]==81 && data.value.length==8){
        console.log('data.value',data.value)
        if(data.value[3]>0 && data.value[4]>0 && data.value[5]>0 ){
          console.log("Displaying BP reading");
          console.log("maximum Bp:", data.value[3]) // BP max final output
          console.log("minimum:",data.value[4])     // BP min final output
          console.log("Heart rate:", data.value[5]) // BP Heart rate final output
          setbpMax(data.value[3]) 
          setbpMin(data.value[4])
          setheartRate(data.value[5]) 
        }else(data.value[3]==0 && data.value[4]==0 && data.value[5]==0);{
          console.log("INVALID BP")
        }
    }

  }
 /* To show the connected device */
  const retrieveConnected = () => {
    console.log("3")
    BleManager.getConnectedPeripherals([]).then((results) => {
      console.log("4")

      if (results.length == 0) {
        console.log('No connected peripherals')
        console.log("5")
      }
      console.log("6")
      console.log(results);
      console.log("7")
      for (var i = 0; i < results.length; i++) {
        var peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        setList(Array.from(peripherals.values()));
        console.log("8")
      }
    });
  }

// Discovery of services
  const handleDiscoverPeripheral = (peripheral) => {
    console.log("9")
    console.log('Got ble peripheral', peripheral.id);
    var devicesId = peripheral.id
    switch(devicesId) {
      case "00:02:5B:A0:69:88": 
        console.log("spo2");
        testPeripheral(peripheral)
      break;

      case "C0:26:DF:01:97:9E":
        console.log("Blood Pressure");
        testPeripheral(peripheral)
      break;

      case "50:33:8B:18:1C:92":
        console.log("Temperature!");
        testPeripheral(peripheral)
      break;

      case "18:7A:93:4D:83:EE":
        console.log("weight");                    
        testPeripheral(peripheral)
      break;

      default:
        console.log("Device not found");

    } 
  } 


// To Enable notification of devices
  const notification = (peripheral,a,b) => {

    setTimeout(() => {
      console.log("36")
      console.log("36")
      BleManager.startNotification(peripheral,a,b).then(() => {
        console.log("37")
        console.log('Started notification on ' + peripheral.id);
        console.log("38")
      }).catch((error) => {
        console.log('Notification error', error);
        console.log("39")

      });
    }, 200);

  }

// main function
  const testPeripheral = (peripheral) => {
      if (peripheral){
        console.log("14")
        if (peripheral.connected){
          console.log("15")
          BleManager.disconnect(peripheral.id);
          console.log("16")  
        }
        else{    
          //connect
          BleManager.connect(peripheral.id).then(() => { 
            console.log("18")
            console.log('Connected to ' + peripheral.id);

            //retreive
            BleManager.retrieveServices(peripheral.id).then((peripheralInfo) => {
              console.log("33")
              console.log("peripheralInfo:",peripheralInfo); // consists connected devices entire data
              console.log("34")

              if((peripheralInfo.name =="DIAMOND CUFF BP" && peripheralInfo.characteristics[9].service == bp_service) && (peripheralInfo.characteristics[9].characteristic == bp_characteristics) ){
                setConnectedBp("Connected") 
                notification(peripheral.id,peripheralInfo.characteristics[9].service, peripheralInfo.characteristics[9].characteristic ) // call notification function

              } if(peripheralInfo.name == 'My Oximeter' && peripheralInfo.characteristics[18].service == spo2_service && peripheralInfo.characteristics[18].characteristic == spo2_Characteristic){
                setConnectedSpo2("Connected")
                notification(peripheral.id,peripheralInfo.characteristics[18].service, peripheralInfo.characteristics[18].characteristic)

              }  if(peripheralInfo.name == 'My Thermometer'&& peripheralInfo.characteristics[16].service== temp_service && peripheralInfo.characteristics[16].characteristic == temp_characteristics){
                setConnectedTemp("Connected") 
                notification(peripheral.id,peripheralInfo.characteristics[16].service, peripheralInfo.characteristics[16].characteristic)

              } if(peripheralInfo.name == "SENSSUN FAT"){
                setConnectedWeight("Connected")
                //console.log("middle")
                notification(peripheral.id,weight_service, weight_characterisitics)
                console.log("end")
              }
              else{
                 console.log("35")
              }

            });
          });
        }
      }
    }




  useEffect(() => {
    console.log("41")

    BleManager.start({showAlert: false});
    
    console.log("42")
    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan );
    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic );

    console.log("43")


    if (Platform.OS === 'android' && Platform.Version >= 23) {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
          if (result) {
            console.log("Permission is OK");
          } else {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
              if (result) {
                console.log("User accept");
              } else {
                console.log("User refuse");
              }
            });
          }
      });
    }  
    
    return (() => {
      console.log("44")

      console.log('unmount');
      bleManagerEmitter.removeListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
      bleManagerEmitter.removeListener('BleManagerStopScan', handleStopScan );
      bleManagerEmitter.removeListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral );
      bleManagerEmitter.removeListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic );
      console.log("45")

    })
  }, []);

// Displays list of devices after scan
  const renderItem = (item) => {
    const color = item.connected ? 'green' : '#fff';
    return (
      <TouchableHighlight onPress={() => testPeripheral(item) }>
        <View style={[styles.row, {backgroundColor: color}]}>
          <Text style={{fontSize: 12, textAlign: 'center', color: '#333333', padding: 10}}>{item.name}</Text>
          <Text style={{fontSize: 10, textAlign: 'center', color: '#333333', padding: 2}}>RSSI: {item.rssi}</Text>
          <Text style={{fontSize: 8, textAlign: 'center', color: '#333333', padding: 2, paddingBottom: 20}}>{item.id}</Text>
        </View>
      </TouchableHighlight>
    );
  }

  return (
   <View style={styles.screen2_container1}>
      <StatusBar
        barStyle = "fade"
        backgroundColor = "#4d53fd"
      />  
      <View style={styles.screen2_item0}>
        <Text style={styles.screen2_text0}> Vitals</Text>
        <View  style={styles.screen2_item0_1}>
          <TouchableOpacity style={{ padding:5}} onPress={() => console.log(startScan())} >
            <Text style={styles.screen2_text0_1}> Scan </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.screen2_item1}>
         <View style={styles.screen2_Direction_1}>
              <Text style={styles.screen2_text1}>Blood Pressure</Text>
           <View style={styles.screen2_pairing_BP}>
              <Text style={styles.screen2_status_text}>{ConnectedBp}</Text>
           </View>
         </View>
        <View style={styles.screen2_Direction}>
          <TouchableOpacity  style={styles.burgerButton}>
            <Image style={styles.screen2_image} source = {require('./assets/bp.png')}/>
          </TouchableOpacity>
            <Text style={styles.screen2_text2}>{bpMax}  / {bpMin}  BP </Text>
        </View>
      </View>

      <View style={styles.screen2_item2}>
         <View style={styles.screen2_Direction_1}>
           <Text style={styles.screen2_text1}>SPO2</Text>
           <View style={styles.screen2_pairing_spo2}>
              <Text style={styles.screen2_status_text}>{ConnectedSpo2}</Text>
           </View>
         </View>
         <View style={styles.screen2_Direction}>
            <TouchableOpacity style={styles.burgerButton}>
              <Image style={styles.screen2_image} source={require('./assets/spo2.png')}/>
            </TouchableOpacity>      
              <Text style={styles.screen2_text2}>{spo2}  % PI :{PI}  PR:{PR}</Text>
         </View>
      </View>

      <View style={styles.screen2_item3}>
         <View style={styles.screen2_Direction_1}>
              <Text style={styles.screen2_text1}>Temperature</Text>
           <View style={styles.screen2_pairing_temp}>
              <Text style={styles.screen2_status_text}>{ConnectedTemp}</Text>
           </View>
         </View>
          <View style={styles.screen2_Direction}>
            <TouchableOpacity style={styles.burgerButton}>
              <Image style={styles.screen2_image} source={require('./assets/temp2.png')}/>
            </TouchableOpacity>      
              <Text style={styles.screen2_text2}>   {temp}   : °C</Text>
          </View>
      </View>

      <View style={styles.screen2_item4}>
         <View style={styles.screen2_Direction_1}>
           <Text style={styles.screen2_text1}>Weight</Text>
           <View style={styles.screen2_pairing_weigh}>
              <Text style={styles.screen2_status_text}>{ConnectedWeight}</Text>
           </View>
         </View>
        <View style={styles.screen2_Direction}>
            <TouchableOpacity  style={styles.burgerButton}>
              <Image style={styles.screen2_image} source={require('./assets/weight1.png')}/>
            </TouchableOpacity>   
          <Text style={styles.screen2_text2}>  {weight} : kg</Text>
        </View>

      </View>

    </View>

  );
};

const styles = StyleSheet.create({
  screen2_container1: {
    flex: 1,
    backgroundColor: "#e1e2e4",
    //margin:10,
  },
  screen2_text0: {
    fontWeight: "bold",
    fontSize: 40,
    color:"#ffffff",
    margin:10,
  },
  screen2_text0_1: {
    fontWeight: "bold",
    fontSize: 20,
    color:"#ffffff",
    margin:10,
  },
  screen2_text1: {
    fontWeight: "bold",
    fontSize: 20,
    color:"#222627",
    margin:10,
  },
  screen2_text2: {
    fontWeight: "bold",
    fontSize: 25,
    color:"#222627",
    textAlign:"center",
    margin:40,

  },
  screen2_status_text: {
    color:"#ffffff",
    textAlign:"center",
    fontWeight: "bold",
    fontSize:17,
    margin:10,
    marginRight:30,


  },
  screen2_pairing_BP: {
    flex:1,
    width :100,
    height:40,
    backgroundColor:"#4d53fd",
    marginLeft:30,
    margin:15,
    alignItems:"flex-end",
    borderRadius:10,
  },
 screen2_pairing_spo2: {
    flex:1,
    width :100,
    height:40,
    backgroundColor:"#4d53fd",
    marginLeft:"35%",
    margin:15,
    alignItems:"flex-end",
    borderRadius:10,
  },
  screen2_pairing_temp: {
    flex:1,
    width :10,
    height:40,
    backgroundColor:"#4d53fd",
    marginLeft: 50,
    margin:15,
    alignItems:"flex-end",
    borderRadius:10,
  },
  screen2_pairing_weigh: {
    flex:1,
    width :100,
    height:40,
    backgroundColor:"#4d53fd",
    marginLeft:"30%",
    margin:15,
    alignItems:"flex-end",
    borderRadius:10,
  },
  screen2_item0: {
    flex: 1,
    flexDirection:"row",
    backgroundColor: "#4d53fd",
    //margin:10,
  },
  screen2_item0_1: {
    //flex: 1,
    backgroundColor: "#83d844",
    margin:10,
    justifyContent:"center",
    alignItems:"center",
    borderRadius:10,
    marginLeft:90,
    width:100
    
  },
  screen2_item1: {
    flex: 2,
    backgroundColor: "#fafafa",
    borderWidth: 5,
    borderRadius:20,
    borderColor:"#e1e2e4",

  },
  screen2_item2: {
    flex: 2,
    backgroundColor: "#fafafa",
    borderWidth: 5,
    borderColor:"#e1e2e4",
    borderRadius:20,

  },
  screen2_item3: {
    flex: 2,
    backgroundColor: "#fafafa",
    borderWidth: 5,
    borderColor:"#e1e2e4",
    borderRadius:20,
  },
  screen2_item4: {
    flex: 2,
    backgroundColor: "#fafafa",
    borderWidth: 5,
    borderRadius:20,
   borderColor:"#e1e2e4",  
  },
  screen2_image: {
    width:50,
    height:50,
    margin:15,
    
  },
  screen2_Direction: {
    flexDirection:"row",
  },
  screen2_Direction_1: {
    flexDirection:"row",
    flex:1,
  },
  burgerButton: {
    backgroundColor:"#FFFFFF",
    borderRadius:40,
    borderColor: "#83d844",
    borderWidth:2,
    margin:15,
    //marginBottom:10,
    width:80,
    height:80,

  }

});

export default App;
