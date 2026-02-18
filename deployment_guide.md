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
- **Reverse Proxy**: It is highly recommended to use **Nginx Proxy Manager** or **Traefik** to handle SSL (HTTPS). 
- **Tailscale/VPN**: For private remote access without exposing ports, using **Tailscale** is the easiest and most secure option for a home server.

## 🛠 Maintenance
- **View Logs**: `docker-compose logs -f app`
- **Restart**: `docker-compose restart app`
- **Update**: `git pull && docker-compose up --build -d`
