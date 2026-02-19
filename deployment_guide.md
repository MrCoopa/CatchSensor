# CatchSensor Deployment Guide

This guide describes how to set up CatchSensor on a local home server (e.g., Raspberry Pi, Synology, generic Linux PC) using Docker.

## 1. Prerequisites

- Docker and Docker Compose installed.
- Access to the local network.
- (Optional) Nginx Proxy Manager (NPM) for SSL and easy access.

## 2. Setup

1. **Clone the Project**:
   ```bash
   git clone https://github.com/MrCoopa/CatchSensor.git
   cd CatchSensor
   ```

2. **Configuration**:
   Copy `.env.example` to `.env` and adjust the variables.

3. **Start**:
   ```bash
   docker-compose up -d
   ```

## 3. Local Access & Nginx Proxy Manager

Um SSL-Warnungen loszuwerden und die App unter einer schönen Adresse (z.B. `https://catchsensor.local`) zu erreichen, folge diesen Schritten in NPM:

- **Domain Names**: Deine Wunsch-Adresse (z.B. `catchsensor.home`).
- **Scheme**: `http`
- **Forward Host/IP**: Die IP deines Servers oder `catchsensor_app` (wenn NPM im selben Docker-Netzwerk ist).
- **Forward Port**: `5000`
- **Websockets Support**: **AN** (wichtig für Echtzeit-Updates!).

### SSL (Verschlüsselung)
Damit die Browser-Warnung verschwindet, brauchst du ein gültiges Zertifikat.
- **Option A (Einfach - Internet nötig):** Domain kurzzeitig per Port 80/443 freigeben, SSL in NPM via Let's Encrypt anfordern.
- **Option B (Lokal-Only - DNS Challenge):** Nutze Let's Encrypt mit der DNS Challenge in NPM.

### DNS-Eintrag
Vergiss nicht, in deinem Router (z.B. FritzBox) oder in deinem lokalen DNS (Pi-hole/AdGuard) einen Eintrag zu erstellen, der `catchsensor.home` auf die IP deines Servers zeigt.

## 4. Problembehebung Push (Android Chrome)

Wenn Chrome meldet: `Failed to register a ServiceWorker... An SSL certificate error occurred`, liegt das daran, dass Chrome für Service Worker ein **vertrauenswürdiges** Zertifikat verlangt. Ein einfaches "Beibehalten" der HTTPS-Warnung reicht hier nicht aus.

### Lösung A: Chrome "Insecure Origins" Flag (Sicherster & Einfachster Weg)
Du kannst Chrome sagen, dass er deine lokale Adresse als "sicher" behandeln soll, auch ohne echtes Zertifikat:

1. Öffne Chrome auf dem Handy.
2. Gib in die Adresszeile ein: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
3. Suche das Feld **"Insecure origins treated as secure"**.
4. Trage dort deine Adresse ein (exakt so wie in der URL-Zeile): `https://catchsensor.home`
5. Stelle den Schalter daneben auf **"Enabled"**.
6. Tippe unten auf **"Relaunch"**.

### Lösung B: Zertifikat im System installieren
Alternativ kannst du das Zertifikat direkt in Android importieren:

1. Lade die Datei `server.crt` auf dein Handy (z.B. per E-Mail oder USB).
2. Gehe zu **Einstellungen -> Sicherheit -> Weitere Sicherheitseinstellungen -> Verschlüsselung & Vorreiter -> Von Speicher installieren -> CA-Zertifikat**.
3. Wähle die `server.crt` Datei aus.
4. (Je nach Android-Version variiert der Pfad, suche nach "Zertifikat" in den Einstellungen).
5. Starte Chrome neu.
