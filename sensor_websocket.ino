#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <SensirionI2CScd4x.h>
#include <Wire.h>

SensirionI2CScd4x scd4x;

// Pin Definitions
const int ledPin = 19;

// Network credentials
const char* ssid = "Vodafone-2B3B 2.4";
const char* password = "JCGCUAprAtEUUhaD";

// Create AsyncWebServer object on port 80
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// Initial state for the LED
bool ledState = false;

// HTML content for the web page
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>ESP32 WebSocket Server</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
    h1 { color: #333; }
    p { font-size: 1.2rem; }
    .data { font-weight: bold; color: #555; }
  </style>
</head>
<body>
  <h1>ESP32 Sensor Dashboard</h1>
  <p>LED State: <span id="ledState">OFF</span></p>
  <button id="toggleBtn">Toggle LED</button>
  <p>CO2 Level: <span id="co2" class="data">-</span> ppm</p>
  <p>Temperature: <span id="temp" class="data">-</span> °C</p>
  <p>Humidity: <span id="humidity" class="data">-</span> %</p>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const websocket = new WebSocket(`ws://${window.location.hostname}/ws`);

      websocket.onopen = () => console.log("WebSocket connected");
      websocket.onclose = () => console.log("WebSocket disconnected");

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        document.getElementById('ledState').textContent = data.ledState === "1" ? "ON" : "OFF";
        document.getElementById('co2').textContent = data.co2 || '-';
        document.getElementById('temp').textContent = data.temperature || '-';
        document.getElementById('humidity').textContent = data.humidity || '-';
      };

      document.getElementById('toggleBtn').addEventListener('click', () => {
        websocket.send("toggle");
      });
    });
  </script>
</body>
</html>
)rawliteral";

// Function to read sensor data
void readSensorData(uint16_t &co2, float &temperature, float &humidity) {
    uint16_t error;
    char errorMessage[256];
    bool isDataReady = false;

    error = scd4x.getDataReadyFlag(isDataReady);
    if (error) {
        Serial.print("Error trying to execute getDataReadyFlag(): ");
        errorToString(error, errorMessage, 256);
        Serial.println(errorMessage);
        return;
    }
    if (!isDataReady) {
        return;
    }

    error = scd4x.readMeasurement(co2, temperature, humidity);
    if (error) {
        Serial.print("Error trying to execute readMeasurement(): ");
        errorToString(error, errorMessage, 256);
        Serial.println(errorMessage);
    } else if (co2 == 0) {
        Serial.println("Invalid sample detected, skipping.");
    } else {
        Serial.print("CO2: ");
        Serial.print(co2);
        Serial.print(" ppm; Temperature: ");
        Serial.print(temperature);
        Serial.print(" °C; Humidity: ");
        Serial.print(humidity);
        Serial.println(" %");
    }
}

void setup() {
    Serial.begin(115200);
    Wire.begin();
    scd4x.begin(Wire);

    uint16_t error;
    char errorMessage[256];
    error = scd4x.startPeriodicMeasurement();
    if (error) {
        Serial.print("Error starting measurement: ");
        errorToString(error, errorMessage, 256);
        Serial.println(errorMessage);
    }

    pinMode(ledPin, OUTPUT);
    digitalWrite(ledPin, LOW);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.print(".");
    }
    Serial.println("\nWi-Fi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());

    ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client, AwsEventType type, void *arg, uint8_t *data, size_t len) {
        if (type == WS_EVT_DATA) {
            data[len] = '\0';
            if (strcmp((char *)data, "toggle") == 0) {
                ledState = !ledState;
                digitalWrite(ledPin, ledState);
            }
        }
    });
    server.addHandler(&ws);

    server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
        request->send_P(200, "text/html", index_html);
    });

    server.begin();
}

void loop() {
    ws.cleanupClients();

    uint16_t co2 = 0;
    float temperature = 0.0f;
    float humidity = 0.0f;

    readSensorData(co2, temperature, humidity);

    String sensorData = "{\"ledState\":\"" + String(ledState) + "\",\"co2\":\"" + String(co2) + "\",\"temperature\":\"" + String(temperature) + "\",\"humidity\":\"" + String(humidity) + "\"}";
    ws.textAll(sensorData);

    delay(5000);
}
