# 🦊 CatchSensor

**CatchSensor** ist eine moderne IoT-Lösung zur Echtzeit-Überwachung von Fallenmeldern. Das System unterstützt sowohl **NB-IoT** (über eigenen Broker) als auch **LoRaWAN** (via The Things Network), bietet detaillierte Status-Visualisierungen und intelligente Benachrichtigungen.

---

## ✨ Features

- **📊 Dual-Path Dashboard**: Nahtlose Integration von NB-IoT und LoRaWAN Meldern in einer gemeinsamen Übersicht.
- **📡 Advanced Telemetry**: Anzeige von LoRa-Metadaten wie SNR, Spreading Factor (SF), Gateway-Anzahl und Frame Count.
- **🔋 Intelligentes Energiemanagement**:
  - Grafische Anzeige von Spannung (V) und Ladestand (%) mit Farbwechsel.
  - **Benutzerdefinierte Warnschwelle**: Einstellbarer Prozentwert für Battery-Alerts via Setup-Page.
- **🔔 Multi-Channel Notifications**:
  - **PWA Push**: Web-Push Benachrichtigungen direkt auf das Smartphone.
  - **Pushover Integration**: Dedizierte Schnittstelle für professionelle Alarmierung (App-Token & User-Key).
- **🕒 Lückenlose Historie**: Scrollbarer Ereignis-Stream mit allen technischen Daten pro Übertragung.
- **🆕 Auto-Provisioning**: Neue Geräte werden beim ersten Funkkontakt automatisch erfasst und können vom Benutzer einfach geclaimed (zugewiesen) werden.
- **🐕 Watchdog Service**: Hintergrund-Überwachung, die Melder bei Funkstille (> 8h) automatisch als OFFLINE markiert und warnt.

---

## 🛠 Technologie-Stack

### Frontend
- **React.js** (Vite) & Tailwind CSS
- **Lucide Icons** & Mobile-First Responsive Design
- **Socket.io** für Echtzeit-Statusupdates (Kein Refresh nötig)

### Backend
- **Node.js & Express**
- **MariaDB / PostgreSQL** (via Sequelize ORM)
- **Multi-Broker MQTT**: Getrennte Anbindung für NB-IoT (Aedes/External) und LoRaWAN (TTN).
- **Web-Push & Pushover** für zuverlässige Alarmierung.

---

## 🚀 Installation & Setup

### 1. Repository klonen
```bash
git clone https://github.com/MrCoopa/CatchSensor.git
cd CatchSensor
```

### 2. Backend einrichten
```bash
cd backend
npm install
# .env Datei erstellen (siehe interfaces.md für Details)
npm start
```

### 3. Frontend einrichten
```bash
cd client
npm install
npm run dev
```

---

## 📄 Dokumentation
Weitere technische Details finden Sie in der [interfaces.md](file:///d:/TrapSensor/TrapSensor/interfaces.md).

---
*Entwickelt mit ❤️ für eine effiziente und zuverlässige Fallenjagd.*

