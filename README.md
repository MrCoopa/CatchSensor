# 🦊 CatchSensor: Professionelles Fallen-Monitoring

**CatchSensor** ist eine hochmoderne IoT-Plattform zur Echtzeit-Überwachung von Fallenmeldern. Entwickelt für Jäger und Naturschützer, kombiniert CatchSensor maximale Zuverlässigkeit mit intuitiver Bedienung durch eine Hybrid-Architektur (PWA & Native Android).

---

## 🚀 Kern-Features

### 📊 Multi-Protokoll Dashboard
CatchSensor ist hersteller- und protokollunabhängig. Es vereint verschiedene Welten in einer Übersicht:
- **NB-IoT Integration**: Direkte Anbindung über einen integrierten MQTT-Broker.
- **LoRaWAN (TTN) Support**: Nahtlose Integration von The Things Network Geräten.
- **Echtzeit-Updates**: Dank **Socket.io** aktualisieren sich alle Statuswerte sofort ohne Seiten-Refresh.

### 🔔 Intelligente Alarmierung (Triple-Alert)
Verpassen Sie nie wieder einen Fang durch drei redundante Kanäle:
1. **Native Push (Android)**: Google Firebase Integration für zuverlässige System-Benachrichtigungen auf dem Smartphone.
2. **PWA Push (Web)**: Moderne Web-Push-Notification für Browser-Installationen.
3. **Pushover-Dienst**: Optionale Anbindung für professionelle Alarm-Ketten (API-Token & User-Key).

### 🔋 Energiemanagement & Watchdog
- **Präzise Überwachung**: Anzeige von Batteriespannung (V) und Ladestand (%) mit dynamischen Farbindikatoren.
- **Warnschwellen**: Individuell einstellbare Alarmschwellen für niedrigen Batteriestand.
- **Watchdog-Dienst**: Automatische Erkennung von Funkstille (> 8h). Das System markiert Geräte als *AUSFALL* und benachrichtigt den Nutzer.

### 📱 Hybrid-App & QR-Technologie
- **Native Android App**: Gebaut mit **Capacitor** für bessere Performance und native Push-Dienste.
- **QR-System**: Schnelles Hinzufügen von Meldern durch Scannen und einfaches Teilen von Geräten mit Jagdkameraden via QR-Code.

---

## 🛠 Technischer Stack

| Komponente | Technologie |
| :--- | :--- |
| **Frontend** | React (Vite), Tailwind CSS, Lucide Icons |
| **Mobile** | Capacitor (Android), native Push-Plugins |
| **Backend** | Node.js (Express), Socket.io, JWT Authentication |
| **Datenbank** | MariaDB / SQLite (via Sequelize ORM) |
| **IoT-Core** | Embedded Aedes MQTT Broker & TTN-Webhook-Integration |
| **Deployment** | Docker & Docker Compose |

---

## 📦 Deployment (Empfohlen via Docker)

Die Plattform ist vollständig dockerisiert und kann mit einem Befehl gestartet werden.

1. **Vorbereitung**:
   Stellen Sie sicher, dass `backend/serviceAccountKey.json` (FCM) vorhanden ist und die `.env` Datei konfiguriert wurde.

2. **Starten**:
   ```bash
   docker compose up --build -d
   ```

3. **URL & Netzwerk**:
   Die App ist vorkonfiguriert für den Einsatz hinter einem Nginx Proxy Manager mit der Domain `https://catchsensor.home`.

---

## ⚙️ Konfiguration (.env)

| Variable | Beschreibung |
| :--- | :--- |
| `VITE_API_URL` | Die URL unter der das Backend für die App erreichbar ist (z.B. `https://catchsensor.home`) |
| `APP_BASE_URL` | Basis-URL für interne Links und System-Redirects |
| `JWT_SECRET` | Geheimer Schlüssel für die Token-Authentifizierung |
| `VAPID_KEYS` | Schlüsselpaar für Web-Push (PWA) |

---

## 📋 Bedienungsanleitung

### Neues Gerät hinzufügen
1. Melder einschalten und Funknachricht senden.
2. Die App erkennt unbekannte Melder automatisch im Dashboard.
3. Auf **"Melder zuweisen"** klicken, Name vergeben und fertig.

### Melder teilen
In den Details eines Melders kann ein QR-Code generiert werden. Ein anderer Nutzer kann diesen scannen, um ebenfalls Zugriff auf die Statusmeldungen zu erhalten.

### Entwickler & Debugging
In den Setup-Einstellungen gibt es ein (mit Klick auf den Pfeil) erweiterbares Debug-Menü. Hier können:
- Push-Benachrichtigungen manuell getestet werden.
- Registrierte Service-Worker eingesehen werden.
- MQTT-Verbindungsstatus geprüft werden.

---
*Entwickelt mit Präzision für höchste Zuverlässigkeit bei der Jagd.*
