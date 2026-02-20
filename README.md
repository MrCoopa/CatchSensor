# 🦊 CatchSensor

A self-hosted IoT monitoring platform for trap/catch sensors using **NB-IoT** and **LoRaWAN**. Includes a real-time dashboard, native Android push notifications via FCM, multi-user sharing, and Pushover alerts.

---

## ✨ Features

### Dashboard
- Real-time sensor status display (active / inactive / triggered) via WebSocket (Socket.IO)
- Battery percentage & voltage monitoring
- Signal strength (RSSI) display
- Last-seen timestamp per sensor
- Click-through to detailed reading history

### Sensors (Melder)
- Register NB-IoT (IMEI) and LoRaWAN (Device ID) sensors
- Claim unbound sensors automatically on first MQTT message
- Edit name, alias, and location
- Delete own sensors or remove shared ones from view
- Share sensors with other users by email (read/write/admin permissions)

### Notifications
- **Native Android Push** via Firebase Cloud Messaging (FCM) — using Capacitor
- **Pushover** as optional secondary alert channel (configurable per user)
- Alert types and trigger timing:
  - **Catch detected** — fires **immediately** when MQTT message arrives with `triggered` status
  - **Low battery** — fires immediately on MQTT message if battery is below threshold; repeat suppression per user-configured interval
  - **Sensor offline** — fired by the Watchdog when no message is received within the configured interval
- Alert deduplication via per-sensor cooldown timestamps (`lastCatchAlert`, `lastBatteryAlert`, `lastOfflineAlert`)

### MQTT / Data Ingestion
- Embedded [Aedes](https://github.com/moscajs/aedes) MQTT broker on port `1884`
- Supports NB-IoT payload format (4-byte binary)
- Supports The Things Network (TTN) LoRaWAN uplinks via external MQTT bridge
- Direct publish simulation endpoint for testing

### Watchdog
- Background service running every 15 minutes
- Detects offline sensors and low battery, triggers alerts automatically

### User Management
- JWT-based authentication (30-day tokens)
- Register, login, change password
- Per-user push notification and alert settings

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Mobile | Capacitor (Android) |
| Backend | Node.js + Express |
| Database | MariaDB / MySQL via Sequelize ORM |
| Realtime | Socket.IO |
| MQTT Broker | Aedes (embedded) |
| Push | Firebase Admin SDK (FCM) |
| Alerts | Pushover API |
| Deployment | Docker + Portainer |
| Reverse Proxy | Nginx Proxy Manager |

---

## 🗄 Database Structure

### `Users`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `email` | STRING (unique) | Login email |
| `name` | STRING | Display name |
| `password` | STRING | bcrypt hashed |
| `role` | ENUM(`user`,`admin`) | Default: `user` |
| `pushEnabled` | BOOLEAN | Push notifications on/off |
| `pushoverAppKey` | STRING | Pushover app token |
| `pushoverUserKey` | STRING | Pushover user key |
| `batteryThreshold` | INTEGER | % below which battery alert fires (default: 20) |
| `batteryAlertInterval` | INTEGER | Hours between battery alerts (default: 24) |
| `offlineAlertInterval` | INTEGER | Hours before offline alert fires (default: 24) |
| `catchAlertInterval` | INTEGER | Hours between catch alerts (default: 1) |

### `CatchSensors`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `name` | STRING | Sensor display name |
| `alias` | STRING | Short name/alias |
| `location` | STRING | Physical location |
| `type` | ENUM(`NB-IOT`,`LORAWAN`) | Protocol type |
| `imei` | STRING (unique) | NB-IoT device identifier |
| `deviceId` | STRING (unique) | LoRaWAN device identifier |
| `status` | ENUM(`active`,`inactive`,`triggered`) | Current state |
| `batteryVoltage` | INTEGER | Last known battery voltage (mV) |
| `batteryPercent` | INTEGER | Last known battery % |
| `rssi` | INTEGER | Signal strength |
| `lastSeen` | DATE | Last message timestamp |
| `lastBatteryAlert` | DATE | Deduplication: last battery alert sent |
| `lastOfflineAlert` | DATE | Deduplication: last offline alert sent |
| `lastCatchAlert` | DATE | Deduplication: last catch alert sent |
| `userId` | UUID (FK → Users) | Owner |

### `Readings`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `catchSensorId` | UUID (FK) | Reference to sensor |
| `value` | FLOAT | Sensor reading value |
| `type` | STRING | Reading category |
| `status` | STRING | State at time of reading |
| `batteryPercent` | INTEGER | Battery at reading time |
| `rssi` | INTEGER | Signal at reading time |
| `timestamp` | DATE | Time of reading |
| `snr` | FLOAT | LoRa SNR |
| `gatewayId` | STRING | LoRa gateway |
| `gatewayCount` | INTEGER | Number of gateways |
| `fCnt` | INTEGER | LoRa frame counter |
| `spreadingFactor` | INTEGER | LoRa SF |

### `CatchShares`
| Column | Type | Description |
|---|---|---|
| `id` | UUID (PK) | Auto-generated |
| `catchSensorId` | UUID (FK → CatchSensors) | Shared sensor |
| `userId` | UUID (FK → Users) | Recipient user |
| `permission` | ENUM(`read`,`write`,`admin`) | Access level |

### `PushSubscriptions`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER (PK, autoincrement) | Auto-generated |
| `endpoint` | TEXT (unique) | FCM device token |
| `userId` | UUID (FK → Users) | Token owner |

### `lorawan_metadata`
| Column | Type | Description |
|---|---|---|
| `catchSensorId` | UUID (PK, FK) | Reference to sensor |
| `loraRssi` | INTEGER | LoRa-specific RSSI |
| `snr` | FLOAT | Signal-to-noise ratio |
| `spreadingFactor` | INTEGER | LoRa spreading factor |
| `gatewayId` | STRING | Last gateway ID |
| `gatewayCount` | INTEGER | Gateways that received packet |
| `fCnt` | INTEGER | Uplink frame counter |

---

## 🔌 API Endpoints

All protected endpoints require `Authorization: Bearer <token>` header.

### Auth — `/api/auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | ❌ | Register new user |
| `POST` | `/login` | ❌ | Login, returns JWT |
| `GET` | `/me` | ✅ | Get current user profile |
| `POST` | `/change-password` | ✅ | Change password |
| `PUT` | `/update-profile` | ✅ | Update push/alert settings |

### Catches — `/api/catches`
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | ✅ | List own + shared sensors |
| `POST` | `/` | ✅ | Create or claim a sensor |
| `PATCH` | `/:id` | ✅ | Update name/alias/location (owner only) |
| `PATCH` | `/:id/status` | ✅ | Update sensor status |
| `DELETE` | `/:id` | ✅ | Delete (owner) or remove share (shared user) |
| `POST` | `/:id/share` | ✅ | Share sensor with user by email |
| `DELETE` | `/:id/share/:userId` | ✅ | Revoke a share |
| `GET` | `/:id/shares` | ✅ | List all shares (owner only) |
| `POST` | `/simulate` | ✅ | Inject simulated MQTT data |

### Readings — `/api/readings`
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/:catchSensorId` | ✅ | Get last 50 readings for a sensor |
| `POST` | `/` | ✅ | Submit a new reading |

### Notifications — `/api/notifications`
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/subscribe` | ✅ | Register FCM token |
| `POST` | `/unsubscribe` | ✅ | Remove FCM token |
| `POST` | `/clear-all` | ✅ | Remove all tokens for user |
| `POST` | `/test` | ✅ | Send test push to all user devices |

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/status` | ❌ | System health & uptime |
| `GET` | `/api/health` | ❌ | Docker healthcheck |

---

## 📱 Android Configuration

### Capacitor (`capacitor.config.json`)
```json
{
  "appId": "com.catchsensor.app",
  "appName": "CatchSensor",
  "webDir": "dist",
  "server": {
    "androidScheme": "http",
    "cleartext": true
  },
  "plugins": {
    "PushNotifications": {
      "presentationOptions": ["badge", "sound", "alert"]
    }
  }
}
```

### AndroidManifest Permissions
```xml
<uses-permission android:name="android.permission.INTERNET" />
```
- `android:usesCleartextTraffic="true"` — allows HTTP to local server
- `android:networkSecurityConfig` — custom security config for local domain

### Capacitor Plugins Used
| Plugin | Purpose |
|---|---|
| `@capacitor/app` | App lifecycle events |
| `@capacitor/push-notifications` | Native FCM push notifications |
| `@capacitor/core` | Core bridge |

### Build & Sync
```bash
cd client
npm run build           # Build React app
npx cap sync android    # Sync to Android project
# Then open client/android in Android Studio and Run
```

---

## ⚙️ Environment Variables

File: `.env` in project root

| Variable | Required | Description |
|---|---|---|
| `PORT` | ✅ | Backend port (default: `5000`) |
| `DB_HOST` | ✅ | Database host (`localhost` or `catchsensor_db` in Docker) |
| `DB_USER` | ✅ | Database username |
| `DB_PASS` | ✅ | Database password |
| `DB_NAME` | ✅ | Database name |
| `JWT_SECRET` | ✅ | JWT signing secret — **change in production!** |
| `VITE_API_URL` | ✅ | Full URL backend (e.g. `https://catchsensor.home`) |
| `APP_BASE_URL` | ✅ | Same as above, used server-side |
| `FIREBASE_SERVICE_ACCOUNT_B64` | ✅ (Docker) | Base64-encoded `serviceAccountKey.json` for FCM |
| `TTN_MQTT_BROKER` | ⚙️ | TTN MQTT broker hostname |
| `TTN_MQTT_PORT` | ⚙️ | TTN MQTT port (usually `8883`) |
| `TTN_MQTT_USER` | ⚙️ | TTN application ID |
| `TTN_MQTT_PASS` | ⚙️ | TTN API key |
| `TTN_MQTT_TOPIC` | ⚙️ | TTN uplink topic pattern |

> **For local dev:** Place `serviceAccountKey.json` in `backend/` instead of using the env var.

---

## 🐳 Docker Deployment

```bash
docker compose up --build -d
```

### Ports
| Port | Service |
|---|---|
| `5000` | Web UI + REST API |
| `1884` | Embedded MQTT Broker |
| `3306` | MariaDB (internal) |

### Recommended: Nginx Proxy Manager
- Proxy Host: `catchsensor_app:5000`
- Enable **WebSockets support**
- Set up SSL certificate

---

## 🔔 Push Notification Flow

```
Android App
  └─► requestPermissions() [Capacitor]
  └─► register() → FCM Token
  └─► POST /api/notifications/subscribe → saved to PushSubscriptions

Sensor triggers catch / low battery
  └─► MQTT message received
  └─► notificationService.js
        ├─► FCM: firebase-admin → sendNativeNotification()
        └─► Pushover: pushover-notifications (optional)
```

---

## 🔗 WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `catchSensorUpdate` | Server → Client | Sensor data changed |
| `catchSensorDelete` | Server → Client | Sensor deleted |
| `CatchSensorUpdate` | Server → Client | Reading submitted (capitalized variant) |
| `newReading` | Server → Client | New sensor reading |
