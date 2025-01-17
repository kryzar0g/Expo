import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;

export default function App() {
  const [data, setData] = useState({
    co2: 'Loading...',
    temp: 'Loading...',
    humidity: 'Loading...',
    ledState: 'OFF',
  });

  const [chartData, setChartData] = useState({
    co2: { labels: [], data: [] },
    temp: { labels: [], data: [] },
    humidity: { labels: [], data: [] },
  });

  const addToChartData = (key, value) => {
    if (!isNaN(value)) {
      setChartData((prev) => {
        const timestamp = new Date().toLocaleTimeString();
        const newLabels = [...prev[key].labels, timestamp].slice(-10);
        const newData = [...prev[key].data, parseFloat(value)].slice(-10); // Ensure numeric
        return { ...prev, [key]: { labels: newLabels, data: newData } };
      });
    } else {
      console.warn(`Invalid value for ${key}:`, value);
    }
  };
  
  useEffect(() => {
    const websocket = new WebSocket('ws://192.168.0.113/ws');

    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    websocket.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    websocket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
    
        if (parsedData.co2) addToChartData('co2', parsedData.co2);
        if (parsedData.temperature) addToChartData('temp', parsedData.temperature);
        if (parsedData.humidity) addToChartData('humidity', parsedData.humidity);
        
        setData((prev) => ({
          co2: parsedData.co2 || prev.co2,
          temp: parsedData.temperature || prev.temp,
          humidity: parsedData.humidity || prev.humidity,
          ledState: parsedData.ledState === '1' ? 'ON' : 'OFF',
        }));
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      websocket.close();
    };
  }, []);

  const createChart = (key) => ({
    labels: chartData[key].labels,
    datasets: [
      {
        data: chartData[key].data,
        color: () => (key === 'co2' ? '#ff6384' : key === 'temp' ? '#36a2eb' : '#4bc0c0'),
        strokeWidth: 2,
      },
    ],
  });

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>ESP32 Sensor Data</Text>
      <View style={styles.card}>
        <Text style={styles.label}>CO2 Level: <Text style={styles.value}>{data.co2} ppm</Text></Text>
        <Text style={styles.label}>Temperature: <Text style={styles.value}>{data.temp} °C</Text></Text>
        <Text style={styles.label}>Humidity: <Text style={styles.value}>{data.humidity} %</Text></Text>
        <Text style={styles.label}>LED State: <Text style={styles.value}>{data.ledState}</Text></Text>
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>CO2 Levels</Text>
        <LineChart
          data={createChart('co2')}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Temperature</Text>
        <LineChart
          data={createChart('temp')}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Humidity</Text>
        <LineChart
          data={createChart('humidity')}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
        />
      </View>
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: '#1e1e1e',
  backgroundGradientTo: '#1e1e1e',
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  style: {
    borderRadius: 8,
  },
  propsForDots: {
    r: '6',
    strokeWidth: '2',
    stroke: '#ffa726',
  },
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e1e1e',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d1b2',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#292929',
    padding: 20,
    borderRadius: 8,
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    color: '#dddddd',
    marginBottom: 5,
  },
  value: {
    fontWeight: 'normal',
    color: '#ffffff',
  },
  chartContainer: {
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#292929',
    padding: 20,
  },
  chartTitle: {
    color: '#ffffff',
    marginBottom: 10,
    fontSize: 18,
  },
});
