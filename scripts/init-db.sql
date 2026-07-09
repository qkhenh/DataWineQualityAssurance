-- ============================================================
-- Wine Quality Assurance — PostgreSQL Schema
-- Ported from MySQL (backend/src/models/*.js)
-- ============================================================

-- ----------------------------------------
-- 1. warehouse (gốc, không phụ thuộc ai)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS warehouse (
    warehouse_id    SERIAL PRIMARY KEY,
    categories      VARCHAR(255),
    owner_id        INTEGER,                -- FK sẽ thêm sau khi tạo users
    invitation_token VARCHAR(255),
    token_expires_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 2. users (phụ thuộc warehouse)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS users (
    user_id         SERIAL PRIMARY KEY,
    username        VARCHAR(255) UNIQUE NOT NULL,
    password        VARCHAR(255) NOT NULL,
    email           VARCHAR(255),
    firstname       VARCHAR(255),
    lastname        VARCHAR(255),
    exp_year        VARCHAR(50),
    role            VARCHAR(50) CHECK (role IN ('manager', 'engineer', 'tester')) NOT NULL,
    warehouse_id    INTEGER REFERENCES warehouse(warehouse_id) ON DELETE SET NULL
);

-- Bây giờ thêm FK cho warehouse.owner_id → users.user_id
ALTER TABLE warehouse
    ADD CONSTRAINT fk_warehouse_owner
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE SET NULL;

-- ----------------------------------------
-- 3. Role-specific tables (phụ thuộc users)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS monitor (
    user_id             INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    department_leading  VARCHAR(255) DEFAULT 'General'
);

CREATE TABLE IF NOT EXISTS engineer (
    user_id     INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    expertise   VARCHAR(255) DEFAULT 'General'
);

CREATE TABLE IF NOT EXISTS tester (
    user_id         INTEGER PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
    flavor_profile  VARCHAR(255) DEFAULT 'General'
);

-- ----------------------------------------
-- 4. sessions (phụ thuộc users)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
    session_id      SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    refresh_token   VARCHAR(255) UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    revoked_at      TIMESTAMPTZ
);

-- ----------------------------------------
-- 5. line (phụ thuộc warehouse)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS line (
    line_id         INTEGER PRIMARY KEY,
    warehouse_id    INTEGER NOT NULL REFERENCES warehouse(warehouse_id) ON DELETE CASCADE,
    active_date     TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 6. sensors (phụ thuộc line)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS sensors (
    sensor_id       INTEGER PRIMARY KEY,
    model           VARCHAR(255),
    unit            VARCHAR(50),
    line_id         INTEGER NOT NULL REFERENCES line(line_id) ON DELETE CASCADE
);

-- ----------------------------------------
-- 7. batches (phụ thuộc line)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS batches (
    batch_id        INTEGER PRIMARY KEY,
    line_id         INTEGER NOT NULL REFERENCES line(line_id) ON DELETE CASCADE,
    quantity        INTEGER DEFAULT 0,
    producted_date  TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 8. product (phụ thuộc batches, warehouse, line)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS product (
    product_id          VARCHAR(255) PRIMARY KEY,
    batch_id            INTEGER REFERENCES batches(batch_id) ON DELETE CASCADE,
    warehouse_id        INTEGER REFERENCES warehouse(warehouse_id) ON DELETE CASCADE,
    line_id             INTEGER REFERENCES line(line_id) ON DELETE SET NULL,
    fixed_acidity       DOUBLE PRECISION,
    volatile_acidity    DOUBLE PRECISION,
    citric_acid         DOUBLE PRECISION,
    residual_sugar      DOUBLE PRECISION,
    chlorides           DOUBLE PRECISION,
    free_sulfur_dioxide DOUBLE PRECISION,
    total_sulfur_dioxide DOUBLE PRECISION,
    density             DOUBLE PRECISION,
    "pH"                DOUBLE PRECISION,
    sulphates           DOUBLE PRECISION,
    alcohol             DOUBLE PRECISION
);

-- ----------------------------------------
-- 9. ai_model (không phụ thuộc ai)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS ai_model (
    model_id    INTEGER PRIMARY KEY,
    version     VARCHAR(50)
);

-- Seed default model
INSERT INTO ai_model (model_id, version) VALUES (1, 'v1.0')
    ON CONFLICT (model_id) DO NOTHING;

-- ----------------------------------------
-- 10. is_predicted (phụ thuộc product, ai_model)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS is_predicted (
    predict_id          SERIAL PRIMARY KEY,
    time_predict        TIMESTAMPTZ DEFAULT NOW(),
    quality_score       DOUBLE PRECISION,
    confidence          VARCHAR(50),
    quality_category    VARCHAR(50),
    product_id          VARCHAR(255) REFERENCES product(product_id) ON DELETE CASCADE,
    ai_model            INTEGER REFERENCES ai_model(model_id) ON DELETE SET NULL
);

-- ----------------------------------------
-- 11. measure (phụ thuộc product, sensors)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS measure (
    product_id  VARCHAR(255) REFERENCES product(product_id) ON DELETE CASCADE,
    sensor_id   INTEGER REFERENCES sensors(sensor_id) ON DELETE CASCADE,
    value       DOUBLE PRECISION,
    PRIMARY KEY (product_id, sensor_id)
);

-- ----------------------------------------
-- 12. alerts (phụ thuộc warehouse)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
    alert_id        SERIAL PRIMARY KEY,
    warehouse_id    INTEGER REFERENCES warehouse(warehouse_id) ON DELETE CASCADE,
    product_id      VARCHAR(255),
    title           VARCHAR(255),
    description     TEXT,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 13. alert_settings (phụ thuộc warehouse)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS alert_settings (
    setting_id      SERIAL PRIMARY KEY,
    warehouse_id    INTEGER NOT NULL REFERENCES warehouse(warehouse_id) ON DELETE CASCADE,
    metric          VARCHAR(100) NOT NULL,
    min_value       DOUBLE PRECISION,
    max_value       DOUBLE PRECISION,
    enabled         BOOLEAN DEFAULT TRUE,
    UNIQUE (warehouse_id, metric)
);

-- ----------------------------------------
-- 14. invitation_tokens (phụ thuộc warehouse, users)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS invitation_tokens (
    token_id        SERIAL PRIMARY KEY,
    token           VARCHAR(255) UNIQUE NOT NULL,
    warehouse_id    INTEGER NOT NULL REFERENCES warehouse(warehouse_id) ON DELETE CASCADE,
    created_by      INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    expires_at      TIMESTAMPTZ NOT NULL
);

-- ----------------------------------------
-- 15. test_random (phụ thuộc users, product)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS test_random (
    test_id         SERIAL PRIMARY KEY,
    tester_id       INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id      VARCHAR(255) NOT NULL REFERENCES product(product_id) ON DELETE CASCADE,
    score           DOUBLE PRECISION,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------
-- 16. audit_log (phụ thuộc warehouse, users)
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    log_id          SERIAL PRIMARY KEY,
    event           VARCHAR(255),
    description     TEXT,
    time_log        TIMESTAMPTZ DEFAULT NOW(),
    warehouse_id    INTEGER REFERENCES warehouse(warehouse_id) ON DELETE CASCADE,
    engineer_id     INTEGER REFERENCES users(user_id) ON DELETE SET NULL
);


-- ============================================================
-- INDEXES (tăng tốc các query thường dùng)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_product_warehouse    ON product(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_product_batch        ON product(batch_id);
CREATE INDEX IF NOT EXISTS idx_product_line         ON product(line_id);
CREATE INDEX IF NOT EXISTS idx_is_predicted_product ON is_predicted(product_id);
CREATE INDEX IF NOT EXISTS idx_is_predicted_time    ON is_predicted(time_predict);
CREATE INDEX IF NOT EXISTS idx_alerts_warehouse     ON alerts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created       ON alerts(created_at);
CREATE INDEX IF NOT EXISTS idx_batches_line         ON batches(line_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token       ON sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_users_warehouse      ON users(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_test_random_tester   ON test_random(tester_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_warehouse  ON audit_log(warehouse_id);


-- ============================================================
-- dbt SCHEMAS (cho Phase 4 data transformation)
-- ============================================================

CREATE SCHEMA IF NOT EXISTS raw;
CREATE SCHEMA IF NOT EXISTS staging;
CREATE SCHEMA IF NOT EXISTS intermediate;
CREATE SCHEMA IF NOT EXISTS marts;
