# 🏠 Home Server Deployment Guide

This guide describes how to set up TrapSensor on a local home server (e.g., Raspberry Pi, Synology, generic Linux PC) using Docker.

## 📋 Prerequisites
- **Docker** and **Docker Compose** installed.
- Access to your router/local network for port forwarding (optional, for remote access).

## 🚀 Step-by-Step Setup

### 1. Prepare Environment
Copy the production template and fill in your values:
```bash
cp .env.production.example .env
```
> [!IMPORTANT]
> Make sure to set a secure `JWT_SECRET` and correct Database credentials.

### 2. Launch with Docker Compose (CLI)
Run the following command in the root folder (where the `Dockerfile` is):
```bash
docker-compose up -d --build
```

### 3. Launch with Portainer (Alternative)
Wenn du **Portainer** nutzt, darfst du den Code **nicht** einfach in den "Web Editor" kopieren.
1. Klicke links auf **Stacks** und dann rechts auf den Button **+ Add stack**.
2. Scrolle zu **Build method** (direkt unter dem Namen des Stacks).
3. Dort findest du mehrere Kacheln/Buttons. Klicke auf **Repository**.
4. Es erscheinen neue Felder:
   - **Repository URL**: `https://github.com/MrCoopa/TrapSensor.git`
   - **Repository reference**: Hier musst du zwingend **`refs/heads/docker`** (oder einfach nur **`docker`**) eingeben.
5. Scrolle ganz nach unten und klicke auf **Deploy the stack**. 
   *Portainer lädt nun alle Dateien vom Docker-Branch selbstständig im Hintergrund.*

### 4. Verification
- **Web UI**: Open `http://<your-server-ip>:5000` in your browser.
- **API Status**: Check `http://<your-server-ip>:5000/api/status`.
- **MQTT**: Point your NB-IoT devices to `<your-server-ip>:1884`.

## 🛠 Troubleshooting

### ❌ Error: `unexpected character "" in variable name`
Dieser Fehler liegt an einer falschen Zeichenkodierung (UTF-16) in Portainer.
**Die einfachste Lösung:**
1. Lösche **alle** Einträge im Bereich **Environment variables** in Portainer komplett.
2. Ich habe die `docker-compose.yml` so angepasst, dass sie nun **Standardwerte** nutzt, wenn keine Variablen angegeben sind.
3. Der Stack wird nun auch ohne manuelle Eingabe von Variablen erfolgreich starten.
4. Sobald der Stack läuft, kannst du die Sicherheitseinstellungen (Passwörter etc.) in Ruhe anpassen.

## 🔒 Security Tips
## 🌐 Nginx Proxy Manager (NPM) Setup

Um SSL-Warnungen loszuwerden und die App unter einer schönen Adresse (z.B. `https://trapsensor.local`) zu erreichen, folge diesen Schritten in NPM:

### 1. Proxy Host anlegen
- **Domain Names**: Deine Wunsch-Adresse (z.B. `trapsensor.home`).
- **Scheme**: `http`
- **Forward Host/IP**: Die IP deines Servers oder `trapsensor_app` (wenn NPM im selben Docker-Netzwerk ist).
- **Forward Port**: `5000`
- **Websockets Support**: **AN** (wichtig für Echtzeit-Updates!).
- **Block Common Exploits**: AN.

### 2. SSL (Verschlüsselung)
Damit die Browser-Warnung verschwindet, brauchst du ein gültiges Zertifikat.
- **Option A (Einfach - Internet nötig):**域名 kurzzeitig per Port 80/443 freigeben, SSL in NPM via Let's Encrypt anfordern ("Request a new SSL Certificate"). Danach Ports wieder schließen.
- **Option B (Lokal-Only - Fortgeschritten):** Nutze Let's Encrypt mit der **DNS Challenge** in NPM. Dabei musst du keine Ports öffnen, sondern NPM verifiziert den Besitz der Domain über deinen DNS-Provider (z.B. Cloudflare, Ionos).
- **Option C (Eigene CA):** Lokales Zertifikat (z.B. via Step-CA oder mkcert) erstellen und im Tab "Custom SSL" hochladen.

### 3. DNS-Eintrag
Vergiss nicht, in deinem Router (z.B. FritzBox) oder in deinem lokalen DNS (Pi-hole/AdGuard) einen Eintrag zu erstellen, der `trapsensor.home` auf die IP deines Servers zeigt.

## 🔒 Security Tips
- **Trust Proxy**: Die App ist bereits so konfiguriert, dass sie `X-Forwarded-For` Header von NPM akzeptiert.
- **Tailscale/VPN**: Für privaten Fernzugriff ohne Portfreigaben ist **Tailscale** die am einfachsten zu konfigurierende Option.

## 🛠 Maintenance
- **View Logs**: `docker-compose logs -f app`
- **Restart**: `docker-compose restart app`
- **Update**: `git pull && docker-compose up --build -d`
