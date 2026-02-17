# System Interfaces Documentation

This document outlines the external and internal interfaces used by the **TrapSensor** application.

## 1. MQTT Interfaces (Ingress)
The system listens to MQTT brokers to receive sensor data from traps.

### A. NB-IoT Traps (Internal/External Broker)
*   **Protocol**: MQTT (TCP/1883)
*   **Topic**: `traps/{imei}/data`
*   **Payload Format**: Binary (4 Bytes)
    *   Byte 0: **Status** (0x01 = Active, 0x00 = Triggered/Alarm)
    *   Byte 1-2: **Voltage** (UInt16BE, in mV)
    *   Byte 3: **RSSI** (UInt8, absolute value, e.g., 60 = -60dBm)

### B. LoRaWAN Traps (The Things Network Integration)
*   **Protocol**: MQTTS (TLS/8883) via TTN
*   **Topic**: `v3/{app-id}@ttn/devices/{device-id}/up`
*   **Payload Format**: JSON (TTN v3 Uplink Schema)
    *   **Primary Data**: `uplink_message.decoded_payload` (if formatter exists) OR `uplink_message.frm_payload` (Base64 Binary).
    *   **Metadata**: `uplink_message.rx_metadata` (RSSI, SNR, Gateways).
    *   **Binary Fallback**: Same structure as NB-IoT (Status, Voltage, Battery%) if payload is raw.

---

## 2. REST API (Client/Frontend)
The React frontend communicates with the backend via these HTTP endpoints.

### Authentication (`/api/auth`)
*   `POST /register`: Register new user.
*   `POST /login`: Login and receive JWT.
*   `GET /me`: Get current user profile.

### Trap Management (`/api/traps`)
*   `GET /`: List all accessible traps (Owned + Shared).
*   `POST /`: Register a new trap (or claim an auto-provisioned one).
    *   Body: `{ name, alias, imei|deviceId, type }`
*   `PATCH /:id/status`: Update trap status manually.
*   `DELETE /:id`: Delete a trap.
*   `POST /simulate`: (Dev Tool) Simulate an MQTT message.

### Sharing (`/api/traps`)
*   `POST /:id/share`: Share a trap with another user by email.
*   `DELETE /:id/share/:userId`: Revoke access.
*   `GET /:id/shares`: List users who have access.

### Readings (`/api/readings`)
*   `GET /:trapId`: Retrieve historical readings (last 50).

---

## 3. External Services (Egress)
The system calls out to these services to notify users.

### A. Pushover (Mobile Notifications)
*   **Service**: [pushover.net](https://pushover.net)
*   **Trigger**: Alarm (`triggered`) or Low Battery (< 20%).
*   **Data Sent**:
    *   Title (Alarm/Info)
    *   Message (Trap Name)
    *   Priority (High for Alarm)
    *   Sound (Siren for Alarm)

### B. Web Push API (PWA Notifications)
*   **Protocol**: Standard Web Push Protocol (VAPID).
*   **Trigger**: Same as Pushover.
*   **Endpoints**: Dynamic (Client browser endpoints, e.g., FCM, Mozilla).
