# 🦊 CatchSensor: Vollständiger Installations-Guide

Dieser Guide führt dich Schritt für Schritt durch die Einrichtung von CatchSensor – von der lokalen Entwicklung bis zum produktiven Server-Deployment und der Android-App.

---

## 1. Voraussetzungen

Bevor du startest, stelle sicher, dass folgende Software installiert ist:
- **Node.js** (v20 oder neuer) & **npm**
- **Docker & Docker Compose** (für Server-Deployment)
- **Git**
- **Android Studio** (nur für den Build der Android-App)

---

## 2. Vorbereitung (Konten & Keys)

### Firebase (für Native Push-Benachrichtigungen)
1. Gehe zur [Firebase Console](https://console.firebase.google.com/).
2. Erstelle ein neues Projekt (z.B. "CatchSensor").
3. Füge eine **Android-App** hinzu (Paketname: `com.catchsensor.app`).
4. Lade die `google-services.json` herunter und verschiebe sie nach `client/android/app/`.
5. Gehe zu **Projekteinstellungen -> Servicekonten** und klicke auf **"Neuen privaten Schlüssel generieren"**.
6. Speichere diese Datei als `serviceAccountKey.json` im Verzeichnis `backend/`.

### The Things Network (für LoRaWAN)
1. Erstelle eine Applikation in der [TTN Console](https://eu1.cloud.thethings.network/).
2. Notiere dir die MQTT-Zugangsdaten (Username & API-Key).
3. Trage diese in die zentrale `.env` ein.

---

## 3. Zentrale Konfiguration (.env)

Es gibt nur **eine einzige Stelle** für alle Einstellungen: die `.env` Datei im Hauptverzeichnis.

```env
PORT=5000
DB_HOST=localhost # Oder catchsensor_db bei Docker
VITE_API_URL=https://catchsensor.home
APP_BASE_URL=https://catchsensor.home

# MQTT & Push Keys hier einfügen...
```

---

## 4. Lokale Entwicklung

### Backend
1. `cd backend`
2. `npm install`
3. `npm start` (Das Backend lädt automatisch die `.env` aus dem Hauptverzeichnis).

### Frontend
1. `cd client`
2. `npm install`
3. `npm run dev`

---

## 5. Android-App Build & Sync

Um die Android-App mit deinen Einstellungen zu bauen:
1. Stelle sicher, dass die `VITE_API_URL` in der `.env` korrekt ist.
2. `cd client`
3. `npm run build`
4. `npx cap sync android`
5. Öffne den Ordner `client/android` in **Android Studio**.
6. Verbinde dein Handy und klicke auf **Run**.

---

## 6. Produktion (Docker & Portainer)

CatchSensor ist für den Betrieb mit Docker optimiert.

### Docker Compose
1. `docker compose up --build -d`
2. Die App ist nun unter `http://deine-ip:5000` erreichbar.

### Nginx Proxy Manager (Empfohlen)
Um HTTPS und die Domain `https://catchsensor.home` zu nutzen:
- Erstelle einen Proxy Host in NPM.
- Ziel: `http://catchsensor_app:5000`.
- Aktiviere **Websockets Support**.
- Erstelle ein SSL-Zertifikat.

---

## 7. Troubleshooting

### Login schlägt fehl (Android)
- Prüfe, ob dein Handy die Domain `catchsensor.home` auflösen kann (DNS-Eintrag im Router nötig).
- Prüfe, ob das SSL-Zertifikat vom Handy akzeptiert wird.

### Keine Push-Benachrichtigungen
- Prüfe, ob die `serviceAccountKey.json` im Backend-Ordner liegt.
- Prüfe in der App unter **Setup -> Debug**, ob das Token registriert wurde.

---
*Viel Erfolg bei der Fangjagd! Bei Fragen hilft die [README.md](README.md) weiter.*
