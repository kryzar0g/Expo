import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ScrollView, Switch,TouchableOpacity ,Dimensions} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import dayjs from 'dayjs';


type WeatherParams = {
  latitude: number;
  longitude: number;
  hourly: string;
  start_date: string;
  end_date: string;
};

interface WeatherAPI {
  latitude: number;
  longitude: number;
  generationtime_ms: number;
  utc_offset_seconds: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  hourly_units: HourlyUnits;
  hourly: Hourly;
}

interface Hourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  dewpoint_2m: number[];
}

interface HourlyUnits {
  time: string;
  temperature_2m: string;
  relative_humidity_2m: string;
  dewpoint_2m: string;
}

const Weather = () => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [data, setData] = useState<WeatherAPI | null>(null);
  const [showTemperature, setShowTemperature] = useState<boolean>(true);
  const [showHumidity, setShowHumidity] = useState<boolean>(true);
  const [showDewpoint, setShowDewpoint] = useState<boolean>(true);
  const [temperatureData,setTemperatureData]=useState<number[]>([]);
  const [humidityData,setHumidityData]=useState<number[]>([]);
  const [dewpointData,setDewPointData]=useState<number[]>([]);
  const [timeLabels,setTimeLabels]=useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [city, setCity] = useState('');
  const [search, setSearch] = useState<boolean>(true);


  const currentDate = new Date();
  


  const fetchWeather = async (url: string, params: WeatherParams): Promise<void> => {
    try {
        const queryParams = new URLSearchParams();
        queryParams.append("latitude", params.latitude.toString());
        queryParams.append("longitude", params.longitude.toString());
        queryParams.append("hourly", "temperature_2m,relative_humidity_2m,dewpoint_2m");
        queryParams.append("start_date", params.start_date);
        queryParams.append("end_date", params.end_date);

        const response = await fetch(url + queryParams, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json() as WeatherAPI;
        setData(data);

        if (data?.hourly) {
            setTemperatureData(data.hourly.temperature_2m);
            setHumidityData(data.hourly.relative_humidity_2m);
            setDewPointData(data.hourly.dewpoint_2m);
            setTimeLabels(data.hourly.time.map((time: string) => new Date(time).getHours() + ":00"));
        }
    } catch (error) {
        console.error("Failed to fetch weather data:", error);
    }
};
const fetchCoordinates = async () => {
  try {
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${city}`);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const { latitude, longitude } = data.results[0];
      setLatitude(latitude);
      setLongitude(longitude);
      fetchWeather(latitude, longitude);
    } else {
      alert("City not found");
    }
  } catch (error) {
    console.error("Error fetching coordinates:", error);
  }
};
const handleFetchWeatherWithCoordinates = async () => {
  if (latitude && longitude) {
    handleFetchWeather();
    return;
  }
  if (city){
    await fetchCoordinates();  
    handleFetchWeather(); 
  }
};


  const handleFetchWeather = () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
        alert("Please enter valid latitude (-90 to 90) and longitude (-180 to 180).");
        return;
    }

    const params: WeatherParams = {
        latitude: lat,
        longitude: lon,
        hourly: "temperature_2m,relative_humidity_2m,dewpoint_2m",
        start_date: dayjs(currentDate).format('YYYY-MM-DD'),
        end_date: dayjs(currentDate).format('YYYY-MM-DD'),
    };
    fetchWeather("https://api.open-meteo.com/v1/forecast?", params);

    
};




  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
      {showTemperature && data && (
  <LineChart
    data={{
      labels: timeLabels,
      legend: ["Temperature (°C)"],
      datasets: [
        {
          data: temperatureData,
          color: () => 'rgba(255,99,132,1)', 
          strokeWidth: 2, 
        },
      ],
    }}
    width={screenWidth - 40} 
    height={220}
    yAxisLabel=""
    yAxisSuffix="°C"
    chartConfig={{
      backgroundColor: '#ffffff', 
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 2,
      color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, 
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, 
      style: {
        borderRadius: 16, 
        marginVertical: 8, 
      },
      propsForDots: {
        r: '3',
        strokeWidth: '2',
        stroke: '#ff4d4d', 
      },
    }}
    bezier
    style={{
      marginVertical: 16, 
      borderRadius: 16,
      overflow: 'hidden', 
    }}
  />
)}

{showHumidity && data && (
  <LineChart
    data={{
      labels: timeLabels,
      legend: ["Humidity (%)"],
      datasets: [
        {
          data: humidityData,
          color: () => 'rgba(54,162,235,1)', 
          strokeWidth: 2,
        },
      ],
    }}
    width={screenWidth - 40} 
    height={220}
    yAxisLabel=""
    yAxisSuffix="%"
    chartConfig={{
      backgroundColor: '#ffffff', 
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 2,
      color: (opacity = 1) => `rgba(54, 162, 235, ${opacity})`, 
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, 
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '3',
        strokeWidth: '2',
        stroke: '#0099cc', 
      },
    }}
    bezier
    style={{
      marginVertical: 16, 
      borderRadius: 16, 
      overflow: 'hidden', 
    }}
  />
)}

{showDewpoint && data && (
  <LineChart
    data={{
      labels: timeLabels,
      legend: ["Dewpoint (°C)"],
      datasets: [
        {
          data: dewpointData,
          color: () => 'rgba(75,192,192,1)', 
          strokeWidth: 2,
        },
      ],
    }}
    width={screenWidth - 40} 
    height={220}
    yAxisLabel=""
    yAxisSuffix="°C"
    chartConfig={{
      backgroundColor: '#ffffff', 
      backgroundGradientFrom: '#ffffff',
      backgroundGradientTo: '#ffffff',
      decimalPlaces: 2,
      color: (opacity = 1) => `rgba(75, 192, 192, ${opacity})`, 
      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, 
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: '3',
        strokeWidth: '2',
        stroke: '#66cccc', 
      },
    }}
    bezier
    style={{
      marginVertical: 16, 
      borderRadius: 16, 
      overflow: 'hidden', 
    }}
  />
)}

        <View style={styles.capsule}>
        <View style={{ alignItems: 'center' }}>
        <Text style={styles.text}>Search by City / Search by world coordinates</Text>
        <Switch style={styles.switch} value={search} onValueChange={setSearch} />
        </View>
        
        {search && (
        <View style={styles.input_field}>
        <TextInput
          style={styles.input}
          placeholder="Enter Latitude"
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
        />
        <TextInput
          style={styles.input}
          placeholder="Enter Longitude"
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
        />
        </View>
        )}


      {!search && (
        <View style={styles.input_field}> 
        <TextInput
          style={styles.input}
          placeholder="Enter city name"
          value={city}
          onChangeText={setCity}
          keyboardType="default"
        />
        </View>
      )}
        
        <Text style={styles.text}>{dayjs(currentDate).format('DD.MM.YYYY')}</Text>
       
        <View style={styles.button}>
          <Button
            onPress={handleFetchWeatherWithCoordinates}
            title="Get Forecast" 
            color="#6200EE"
            
          />
        </View>
        {data && (
          <Text style={styles.text_masage}>
          Getting forecast for {city} on latitude: {latitude} and longitude: {longitude}.
        </Text>
        )}
        
        
        <View style={styles.switchContainer}>
          <Text style={styles.text}>Show Temperature</Text>
          <Switch style={styles.switch} value={showTemperature} onValueChange={setShowTemperature} />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.text}>Show Relative Humidity</Text>
          <Switch style={styles.switch} value={showHumidity} onValueChange={setShowHumidity} />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.text}>Show Dewpoint</Text>
          <Switch style={styles.switch} value={showDewpoint} onValueChange={setShowDewpoint} />
        </View>
        </View>

        {data && (
          <View style={styles.dataRow}>
            {showTemperature && (
              <View style={styles.dataColumn}>
                <Text style={styles.text}>Temperature (°C)</Text>
                {data.hourly.temperature_2m.map((temp, index) => (
                  <Text key={index} style={styles.text}>
                    {data.hourly.time[index]}: {temp}°C
                  </Text>
                ))}
              </View>
            )}

            {showHumidity && (
              <View style={styles.dataColumn}>
                <Text style={styles.text}>Humidity (%)</Text>
                {data.hourly.relative_humidity_2m.map((humidity, index) => (
                  <Text key={index} style={styles.text}>
                    {data.hourly.time[index]}: {humidity}%
                  </Text>
                ))}
              </View>
            )}

            {showDewpoint && (
              <View style={styles.dataColumn}>
                <Text style={styles.text}>Dewpoint (°C)</Text>
                {data.hourly.dewpoint_2m.map((dewpoint, index) => (
                  <Text key={index} style={styles.text}>
                    {data.hourly.time[index]}: {dewpoint}°C
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
      
    </ScrollView>
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212', 
    padding: 20,
  },
  text_masage: {
    color: '#ffffff',
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center',
    fontSize: 16,
  },
  input_field: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
    width: '90%', 
  },
  
  text: {
    color: '#ffffff',
    marginBottom: 5,
    fontSize: 16,
    fontWeight: '500', 
alignContent: 'center',
 },
  capsule: {
    width: '90%', 
    height: 'auto',
    borderRadius: 28, 
    backgroundColor: '#1F1B24', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6, 
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  input: {
    height: 48, 
    borderColor: '#BB86FC', 
    borderWidth: 1.5,
    marginBottom: 12,
    paddingHorizontal: 15,
    borderRadius: 25, 
    width: '100%',
    backgroundColor: '#2C2C2C', 
    color: '#ffffff', 
  },
  button: {
    backgroundColor: '#6200EE', 
    color: '#ffffff',
    borderRadius: 28,
    paddingVertical: 14,
    paddingHorizontal: 30,
    marginTop: 30,
    elevation: 4, 
    
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',        
    alignItems: 'center',        
    marginVertical: 5,           
    paddingHorizontal: 10,       
  },
  
  switch: {
    marginLeft: 10,              
    marginRight: 10,  
    alignContent: 'center' 
  },
  
  dataRow: {
  flexDirection: screenWidth < 600 ? 'column' : 'row',  
  justifyContent: 'center',  
  alignItems: 'center',      
  marginTop: 15,
  width: '100%',
},
dataColumn: {
  alignItems: 'center',
  marginHorizontal: 10,  
  padding: 10,           
},

  textData: {
    color: '#BB86FC', 
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center', 
  },
  textButton: {
    color: '#ffffff', 
    fontWeight: '500',
    fontSize: 16,
  },
});



export default Weather;