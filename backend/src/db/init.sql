-- Init SQL for Docker MariaDB

CREATE DATABASE IF NOT EXISTS trap_system;
USE trap_system;

-- Users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    pushover_key VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
    imei VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    network_type ENUM('NB-IoT', 'LoRaWAN') DEFAULT 'NB-IoT',
    status TINYINT DEFAULT 1, -- 0=Caught, 1=Armed, 2=Offline
    voltage_mv INT DEFAULT 0,
    rssi INT DEFAULT 0,
    last_seen TIMESTAMP NULL,
    voltage_offset INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Settings (One-to-One or One-to-Many logic, simplified here to per-user preference or per-device)
CREATE TABLE IF NOT EXISTS user_settings (
    user_id INT PRIMARY KEY,
    battery_threshold_mv INT DEFAULT 3400,
    web_push_subscription JSON, -- Stores VAPID token
    notifications_enabled BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Telemetry Logs
CREATE TABLE IF NOT EXISTS telemetry_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    device_imei VARCHAR(50),
    voltage_mv INT,
    rssi INT,
    status TINYINT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (device_imei) REFERENCES devices(imei) ON DELETE CASCADE
);
