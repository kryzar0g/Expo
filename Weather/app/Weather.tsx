import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput, ScrollView } from 'react-native';

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
}

interface HourlyUnits {
  time: string;
  temperature_2m: string;
}

const Weather = () => {
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [data, setData] = useState<WeatherAPI | null>(null);

  const fetchWeather = async (url: string, params: WeatherParams): Promise<void> => {
    const queryParams = new URLSearchParams();
    queryParams.append("latitude", params.latitude.toString());
    queryParams.append("longitude", params.longitude.toString());
    queryParams.append("hourly", params.hourly);
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
      hourly: "temperature_2m",
      start_date: "2024-10-04",
      end_date: "2024-10-04",
    };
    fetchWeather("https://api.open-meteo.com/v1/forecast?", params);
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
        {data && (
          <>
            <Text style={styles.text}>Longitude: {data?.longitude}</Text>
            <Text style={styles.text}>Latitude: {data?.latitude}</Text>
            <Text style={styles.text}>Temperature:</Text>
            {data.hourly.temperature_2m.map((temp, index) => (
              <Text key={index} style={styles.text}>
                {data.hourly.time[index]}: {temp}°C
              </Text>
            ))}
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
});

export default Weather;