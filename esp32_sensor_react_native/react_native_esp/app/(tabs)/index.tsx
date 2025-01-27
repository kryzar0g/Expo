import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Button } from 'react-native';


const screenWidth = Dimensions.get('window').width;

const url = 'ws://192.168.0.113/ws';

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

  const saveDataToStorage = async (key, value) => {
    try {
      const existingData = await AsyncStorage.getItem(key);
      const parsedData = existingData ? JSON.parse(existingData) : [];
      parsedData.push({ timestamp: new Date().toISOString(), value });
      await AsyncStorage.setItem(key, JSON.stringify(parsedData.slice(-100))); // Keep the last 100 entries
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

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

  const loadHistoricalData = async () => {
    try {
      const co2Data = JSON.parse(await AsyncStorage.getItem('co2')) || [];
      const tempData = JSON.parse(await AsyncStorage.getItem('temp')) || [];
      const humidityData = JSON.parse(await AsyncStorage.getItem('humidity')) || [];
      
      setChartData({
        co2: { labels: co2Data.map(d => d.timestamp.slice(11, 19)), data: co2Data.map(d => d.value) },
        temp: { labels: tempData.map(d => d.timestamp.slice(11, 19)), data: tempData.map(d => d.value) },
        humidity: { labels: humidityData.map(d => d.timestamp.slice(11, 19)), data: humidityData.map(d => d.value) },
      });
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  const exportDataAsCSV = async () => {
    try {
      const co2Data = JSON.parse(await AsyncStorage.getItem('co2')) || [];
      const tempData = JSON.parse(await AsyncStorage.getItem('temp')) || [];
      const humidityData = JSON.parse(await AsyncStorage.getItem('humidity')) || [];
  
      const rows = [['Timestamp', 'CO2', 'Temperature', 'Humidity']];
      const length = Math.max(co2Data.length, tempData.length, humidityData.length);
  
      for (let i = 0; i < length; i++) {
        rows.push([
          co2Data[i]?.timestamp || '',
          co2Data[i]?.value || '',
          tempData[i]?.value || '',
          humidityData[i]?.value || '',
        ]);
      }
  
      const csvContent = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
  
      // Create a link element and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sensor_data.csv');
      document.body.appendChild(link);
      link.click();
  
      // Clean up
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
  
      console.log('File downloaded successfully!');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };
  
  

  
  useEffect(() => {
    const websocket = new WebSocket(url);


    websocket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    websocket.onclose = () => {
      console.log('Not connected to the WebSocket server');
      //loadHistoricalData();
    };

    websocket.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
    
        if (parsedData.co2) {
          addToChartData('co2', parsedData.co2);
          saveDataToStorage('co2', parsedData.co2);
        }
            
        if (parsedData.temperature){
           addToChartData('temp', parsedData.temperature);
           saveDataToStorage('temp', parsedData.temperature);
          }
        if (parsedData.humidity){
           addToChartData('humidity', parsedData.humidity);
           saveDataToStorage('humidity', parsedData.humidity);
          }
        
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
        <Button title="Export Data" onPress={exportDataAsCSV} />
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
