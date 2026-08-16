# Shipment Tracker - Backend API

![GitHub](https://img.shields.io/github/license/Anuj-er/cargo-tracker-backend)
![Node.js](https://img.shields.io/badge/node-18.x-green)
![Express](https://img.shields.io/badge/express-4.x-blue)
![MongoDB](https://img.shields.io/badge/mongodb-atlas-green)
![Docker](https://img.shields.io/badge/docker-ready-brightgreen)

A robust Node.js API for tracking cargo shipments with MongoDB integration. Built as part of the MERN Stack Tracking Assignment.

## 🔗 Repository Links
- Backend: [https://github.com/Anuj-er/cargo-tracker-backend](https://github.com/Anuj-er/cargo-tracker-backend)
- Frontend: [https://github.com/Anuj-er/cargo-tracker-webapp](https://github.com/Anuj-er/cargo-tracker-webapp)

## 📋 Assignment Fulfillment

This project implements a complete Cargo Shipment Tracker backend using Node.js, Express, and MongoDB as per the assignment requirements:

### Backend Implementation
- **API Endpoints**: All required endpoints for shipment tracking and management
- **Data Modeling**: Comprehensive shipment model with all required fields
- **Geospatial Support**: Location tracking with MongoDB geospatial features
- **ETA Calculation**: Algorithms to determine estimated arrival times
- **Docker Support**: Complete containerization for easy deployment

## 🔌 API Endpoints

| Method | Endpoint                                | Description                                     |
|--------|-----------------------------------------|-------------------------------------------------|
| GET    | /api/shipments                          | Retrieve all shipments with details             |
| GET    | /api/shipments/:id                      | Get specific shipment details                   |
| POST   | /api/shipments/:id/update-location      | Update the current location of a shipment       |
| GET    | /api/shipments/:id/eta                  | Get estimated arrival time                      |
| POST   | /api/shipments                          | Create a new shipment with container ID         |
| GET    | /api/shipments/:id/history              | Get shipment location history                   |
| GET    | /api/shipments/delay-summary            | 지연 리스크 등급별 집계                          |
| GET    | /api/shipments?riskLevel=지연위험        | 지연 리스크 등급으로 필터링                      |
| POST   | /api/damage-inspection                  | 화물 사진 업로드 → 파손 여부 판정                |
| GET    | /api/damage-inspection                  | 최근 판정 이력 (페이지네이션)                    |
| GET    | /health                                 | Health check endpoint                           |

## 📷 화물 파손 판정 (Damage Inspection)

### v1 — 비전 LLM zero-shot 판정

실제 파손 사진 라벨링 데이터가 없어 자체 분류 모델을 학습시킬 수 없습니다.
대신 비전 지원 LLM 에 사진과 검수 기준을 함께 보내 zero-shot 으로 판정합니다.
학습 데이터 0건으로도 동작하고, 커스텀 CV 모델의 학습·운영 비용이 들지 않습니다.

향후 실제 파손 사진 라벨링 데이터를 확보하면 자체 분류 모델로 정확도를 개선할
수 있으며, 그때 이 v1 이 성능 비교 기준선이 됩니다.

```
사진 업로드 → 리사이즈(최대 1024px, JPEG q70) → qwen/qwen3.6-27b 호출
  → <think> 블록 제거 후 JSON 파싱 → MongoDB 저장 → 결과 반환
```

### ⚠️ 이 기능은 판정 보조 도구입니다

**AI 가 파손을 100% 정확하게 감지하지 못합니다.** 1차 스크리닝 결과이며,
최종 파손 여부와 배상 판단은 반드시 담당자가 실물로 확인해야 합니다.

공개 이미지 5장으로 검증한 결과 **4/5 정답**이었고, 다음과 같은 실패가 있었습니다.

| 이미지 | 정답 | 판정 | 결과 |
|--------|------|------|------|
| 파손 상자 (FRAGILE, 모서리 찌그러짐) | 파손 | 이상없음 (confidence 0.95) | ❌ **미탐** |
| 파손 상자 (현관 배송) | 파손 | 찌그러짐 / 경미 (0.95) | ✅ |
| 정상 상자 (이삿짐 트럭) | 정상 | 이상없음 (0.95) | ✅ |
| 정상 크레이트 (핸드트럭) | 정상 | 해당없음 (1.0) | ✅ |
| 인물 초상화 (화물 아님) | 해당없음 | 해당없음 (1.0) | ✅ |

첫 번째 사례가 특히 중요합니다. **눈에 띄게 찌그러진 상자를 "이상 없음"으로,
그것도 confidence 0.95 로 단정**했습니다. 확신도가 높다고 정확한 것이 아니므로
UI 와 문서에서 이 점을 명시하고 있습니다.

### 모델 선택과 제약

- **모델**: `qwen/qwen3.6-27b` (Groq). Llama 4 Scout/Maverick 은 Groq 가 2026년에
  서비스를 종료해 사용할 수 없습니다(`model_not_found`).
- **thinking 모델**: `<think>` 블록에 토큰을 씁니다. `max_tokens` 3,000 으로 두고,
  길이 초과로 잘리면 4,500 으로 올려 1회 재시도합니다. temperature 0 이라 같은
  조건으로 재시도하면 같은 결과가 나오므로 상한을 바꿔서 재시도합니다.
- **레이트리밋 TPM 8,000**: 사진 1장에 약 2,600~4,100 토큰(대부분 prompt 2,182).
  분당 2~3장이 한계입니다. 대응:
  - 호출 전 리사이즈로 토큰 절감
  - 순차 큐로 동시 호출 차단 (한 번에 1건)
  - openai SDK 가 429 를 내부 재시도하므로 응답이 느려지는 형태로 나타납니다.
    실측상 5장 연속 업로드 시 마지막 건이 약 3분 걸렸습니다. 무한 대기를 막으려
    요청 타임아웃 90초 / maxRetries 1 을 두었고, 초과 시 429 안내가 나갑니다.

### 업로드 검증

- jpg / png 만 허용 (mimetype + **매직 바이트** 이중 확인)
- 최대 5MB, 1회 1장
- 메모리 저장 — 업로드 파일이 서버 파일시스템에 남지 않음
- DB 에는 원본이 아닌 리사이즈된 압축본만 저장

### 구현 위치

| 파일 | 역할 |
|------|------|
| `src/utils/damage-inspection.js` | 리사이즈, 프롬프트, JSON 파싱, 순차 큐 |
| `src/models/damage-inspection.model.js` | 판정 기록 (사람 검토 필드 포함) |
| `src/routes/damage-inspection.routes.js` | multer 업로드 + 파일 검증 |

## ⏱️ 지연 감지 (Delay Risk Detection)

### v1 — 규칙 기반 baseline

화물이 "예상 운송 소요일" 대비 얼마나 시간이 지났는지로 지연 위험도를 계산합니다.

```
경과율 = (현재까지 경과일) ÷ (해당 운송모드의 표준 소요일)

  경과율 < 0.85        → 정상
  0.85 ≤ 경과율 < 1.0  → 지연위험
  경과율 ≥ 1.0         → 지연
```

배송 완료(`delivered`) 건은 이미 결과가 나온 건이라 집계에서 제외합니다.

### 왜 처음부터 ML 을 쓰지 않았나

실제 배송 이력 데이터가 아직 없어 **학습할 정답 레이블이 없습니다.** 규칙 기반
baseline 은 물류 업계에서 ML 도입 전 단계로 흔히 쓰는 접근이며, 나중에 모델을
올렸을 때 성능을 비교할 기준선(baseline)이 됩니다.

고도화 순서는 다음과 같이 계획하고 있습니다.

1. **v1 (현재)** — 규칙 기반. 표준 소요일 대비 경과율.
2. **v2** — 실제 배송 이력 확보 후 `transit-times.js` 를 실측 분포(중앙값/p90)로 교체.
   같은 규칙을 쓰되 기준값만 실측으로 바꾸므로 즉시 정확도가 올라갑니다.
3. **v3** — 노선·계절·통관 소요·운송사 등을 feature 로 쓰는 회귀/분류 모델.
   v1 을 baseline 으로 두고 개선폭을 측정합니다.

### ⚠️ 현재 데이터의 한계

- `src/config/transit-times.js` 의 표준 소요일은 **EXPRESS(회사소개서 실측)를 제외하면
  전부 업계 평균 추정치**입니다. 각 항목의 `source` 필드로 구분됩니다.
  API 응답에도 `standardSource` 로 함께 내려줍니다.
- `npm run seed:shipments` 로 만드는 화물은 **데모용 합성 데이터이며 실제 배송
  기록이 아닙니다.** 트래킹 번호가 `DEMO-` 로 시작하고 고객명/품목에 `[DEMO]`
  표시가 붙습니다. `--reset` 은 이 표시가 있는 문서만 삭제하므로 실데이터가
  섞여 있어도 안전합니다.

### 구현 위치

| 파일 | 역할 |
|------|------|
| `src/config/transit-times.js` | 운송모드별 표준 소요일 테이블 |
| `src/utils/delay-risk.js` | 스코어링 순수 함수 (테이블·기준시각 주입) |
| `src/utils/delay-risk.test.js` | 경계값·방어로직 단위 테스트 (25 케이스) |
| `src/scripts/seed-shipments.js` | 데모용 합성 화물 생성 |

저장된 `delayRiskScore` / `delayRiskLevel` 은 **시간이 지나면 낡습니다.** 조회 API 는
응답을 만들 때 다시 계산하고, 등급 필터링도 저장값이 아니라 `shippedAt` 날짜
범위로 조회합니다.

```bash
npm run seed:shipments            # 합성 화물 36건 생성
npm run seed:shipments -- --reset # 기존 합성 데이터 삭제 후 재생성
npx jest src/utils/delay-risk.test.js
```

## 📊 Data Model

### Shipment Schema

```javascript
{
  shipmentId: String,            // Unique identifier
  containerId: String,           // Container identifier
  origin: {                      // Origin location
    type: 'Point',
    coordinates: [Number, Number],
    address: String,
    timestamp: Date
  },
  destination: {                 // Destination location
    type: 'Point',
    coordinates: [Number, Number],
    address: String,
    timestamp: Date
  },
  currentLocation: {             // Current location
    type: 'Point',
    coordinates: [Number, Number],
    address: String,
    timestamp: Date
  },
  route: [{                      // Route waypoints
    type: 'Point',
    coordinates: [Number, Number],
    address: String,
    estimatedArrival: Date
  }],
  status: String,                // pending, in_transit, out_for_delivery, delivered, exception
  currentEta: Date,              // Current estimated delivery date
  history: [{                    // Location history
    location: {
      type: 'Point',
      coordinates: [Number, Number],
      address: String
    },
    status: String,
    timestamp: Date
  }]
}
```

## 🚀 Live Demo

- Backend API: [https://cargo-tracker-backend-jhy2.onrender.com](https://cargo-tracker-backend-jhy2.onrender.com)
- Frontend: [https://shipmenttracker.vercel.app/](https://shipmenttracker.vercel.app/)

## 🛠️ Technologies

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Winston** - Logging
- **Helmet** - Security middleware
- **Cors** - Cross-origin resource sharing

## 🔧 Setup and Installation

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [Docker](https://www.docker.com/get-started) and [Docker Compose](https://docs.docker.com/compose/install/) (optional, for containerized deployment)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account or local MongoDB installation

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/shipment-tracker?retryWrites=true&w=majority
```

### Installation Options

#### Standard Setup

```bash
# Clone the repository
git clone https://github.com/Anuj-er/cargo-tracker-backend.git

# Navigate to the project directory
cd cargo-tracker-backend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The API will be available at http://localhost:5000

#### Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/Anuj-er/cargo-tracker-backend.git

# Navigate to the project directory
cd cargo-tracker-backend

# Create .env file with required environment variables
echo "NODE_ENV=development" > .env
echo "PORT=5000" >> .env
echo "MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/shipment-tracker?retryWrites=true&w=majority" >> .env

# Make the deploy script executable
chmod +x docker-deploy.sh

# Run the deployment script
./docker-deploy.sh
```

The API will be available at http://localhost:5000

## 📁 Project Structure

```
cargo-tracker-backend/
├── src/
│   ├── config/                # Configuration files
│   │   └── database.js        # Database connection
│   │   └── shipment.controller.js
│   ├── middleware/            # Custom middleware
│   │   └── error.middleware.js
│   ├── models/                # Database models
│   │   └── shipment.model.js
│   ├── routes/                # API routes
│   │   └── shipment.routes.js
│   ├── utils/                 # Utility functions
│   │   └── location.utils.js
│   └── server.js              # Entry point
├── .env                       # Environment variables
├── docker-compose.yml         # Docker Compose configuration
├── Dockerfile                 # Docker configuration
└── package.json               # Dependencies and scripts
```

## 🐳 Docker Commands

### Building and Running
```bash
# Build and start the container (uses docker-compose.yml)
docker-compose up -d --build

# Alternative: Run the deploy script
./docker-deploy.sh
```

### Monitoring and Management
```bash
# View running containers
docker ps

# View container logs
docker-compose logs -f

# View logs for a specific service
docker-compose logs -f api

# Check container health
curl http://localhost:5000/health

# Inspect MongoDB data
docker exec -it shipment-tracker-mongo mongosh
```

### Stopping and Cleaning Up
```bash
# Stop containers
docker-compose down

# Stop containers and remove volumes
docker-compose down -v

# Remove all stopped containers, unused networks, images and volumes
docker system prune -a --volumes
```

### Rebuilding After Changes
```bash
# Rebuild the application after code changes
docker-compose up -d --build
```

## 🚢 Deployment

### Render Deployment
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Use `npm start` as the start command
4. Add environment variables (NODE_ENV, PORT, MONGO_URI)

## 📝 Assumptions

- MongoDB Atlas is used as the database service, but local MongoDB can also be configured
- Geospatial queries are supported by the MongoDB instance
- Each shipment has a unique ID and container ID
- The route is represented as an array of waypoints
- ETA calculations are based on current location and route information
- Authentication is handled separately or will be implemented in future versions

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 