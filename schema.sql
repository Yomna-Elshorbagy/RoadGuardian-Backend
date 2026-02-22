CREATE TABLE users (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(100)        NOT NULL,
    email        VARCHAR(150) UNIQUE NOT NULL,
    phone        VARCHAR(30),
    role         VARCHAR(20)         NOT NULL,
    password     VARCHAR(255),
    created_at   TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicles (
    id             BIGSERIAL PRIMARY KEY,
    owner_user_id  BIGINT REFERENCES users(id) ON DELETE SET NULL,
    plate_number   VARCHAR(20) UNIQUE NOT NULL,
    vin            VARCHAR(50),
    brand          VARCHAR(50),
    model          VARCHAR(50),
    year           INT,
    status         VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at     TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_owner ON vehicles(owner_user_id);

CREATE TABLE devices (
    id               BIGSERIAL PRIMARY KEY,
    vehicle_id       BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
    device_type      VARCHAR(30) NOT NULL,
    serial_number    VARCHAR(100) UNIQUE,
    imei             VARCHAR(30),
    firmware_version VARCHAR(50),
    status           VARCHAR(20) NOT NULL DEFAULT 'installed',
    last_online_at   TIMESTAMP,
    created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_devices_vehicle ON devices(vehicle_id);

CREATE TABLE telemetry_raw (
    id               BIGSERIAL PRIMARY KEY,
    device_id        BIGINT      NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    event_time       TIMESTAMP   NOT NULL,
    latitude         DOUBLE PRECISION,
    longitude        DOUBLE PRECISION,
    speed            DOUBLE PRECISION,
    accel_x          DOUBLE PRECISION,
    accel_y          DOUBLE PRECISION,
    accel_z          DOUBLE PRECISION,
    gyro_x          DOUBLE PRECISION,
    gyro_y          DOUBLE PRECISION,
    gyro_z          DOUBLE PRECISION,
    engine_temp      DOUBLE PRECISION,
    fuel_level       DOUBLE PRECISION,
    battery_voltage  DOUBLE PRECISION,
    raw_payload_json JSONB,
    created_at       TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telemetry_device_time ON telemetry_raw (device_id, event_time);
CREATE INDEX idx_telemetry_geo_time ON telemetry_raw (event_time, latitude, longitude);

CREATE TABLE accidents (
    id              BIGSERIAL PRIMARY KEY,
    device_id       BIGINT REFERENCES devices(id)  ON DELETE SET NULL,
    vehicle_id      BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
    detected_at     TIMESTAMP NOT NULL,
    reported_at     TIMESTAMP,
    latitude        DOUBLE PRECISION,
    longitude       DOUBLE PRECISION,
    speed_at_impact DOUBLE PRECISION,
    severity        VARCHAR(20),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    source          VARCHAR(20) NOT NULL,
    root_cause      VARCHAR(100),
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_accidents_vehicle_time ON accidents (vehicle_id, detected_at DESC);
CREATE INDEX idx_accidents_location_time ON accidents (detected_at DESC, latitude, longitude);

CREATE TABLE media_raw (
    id           BIGSERIAL PRIMARY KEY,
    device_id    BIGINT REFERENCES devices(id)  ON DELETE SET NULL,
    vehicle_id   BIGINT REFERENCES vehicles(id) ON DELETE SET NULL,
    accident_id  BIGINT,
    media_type   VARCHAR(20) NOT NULL,
    storage_url  TEXT        NOT NULL,
    format       VARCHAR(10),
    size_bytes   BIGINT,
    captured_at  TIMESTAMP   NOT NULL,
    source       VARCHAR(20) NOT NULL DEFAULT 'auto_capture',
    created_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_media_device_time ON media_raw (device_id, captured_at);
CREATE INDEX idx_media_vehicle_time ON media_raw (vehicle_id, captured_at);

ALTER TABLE media_raw
    ADD CONSTRAINT fk_media_accident
    FOREIGN KEY (accident_id) REFERENCES accidents(id)
    ON DELETE SET NULL;

CREATE INDEX idx_media_accident ON media_raw(accident_id);

CREATE TABLE ai_predictions (
    id                  BIGSERIAL PRIMARY KEY,
    media_id            BIGINT NOT NULL REFERENCES media_raw(id) ON DELETE CASCADE,
    related_accident_id BIGINT REFERENCES accidents(id) ON DELETE SET NULL,
    model_name          VARCHAR(100) NOT NULL,
    model_version       VARCHAR(50),
    prediction_type     VARCHAR(50) NOT NULL,
    confidence          DOUBLE PRECISION,
    result_json         JSONB NOT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_media ON ai_predictions(media_id);
CREATE INDEX idx_ai_accident ON ai_predictions(related_accident_id);
CREATE INDEX idx_ai_model_time ON ai_predictions(model_name, created_at DESC);

CREATE TABLE trip_summary (
    id               BIGSERIAL PRIMARY KEY,
    trip_id          VARCHAR(50) UNIQUE NOT NULL,
    vehicle_id       BIGINT NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    start_time       TIMESTAMP NOT NULL,
    end_time         TIMESTAMP NOT NULL,
    distance_km      DOUBLE PRECISION,
    avg_speed        DOUBLE PRECISION,
    max_speed        DOUBLE PRECISION,
    harsh_brakes_cnt INT,
    accidents_count  INT,
    safety_score     INT,
    created_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_trips_vehicle_time ON trip_summary(vehicle_id, start_time DESC);

CREATE TABLE alerts (
    id                BIGSERIAL PRIMARY KEY,
    accident_id       BIGINT REFERENCES accidents(id) ON DELETE CASCADE,
    user_id           BIGINT REFERENCES users(id)     ON DELETE CASCADE,
    channel           VARCHAR(20) NOT NULL,
    sent_at           TIMESTAMP   NOT NULL,
    status            VARCHAR(20) NOT NULL DEFAULT 'sent',
    response_time_sec INT,
    created_at        TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_accident ON alerts(accident_id);
CREATE INDEX idx_alerts_user ON alerts(user_id, sent_at DESC);

CREATE TABLE contacts (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL,
    message     TEXT         NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name        VARCHAR(100) NOT NULL,
    role        VARCHAR(100),
    rating      INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT NOT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_user ON reviews(user_id);
