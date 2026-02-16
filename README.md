<<<<<<< HEAD
=======
[README.md](https://github.com/user-attachments/files/25348458/README.md)
>>>>>>> d3b442b20a3070770c9b12967d081f6b48d7f4a4
# 🦊 TrapSensor

**TrapSensor** ist eine moderne IoT-Lösung zur Echtzeit-Überwachung von Fallenmeldern. Das System bietet eine robuste MQTT-Anbindung, detaillierte Status-Visualisierungen und Push-Benachrichtigungen direkt auf das Smartphone.

---

## ✨ Features

- **📊 Echtzeit-Dashboard**: Übersicht über alle Melder mit Status (FANG! / BEREIT), Akkustand und Signalstärke.
- **🔋 Dynamische Akku-Anzeige**: Grafische Darstellung des Ladestands mit intelligentem Farbwechsel (Rot ≤ 25 %).
- **📶 Visuelle Signalstärke**: Professionelle Anzeige der Empfangsqualität via Signalbalken und absolutem RSSI-Wert (dBm).
- **🕒 Detaillierter Verlauf**: Lückenlose Historie aller Ereignisse pro Melder mit Zeitstempel und technischen Details.
- **📱 PWA-Unterstützung**: Kann als Web-App auf dem Homescreen installiert werden (inkl. Offline-Cache).
- **🔍 QR-Scanner**: Schnelles Hinzufügen neuer Melder durch Scannen des IMEI-Tags.
- **🔔 Push-Benachrichtigungen**: Sofortige Info bei Fangmeldung oder kritischem Akkustand.

---

## 🛠 Technologie-Stack

### Frontend
- **React.js** (Vite)
- **Tailwind CSS** (Styling)
- **Lucide Icons** (UI-Elemente)
- **Socket.io-client** (Real-time Updates)

### Backend
- **Node.js & Express**
- **MariaDB** (via Sequelize ORM)
- **MQTT.js** (Broker-Anbindung)
- **JSON Web Tokens (JWT)** (Sicherheit)
- **Web-Push** (Benachrichtigungen)

---

## 🚀 Installation & Setup

### 1. Repository klonen
```bash
git clone <repository-url>
cd TrapSensor
```

### 2. Backend einrichten
```bash
cd backend
npm install
# .env Datei erstellen und DB/MQTT-Zugangsdaten konfigurieren
node seed.js # Grund-Setup (Benutzer & Fallendemo)
npm start
```

### 3. Frontend einrichten
```bash
cd client
npm install
npm run dev
```

---

## 🦊 Branding & Design
Das Projekt nutzt ein minimalistisches **Fox-Logo** und folgt einer modernen "Glassmorphism"-Ästhetik. Die Farben sind auf maximale Lesbarkeit im Gelände optimiert.

---

## 📄 Lizenz
Dieses Projekt ist für den privaten Einsatz zur Fallenüberwachung konzipiert.

---
*Entwickelt mit ❤️ für eine effiziente Fallenjagd.*
