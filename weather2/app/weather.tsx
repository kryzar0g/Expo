import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ScrollView, Switch ,Dimensions} from 'react-native';
import { LineChart, Grid } from 'react-native-svg-charts'
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

  const fetchWeather = async (url: string, params: WeatherParams): Promise<void> => {
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
    const data = await response.json() as WeatherAPI;
    setData(data);
  };

  const handleFetchWeather = () => {
    const params: WeatherParams = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      hourly: "temperature_2m,relative_humidity_2m,dewpoint_2m",
      start_date: "2024-10-04",
      end_date: "2024-10-04",
    };
    fetchWeather("https://api.open-meteo.com/v1/forecast?", params);
  };

  const screenWidth = Dimensions.get("window").width;

  const createChartData = (values: number[], label: string) => {
    return values.slice(0, 5).map((value, index) => ({
      value,
      label: data?.hourly.time[index].substring(11, 16) || "",
    }));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      <View style={styles.container}>
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
        <Button onPress={handleFetchWeather} title="Press" />

        <View style={styles.switchContainer}>
          <Text style={styles.text}>Show Temperature</Text>
          <Switch value={showTemperature} onValueChange={setShowTemperature} />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.text}>Show Relative Humidity</Text>
          <Switch value={showHumidity} onValueChange={setShowHumidity} />
        </View>

        <View style={styles.switchContainer}>
          <Text style={styles.text}>Show Dewpoint</Text>
          <Switch value={showDewpoint} onValueChange={setShowDewpoint} />
        </View>

        {data && (
          <>
            {showTemperature && (
              <LineChart
                data={createChartData(data.hourly.temperature_2m, 'Temperature')}
                width={screenWidth - 40}
                height={150}
                hideDataPoints
                color="#ff6347"
                thickness={2}
                initialSpacing={0}
              />
            )}

            {showHumidity && (
              <LineChart
                data={createChartData(data.hourly.relative_humidity_2m, 'Humidity')}
                width={screenWidth - 40}
                height={150}
                hideDataPoints
                color="#1e90ff"
                thickness={2}
                initialSpacing={0}
              />
            )}

            {showDewpoint && (
              <LineChart
                data={createChartData(data.hourly.dewpoint_2m, 'Dewpoint')}
                width={screenWidth - 40}
                height={150}
                hideDataPoints
                color="#32cd32"
                thickness={2}
                initialSpacing={0}
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 20,
  },
  text: {
    color: '#000000',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '80%',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
});

export default Weather;
