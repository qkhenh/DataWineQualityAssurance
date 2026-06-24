# Wine Quality Assurance — Full Data Engineering Refactor

> **Timeline:** 2 tuần (24/06 → 08/07/2026)
> **Mục tiêu:** Refactor từ CRUD monolith → DDD microservices với full DE stack, đóng gói Docker cho production-ready

---

## Tổng Quan Kiến Trúc Mới

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DOCKER COMPOSE                                  │
│                                                                         │
│  ┌──────────────┐    ┌─────────────┐    ┌──────────────────────────┐   │
│  │  Simulation  │───▶│   Kafka     │◀──▶│  Schema Registry (Avro)  │   │
│  │  (Producer)  │    │  (Broker)   │    └──────────────────────────┘   │
│  └──────────────┘    └──────┬──────┘                                    │
│                             │                                           │
│            ┌────────────────┼────────────────┐                         │
│            ▼                ▼                ▼                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                 │
│  │  Ingestion   │  │  Debezium    │  │  WebSocket   │                 │
│  │  Consumer    │  │  (CDC)       │  │  Gateway     │                 │
│  │  (Python)    │  │  Kafka Conn. │  │  (Python)    │                 │
│  └──────┬───────┘  └──────────────┘  └──────┬───────┘                 │
│         │                                    │                          │
│         ▼                                    │                          │
│  ┌──────────────┐                            │                          │
│  │  AI Service  │                            │                          │
│  │  (FastAPI)   │                            │                          │
│  │  XGBoost     │                            │                          │
│  └──────┬───────┘                            │                          │
│         │                                    │                          │
│         ▼                                    │                          │
│  ┌──────────────┐    ┌──────────────┐        │                          │
│  │  API Gateway │───▶│  PostgreSQL  │        │                          │
│  │  (FastAPI)   │    │  (OLTP)      │        │                          │
│  │  DDD/Pydantic│    └──────┬───────┘        │                          │
│  └──────┬───────┘           │                │                          │
│         │            ┌──────▼───────┐        │                          │
│         │            │  dbt         │        │                          │
│         │            │  (Transform) │        │                          │
│         │            │  raw→stg→mart│        │                          │
│         │            └──────────────┘        │                          │
│         │                                    │                          │
│         │            ┌──────────────┐        │                          │
│         │            │  Airflow     │        │                          │
│         │            │  (Scheduler) │        │                          │
│         │            └──────────────┘        │                          │
│         │                                    │                          │
│         ▼                                    ▼                          │
│  ┌──────────────────────────────────────────────┐                      │
│  │              Frontend (React/Vite)            │                      │
│  │              (Giữ nguyên, update endpoints)   │                      │
│  └───────────────────────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## User Review Required

> [!IMPORTANT]
> **Breaking Changes:** Toàn bộ backend Node.js sẽ bị thay thế bởi FastAPI Python. Frontend chỉ cần update API base URL và WebSocket connection — tất cả API response format sẽ được giữ tương thích.

> [!WARNING]
> **Database Migration:** Chuyển từ MySQL → PostgreSQL. Dữ liệu cũ (nếu có) sẽ cần migrate thủ công. Tuy nhiên vì đây là đồ án refactor, tôi giả định sẽ dùng seed data mới từ đầu.

> [!CAUTION]
> **Scope rất lớn cho 2 tuần.** Stack bao gồm: FastAPI + DDD + PostgreSQL + Kafka + Schema Registry + Debezium + dbt + Airflow + Docker. Tôi sẽ ưu tiên theo thứ tự: core functional → Kafka pipeline → dbt → Airflow → Debezium → polish. Nếu hết thời gian, Debezium CDC và Airflow DAGs nâng cao sẽ là những phần cuối cùng hoàn thiện.

---

## Open Questions

> [!IMPORTANT]
> **File `wine_data.csv` (1.3MB) vs `winequalityN.csv` (354KB):** File nào là dataset chính để seed? `winequalityN - Copy.csv` đã được dùng cho training. Tôi sẽ giữ `winequalityN.csv` làm dataset chính và dùng nó cho cả training lẫn seed data.

> [!NOTE]
> **AI Service giữ nguyên logic.** Tôi sẽ giữ nguyên XGBoost model + training pipeline + inference pipeline. Chỉ refactor structure cho clean hơn và đóng gói Docker. Artifacts (.joblib) sẽ được copy vào Docker image.

---

## Phase 1: Dọn Dẹp + Foundation (Ngày 1-2)

### 1.1 Xóa file rác

#### [DELETE] Các file không cần thiết ở root

| File | Lý do xóa |
|------|-----------|
| `app.py` | Script notebook thí nghiệm model, đã có `ai_service/training/train.py` |
| `models.py` | Script 824 dòng thí nghiệm cũ |
| `models_gpu.py` | Version GPU thử nghiệm |
| `test.py` | Script test thủ công |
| `check_users.py` | Debug script |
| `check_users.js` | Debug script |
| `SQL/test.py` | File rỗng |
| `SQL/test2.py` | File rỗng |
| `1thg12.md` | Note cá nhân |
| `Bao_Cao_Machine_Learning_Chi_Tiet.md` | Báo cáo ML, không thuộc source code |
| `Machine_Learning_Optimization_Essay.md` | Bài luận |
| `DWH_roadmap.md` | Roadmap cũ, thay bằng plan mới |
| `pyvenv.cfg` | Config venv lạc |
| `package.json`, `package-lock.json` (root) | Package rỗng ở root |
| `start_system.sh` | Thay bằng docker-compose |
| `winequalityN - Copy.csv` | Duplicate dataset |
| `wine_data.csv` | Dataset lớn không dùng (giữ `winequalityN.csv`) |
| `backend/check_users_internal.js` | Debug script |
| `SQL/` (folder) | Folder test rỗng |
| `DB/` (folder) | SQL dumps cũ cho MySQL, sẽ thay bằng migration mới |

### 1.2 Setup Project Structure mới

#### [NEW] Cấu trúc thư mục mới

```
DE_Project/
├── docker-compose.yml              # Orchestrate tất cả services
├── .env.example                     # Template environment variables
├── Makefile                         # Shortcuts: make up, make down, make logs
├── README.md                        # Hướng dẫn setup cho non-tech
│
├── services/
│   ├── api-gateway/                 # FastAPI backend (DDD)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── src/
│   │       ├── main.py              # FastAPI app entry
│   │       ├── config.py            # Settings (Pydantic BaseSettings)
│   │       │
│   │       ├── domain/              # DDD Domain Layer
│   │       │   ├── models/          # Domain entities (Pydantic)
│   │       │   │   ├── product.py
│   │       │   │   ├── warehouse.py
│   │       │   │   ├── user.py
│   │       │   │   ├── alert.py
│   │       │   │   ├── batch.py
│   │       │   │   └── prediction.py
│   │       │   ├── events/          # Domain events
│   │       │   │   ├── product_events.py
│   │       │   │   └── alert_events.py
│   │       │   └── repositories/    # Repository interfaces (ABC)
│   │       │       ├── product_repo.py
│   │       │       ├── warehouse_repo.py
│   │       │       ├── user_repo.py
│   │       │       └── alert_repo.py
│   │       │
│   │       ├── application/         # Application Layer (Use Cases)
│   │       │   ├── services/
│   │       │   │   ├── auth_service.py
│   │       │   │   ├── warehouse_service.py
│   │       │   │   ├── dashboard_service.py
│   │       │   │   ├── alert_service.py
│   │       │   │   └── team_service.py
│   │       │   └── dto/             # Data Transfer Objects
│   │       │       ├── auth_dto.py
│   │       │       ├── warehouse_dto.py
│   │       │       └── dashboard_dto.py
│   │       │
│   │       ├── infrastructure/      # Infrastructure Layer
│   │       │   ├── database/
│   │       │   │   ├── connection.py # AsyncPG connection pool
│   │       │   │   ├── migrations/  # SQL migrations (raw or Alembic)
│   │       │   │   └── repositories/ # Concrete repo implementations
│   │       │   │       ├── pg_product_repo.py
│   │       │   │       ├── pg_warehouse_repo.py
│   │       │   │       ├── pg_user_repo.py
│   │       │   │       └── pg_alert_repo.py
│   │       │   ├── kafka/
│   │       │   │   ├── producer.py   # Kafka producer (Avro)
│   │       │   │   └── schemas/     # Avro schema definitions
│   │       │   │       ├── wine_measurement.avsc
│   │       │   │       └── prediction_result.avsc
│   │       │   └── auth/
│   │       │       └── jwt_handler.py
│   │       │
│   │       └── presentation/        # Presentation Layer (API Routes)
│   │           ├── routes/
│   │           │   ├── auth_routes.py
│   │           │   ├── dashboard_routes.py
│   │           │   ├── warehouse_routes.py
│   │           │   ├── alert_routes.py
│   │           │   ├── team_routes.py
│   │           │   └── test_routes.py
│   │           └── middleware/
│   │               └── auth_middleware.py
│   │
│   ├── ai-service/                  # AI/ML Service (giữ nguyên logic)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── src/
│   │       ├── main.py
│   │       ├── schemas.py
│   │       ├── model_loader.py
│   │       └── artifacts/           # Pre-trained model files
│   │           ├── xgb_model.joblib
│   │           ├── scaler.joblib
│   │           ├── label_encoders.joblib
│   │           ├── imputation_values.joblib
│   │           └── feature_names.joblib
│   │
│   ├── ingestion-consumer/          # Kafka consumer (xử lý dữ liệu sensor)
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── src/
│   │       ├── main.py              # Consumer group logic
│   │       ├── handlers/
│   │       │   ├── measurement_handler.py  # Xử lý + gọi AI + lưu DB
│   │       │   └── dlq_handler.py          # Dead Letter Queue handler
│   │       └── config.py
│   │
│   ├── ws-gateway/                  # WebSocket Gateway
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   └── src/
│   │       ├── main.py              # FastAPI WebSocket server
│   │       ├── kafka_consumer.py    # Consume processed events → push WS
│   │       └── connection_manager.py # Manage WS connections by warehouse
│   │
│   └── simulation/                  # Data Simulator (Producer)
│       ├── Dockerfile
│       ├── requirements.txt
│       └── src/
│           ├── main.py              # Kafka producer
│           ├── generator.py         # Wine data generator
│           └── config.py
│
├── dbt/                             # dbt project
│   ├── dbt_project.yml
│   ├── profiles.yml
│   ├── models/
│   │   ├── staging/                 # 1:1 mapping từ raw tables
│   │   │   ├── stg_products.sql
│   │   │   ├── stg_predictions.sql
│   │   │   ├── stg_batches.sql
│   │   │   ├── stg_warehouses.sql
│   │   │   ├── stg_alerts.sql
│   │   │   └── schema.yml
│   │   ├── intermediate/           # Business logic transformations
│   │   │   ├── int_product_quality.sql
│   │   │   ├── int_batch_summary.sql
│   │   │   └── schema.yml
│   │   └── marts/                  # Final analytics tables
│   │       ├── mart_warehouse_kpi.sql
│   │       ├── mart_quality_trends.sql
│   │       ├── mart_line_performance.sql
│   │       ├── mart_alert_summary.sql
│   │       ├── mart_tester_accuracy.sql
│   │       └── schema.yml
│   ├── seeds/
│   │   └── wine_quality_raw.csv    # Seed data
│   ├── tests/
│   │   └── assert_quality_range.sql
│   └── macros/
│       └── quality_classification.sql
│
├── airflow/                         # Apache Airflow
│   ├── Dockerfile
│   ├── dags/
│   │   ├── dbt_transform_dag.py    # Schedule dbt runs
│   │   ├── data_quality_dag.py     # Data quality checks
│   │   └── cleanup_dag.py          # Cleanup old data
│   └── plugins/
│
├── kafka/                           # Kafka configs
│   └── connect/
│       └── debezium-postgres.json   # Debezium connector config
│
├── data/                            # Datasets
│   └── winequalityN.csv
│
├── scripts/                         # Utility scripts
│   ├── init-db.sql                  # PostgreSQL schema init
│   ├── seed-data.py                 # Seed initial data
│   └── wait-for-it.sh              # Health check helper
│
└── frontend/                        # (Giữ nguyên, update nhẹ)
    ├── Dockerfile                   # NEW: Dockerize frontend
    └── src/
        ├── lib/
        │   └── axios.js             # Update base URL
        └── Services/                # Update API endpoints if needed
```

---

## Phase 2: Backend DDD + PostgreSQL (Ngày 3-6)

### 2.1 Domain Layer

#### [NEW] `services/api-gateway/src/domain/models/product.py`
- Pydantic models cho `Product`, `WineMeasurement`, `Batch`, `Line`, `Sensor`
- Value Objects: `QualityScore`, `ProductId`, `BatchId`
- Domain validation rules (VD: pH range 0-14, alcohol 0-20)

#### [NEW] `services/api-gateway/src/domain/models/warehouse.py`
- `Warehouse`, `InvitationToken` entities
- Business rules: token expiry, owner validation

#### [NEW] `services/api-gateway/src/domain/models/user.py`
- `User`, `UserRole` (enum: manager, engineer, tester)
- Role-specific sub-entities: `Engineer`, `Manager`, `Tester`

#### [NEW] `services/api-gateway/src/domain/models/alert.py`
- `Alert`, `AlertSetting` entities
- Alert trigger logic as domain method

#### [NEW] `services/api-gateway/src/domain/repositories/*.py`
- Abstract Base Class interfaces cho tất cả repositories
- Dependency Inversion Principle: domain không phụ thuộc infrastructure

### 2.2 Infrastructure Layer — PostgreSQL

#### [NEW] `services/api-gateway/src/infrastructure/database/connection.py`
- AsyncPG connection pool (thay mysql2)
- Connection lifecycle management

#### [NEW] `scripts/init-db.sql`
- PostgreSQL schema (port từ MySQL)
- Thay đổi chính: `AUTO_INCREMENT` → `SERIAL`, `DATETIME` → `TIMESTAMP WITH TIME ZONE`
- Thêm indexes cho performance
- Thêm dbt raw schema

#### [NEW] `services/api-gateway/src/infrastructure/database/repositories/*.py`
- Concrete implementations cho domain repositories
- Raw SQL queries (asyncpg) — giữ đơn giản, không dùng ORM
- Transaction management

### 2.3 Application Layer — Use Cases

#### [NEW] `services/api-gateway/src/application/services/*.py`
- `AuthService`: signup, signin, signout, JWT management
- `WarehouseService`: create, join (token), generate token, get info
- `DashboardService`: stats, lines status, batches, products, comparisons
- `AlertService`: CRUD alerts + settings, trigger logic
- `TeamService`: get members
- Mỗi service inject repository qua dependency injection

### 2.4 Presentation Layer — API Routes

#### [NEW] `services/api-gateway/src/presentation/routes/*.py`
- FastAPI routers, mapping 1:1 với routes hiện tại
- Response format giữ tương thích với frontend
- Authentication middleware (JWT) dùng FastAPI `Depends`

**API Compatibility mapping:**

| Old (Express) | New (FastAPI) | Status |
|---|---|---|
| `POST /api/auth/signup` | `POST /api/auth/signup` | ✅ Same |
| `POST /api/auth/signin` | `POST /api/auth/signin` | ✅ Same |
| `POST /api/auth/signout` | `POST /api/auth/signout` | ✅ Same |
| `POST /api/simulation/data` | Removed — via Kafka | ⚠️ Changed |
| `GET /api/simulation/recent` | `GET /api/simulation/recent` | ✅ Same |
| `GET /api/dashboard/*` | `GET /api/dashboard/*` | ✅ Same |
| `POST /api/warehouse/*` | `POST /api/warehouse/*` | ✅ Same |
| `GET /api/alerts/*` | `GET /api/alerts/*` | ✅ Same |
| `GET /api/team` | `GET /api/team` | ✅ Same |
| `WebSocket (socket.io)` | `WebSocket (native)` | ⚠️ Changed |

---

## Phase 3: Kafka Streaming Pipeline (Ngày 5-8)

### 3.1 Kafka Infrastructure

#### [NEW] `docker-compose.yml` — Kafka stack
- **Zookeeper** (hoặc KRaft mode)
- **Kafka Broker** (1 broker, configurable)
- **Schema Registry** (Confluent)
- **Kafka Connect** (với Debezium PostgreSQL connector)
- **Kafka UI** (redpanda-console hoặc kafka-ui) — để monitor

#### [NEW] `services/api-gateway/src/infrastructure/kafka/schemas/*.avsc`
- `wine_measurement.avsc`: Schema cho sensor data từ simulation
- `prediction_result.avsc`: Schema cho AI prediction results
- `alert_event.avsc`: Schema cho alert events

### 3.2 Simulation Producer

#### [NEW] `services/simulation/src/main.py`
- Refactor `simulation.py` → Kafka producer
- Produce Avro messages to topic `wine.measurements.raw`
- Key: `warehouse_id` (partition by warehouse)
- Configurable rate, warehouse_id, number of lines

### 3.3 Ingestion Consumer

#### [NEW] `services/ingestion-consumer/src/main.py`
- Consumer Group: `ingestion-group`
- Consume from `wine.measurements.raw`
- Process pipeline:
  1. Deserialize Avro → Pydantic model
  2. Call AI Service (HTTP) for prediction
  3. Store product + prediction in PostgreSQL
  4. Produce to `wine.predictions.enriched` (for WebSocket gateway)
  5. Check alert rules → produce to `wine.alerts` if triggered
- **DLQ**: Failed messages → `wine.measurements.dlq`

### 3.4 WebSocket Gateway

#### [NEW] `services/ws-gateway/src/main.py`
- FastAPI WebSocket server
- Consume from `wine.predictions.enriched` topic
- Push to connected WebSocket clients filtered by `warehouse_id`
- Connection manager: join/leave warehouse rooms

#### [MODIFY] `frontend/src/lib/axios.js`
- Update base URL

#### [MODIFY] Frontend WebSocket connection
- Thay `socket.io-client` → native WebSocket
- Adapter pattern để minimize frontend changes

### 3.5 Debezium CDC

#### [NEW] `kafka/connect/debezium-postgres.json`
- Capture changes from PostgreSQL tables → Kafka topics
- Topics: `dbserver1.public.product`, `dbserver1.public.alerts`, etc.
- Dùng cho dbt incremental models hoặc downstream consumers

---

## Phase 4: dbt Data Transformation (Ngày 7-9)

### 4.1 dbt Project Setup

#### [NEW] `dbt/dbt_project.yml`
- Project name: `wine_quality_dw`
- Profile: `wine_quality`
- Target: PostgreSQL

#### [NEW] `dbt/profiles.yml`
- Connection config cho PostgreSQL (variables from env)

### 4.2 Staging Models (1:1 from raw)

#### [NEW] `dbt/models/staging/stg_products.sql`
```sql
SELECT
    product_id,
    batch_id,
    warehouse_id,
    line_id,
    fixed_acidity,
    volatile_acidity,
    citric_acid,
    residual_sugar,
    chlorides,
    free_sulfur_dioxide,
    total_sulfur_dioxide,
    density,
    ph,
    sulphates,
    alcohol,
    created_at
FROM {{ source('wine_production', 'product') }}
```

#### [NEW] Các staging models khác
- `stg_predictions.sql`, `stg_batches.sql`, `stg_warehouses.sql`, `stg_alerts.sql`, `stg_users.sql`
- Mỗi model có data type casting, renaming, basic cleaning

### 4.3 Intermediate Models (Business Logic)

#### [NEW] `dbt/models/intermediate/int_product_quality.sql`
- JOIN product + prediction
- Calculate quality classification (good/warning/error)
- Add time dimensions

#### [NEW] `dbt/models/intermediate/int_batch_summary.sql`
- Aggregate products by batch
- Average quality, product count, time range

### 4.4 Mart Models (Analytics)

#### [NEW] `dbt/models/marts/mart_warehouse_kpi.sql`
- KPIs per warehouse: total products, avg quality, active lines, alert count
- Phục vụ Dashboard stats endpoint

#### [NEW] `dbt/models/marts/mart_quality_trends.sql`
- Quality over time (daily/weekly/monthly)
- Phục vụ Comparison chart endpoint

#### [NEW] `dbt/models/marts/mart_line_performance.sql`
- Performance metrics per production line

#### [NEW] `dbt/models/marts/mart_alert_summary.sql`
- Alert frequency, top metrics triggering alerts

#### [NEW] `dbt/models/marts/mart_tester_accuracy.sql`
- Tester scores vs AI predictions comparison

### 4.5 dbt Tests & Documentation

#### [NEW] `dbt/models/*/schema.yml`
- Column descriptions
- `not_null`, `unique`, `accepted_values` tests
- Relationships tests

#### [NEW] `dbt/tests/assert_quality_range.sql`
- Custom test: quality_score between 0-10

---

## Phase 5: Apache Airflow (Ngày 9-11)

### 5.1 Airflow Setup

#### [NEW] `airflow/Dockerfile`
- Based on `apache/airflow:2.9-python3.11`
- Install `dbt-postgres`, `apache-airflow-providers-postgres`

#### [NEW] Docker Compose services
- `airflow-webserver`
- `airflow-scheduler`
- `airflow-init` (setup admin user)
- PostgreSQL for Airflow metadata (separate from app DB)

### 5.2 DAGs

#### [NEW] `airflow/dags/dbt_transform_dag.py`
- Schedule: Every 15 minutes (configurable)
- Tasks: `dbt run --select staging+` → `dbt run --select intermediate+` → `dbt run --select marts+`
- `dbt test` after each run
- Alert on failure

#### [NEW] `airflow/dags/data_quality_dag.py`
- Schedule: Daily
- Tasks: Run `dbt test` full suite
- Check null rates, duplicate rates
- Send alerts if quality degrades

#### [NEW] `airflow/dags/cleanup_dag.py`
- Schedule: Weekly
- Tasks: Clean old predictions, archive data, vacuum PostgreSQL

---

## Phase 6: AI Service Refactor (Ngày 10-11)

### AI Service — giữ nguyên logic, refactor structure

#### [MODIFY] `services/ai-service/`
- Port từ `ai_service/` hiện tại
- Giữ nguyên: `inference/main.py`, `inference/schemas.py`, model artifacts
- Thêm: Dockerfile, health check endpoint, structured logging
- Giữ nguyên training pipeline (optional retrain via Airflow DAG later)

---

## Phase 7: Docker + Deployment (Ngày 11-13)

### 7.1 Docker Compose

#### [NEW] `docker-compose.yml`

**Services (14 containers):**

| Service | Image/Build | Port |
|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 |
| `postgres-airflow` | `postgres:16-alpine` | 5433 |
| `zookeeper` | `confluentinc/cp-zookeeper:7.6.0` | 2181 |
| `kafka` | `confluentinc/cp-kafka:7.6.0` | 9092 |
| `schema-registry` | `confluentinc/cp-schema-registry:7.6.0` | 8081 |
| `kafka-connect` | `debezium/connect:2.6` | 8083 |
| `kafka-ui` | `provectuslabs/kafka-ui:latest` | 8080 |
| `api-gateway` | Build `./services/api-gateway` | 5001 |
| `ai-service` | Build `./services/ai-service` | 8000 |
| `ingestion-consumer` | Build `./services/ingestion-consumer` | — |
| `ws-gateway` | Build `./services/ws-gateway` | 5002 |
| `airflow-webserver` | Build `./airflow` | 8088 |
| `airflow-scheduler` | Build `./airflow` | — |
| `frontend` | Build `./frontend` | 5173 |

(Simulation chạy on-demand: `docker compose run simulation`)

### 7.2 Init Scripts

#### [NEW] `scripts/init-db.sql`
- Auto-run khi PostgreSQL container start lần đầu
- Create schema, tables, indexes
- Create dbt schemas (raw, staging, marts)

#### [NEW] `.env.example`
```env
# PostgreSQL
POSTGRES_USER=wine_admin
POSTGRES_PASSWORD=changeme
POSTGRES_DB=wine_production

# Kafka
KAFKA_BROKER=kafka:9092

# AI Service
AI_SERVICE_URL=http://ai-service:8000

# JWT
ACCESS_TOKEN_SECRET=your-secret-key

# Frontend
VITE_API_URL=http://localhost:5001
VITE_WS_URL=ws://localhost:5002
```

#### [NEW] `Makefile`
```makefile
up:        docker compose up -d
down:      docker compose down
logs:      docker compose logs -f
restart:   docker compose restart
simulate:  docker compose run simulation --warehouse 1
dbt-run:   docker compose exec airflow-scheduler dbt run
status:    docker compose ps
reset:     docker compose down -v && docker compose up -d
```

### 7.3 Frontend Dockerization

#### [NEW] `frontend/Dockerfile`
- Multi-stage build: Node build → Nginx serve
- Nginx config với reverse proxy tới API gateway

---

## Phase 8: Integration + Testing + Polish (Ngày 13-14)

### 8.1 Integration Testing
- End-to-end: Simulation → Kafka → Consumer → AI → DB → WebSocket → Frontend
- Health check tất cả services
- Verify dbt models chạy đúng
- Verify Airflow DAGs trigger successfully
- Verify Debezium captures changes

### 8.2 Documentation

#### [MODIFY] `README.md`
- Viết lại hoàn toàn cho project mới
- Quick start guide (3 bước: clone, .env, docker compose up)
- Architecture diagram
- API documentation
- Troubleshooting guide

### 8.3 Frontend Updates

#### [MODIFY] `frontend/src/lib/axios.js`
- Update base URL to use env variable

#### [MODIFY] `frontend/src/Pages/realtime.jsx`
- Adapter: socket.io → native WebSocket
- Minimal changes, giữ component structure

#### [MODIFY] `frontend/src/stores/useAuthStore.js`
- Update nếu cần (cookie handling có thể khác)

---

## Timeline Chi Tiết (2 Tuần)

| Ngày | Phase | Deliverable |
|------|-------|-------------|
| **1** | 1.1 | Xóa file rác, commit clean |
| **2** | 1.2 | Setup project structure, Dockerfiles skeleton |
| **3** | 2.1-2.2 | Domain models (Pydantic) + PostgreSQL schema |
| **4** | 2.3 | Application services (use cases) |
| **5** | 2.4 + 3.1 | API routes + Kafka docker setup |
| **6** | 3.2-3.3 | Simulation producer + Ingestion consumer |
| **7** | 3.4 + 4.1 | WebSocket gateway + dbt project setup |
| **8** | 4.2-4.4 | dbt staging + intermediate + marts models |
| **9** | 4.5 + 5.1 | dbt tests + Airflow setup |
| **10** | 5.2 + 6 | Airflow DAGs + AI service refactor |
| **11** | 3.5 + 7.1 | Debezium CDC + docker-compose tuning |
| **12** | 7.2-7.3 | Init scripts + Frontend Docker + Makefile |
| **13** | 8.1 | Integration testing, bug fixes |
| **14** | 8.2-8.3 | README, frontend updates, final polish |

---

## Verification Plan

### Automated Tests
```bash
# 1. All containers healthy
docker compose ps --format "table {{.Name}}\t{{.Status}}"

# 2. PostgreSQL schema correct
docker compose exec postgres psql -U wine_admin -d wine_production -c "\dt"

# 3. Kafka topics created
docker compose exec kafka kafka-topics --list --bootstrap-server localhost:9092

# 4. API Gateway responds
curl http://localhost:5001/api/health

# 5. AI Service responds
curl http://localhost:8000/

# 6. dbt models build
docker compose exec airflow-scheduler dbt run --project-dir /dbt

# 7. End-to-end simulation test
docker compose run simulation --warehouse 1 --count 10

# 8. WebSocket connection test
wscat -c ws://localhost:5002/ws/warehouse/1
```

### Manual Verification
- Mở browser `http://localhost:5173` → Login → Dashboard hiện data
- Chạy simulation → Realtime page nhận data liên tục
- Mở Kafka UI `http://localhost:8080` → Verify messages flowing
- Mở Airflow UI `http://localhost:8088` → Verify DAGs scheduled
- Kiểm tra dbt docs: `docker compose exec airflow-scheduler dbt docs generate`

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Scope quá lớn cho 2 tuần | Cao | Ưu tiên core pipeline trước, Debezium/Airflow nâng cao làm sau |
| Frontend WebSocket migration | Trung bình | Dùng adapter pattern, fallback socket.io nếu cần |
| Kafka + Schema Registry complexity | Trung bình | Start simple (JSON), migrate to Avro khi stable |
| Docker compose 14 containers → RAM | Trung bình | Optimize resource limits, có thể merge services nếu cần |
| Debezium setup phức tạp | Thấp | Đây là enhancement, có thể làm cuối hoặc skip |
