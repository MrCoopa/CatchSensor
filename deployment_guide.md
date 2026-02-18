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
