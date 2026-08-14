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
| GET    | /health                                 | Health check endpoint                           |

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