# RoadGuardian Database Architecture

This document provides a comprehensive overview of the PostgreSQL database schema for the **RoadGuardian** application. The database is designed to handle users, vehicles, IoT devices, telemetry data, accident detection and most of data come from IOT and Ai to store in database.

## Table of Contents

- [Core Entities](#core-entities)
- [IoT and Telemetry](#iot-and-telemetry)
- [Accident & AI Detection](#accident--ai-detection)
- [Analytics & Interaction](#analytics--interaction)

---

## Core Entities

### `users`

Stores all user information, including regular users, admins, and drivers.

- **`id`**: Primary Key
- **`name`**, **`email`** (Unique), **`phone`**
- **`role`**: Defines user permissions (e.g., user, admin, driver)
- **`password`**: Hashed password

### `vehicles`

Stores vehicles managed by users.

- **`id`**: Primary Key
- **`owner_user_id`**: References `users(id)`
- **`plate_number`** (Unique), **`vin`**, **`brand`**, **`model`**, **`year`**
- **`status`**: Current status of the vehicle (default: 'active')
- **Indexes**: `idx_vehicles_owner`

---

## IoT and Telemetry

### `devices`

Represents the IoT hardware installed in the vehicles.

- **`id`**: Primary Key
- **`vehicle_id`**: References `vehicles(id)`
- **`device_type`**, **`serial_number`** (Unique), **`imei`**, **`firmware_version`**
- **`status`**: Device operational status (default: 'installed')
- **`last_online_at`**: Timestamp of the last ping
- **Indexes**: `idx_devices_vehicle`

### `telemetry_raw`

High-frequency data streams coming from vehicle devices. This entity is highly indexed for time-series and geospatial queries.

- **`device_id`**: References `devices(id)`
- **`event_time`**: When the data was captured
- **Location**: `latitude`, `longitude`
- **Sensors**: `speed`, `accel_x/y/z` (Accelerometer), `gyro_x/y/z` (Gyroscope), `engine_temp`, `fuel_level`, `battery_voltage`
- **`raw_payload_json`**: Raw JSON representation for flexible storage.
- **Indexes**: `idx_telemetry_device_time`, `idx_telemetry_geo_time`

---

## Accident & AI Detection

### `accidents`

Records incidents detected either manually or automatically via telemetry/AI.

- **`id`**: Primary Key
- **`device_id`**, **`vehicle_id`**
- **`detected_at`**, **`reported_at`**
- **Location**: `latitude`, `longitude`
- **Details**: `speed_at_impact`, `severity`, `source`, `root_cause`
- **`status`**: e.g., 'pending'
- **Indexes**: `idx_accidents_vehicle_time`, `idx_accidents_location_time`

### `media_raw`

Stores metadata and links to media (photos/videos) captured from dashcams or user uploads.

- **`device_id`**, **`vehicle_id`**, **`accident_id`**
- **`media_type`**, **`storage_url`**, **`format`**, **`size_bytes`**
- **`source`**: e.g., 'auto_capture'
- **Indexes**: `idx_media_device_time`, `idx_media_vehicle_time`, `idx_media_accident`

### `ai_predictions`

Stores the results of AI models running inference on `media_raw` to detect accidents or hazards.

- **`media_id`**: References `media_raw(id)`
- **`related_accident_id`**: Links the prediction to a specific accident record.
- **Model Info**: `model_name`, `model_version`
- **Result Details**: `prediction_type`, `confidence`, `result_json`
- **Indexes**: `idx_ai_media`, `idx_ai_accident`, `idx_ai_model_time`

---

## Analytics & Interaction

### `trip_summary`

Aggregated data representing a single, completed journey.

- **`trip_id`** (Unique)
- **`vehicle_id`**
- **`start_time`**, **`end_time`**
- **Metrics**: `distance_km`, `avg_speed`, `max_speed`, `harsh_brakes_cnt`, `accidents_count`, `safety_score`
- **Indexes**: `idx_trips_vehicle_time`

### `alerts`

Push notifications, SMS, or emails sent out when an accident or safety hazard occurs.

- **`accident_id`**, **`user_id`**
- **`channel`**, **`sent_at`**, **`status`**, **`response_time_sec`**
- **Indexes**: `idx_alerts_accident`, `idx_alerts_user`

### `contacts`

Stores support or inquiry messages sent by users from the website.

- **`name`**, **`email`**, **`message`**

### `reviews`

Stores app or service reviews from users.

- **`user_id`**
- **`name`**, **`role`**, **`rating`** (1-5 constraint), **`comment`**
- **Indexes**: `idx_reviews_user`
