const mongoose = require('mongoose');
const TRANSIT_TIMES = require('../config/transit-times');
const { TRANSPORT_MODES } = require('../config/transit-times');
const {
  RISK_LEVELS,
  calculateDelayRisk,
  calculateEstimatedArrival
} = require('../utils/delay-risk');

const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point',
    required: true
  },
  coordinates: {
    type: [Number], // [longitude, latitude]
    required: true,
    validate: {
      validator: function(v) {
        return v.length === 2 && 
               v[0] >= -180 && v[0] <= 180 && 
               v[1] >= -90 && v[1] <= 90;
      },
      message: props => `${props.value} is not a valid coordinate [longitude, latitude]`
    }
  },
  address: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const checkpointSchema = new mongoose.Schema({
  location: {
    type: locationSchema,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  estimatedArrival: {
    type: Date
  },
  reached: {
    type: Boolean,
    default: false
  },
  notes: String
});

const shipmentSchema = new mongoose.Schema({
  trackingNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  origin: {
    type: locationSchema,
    required: true
  },
  destination: {
    type: locationSchema,
    required: true
  },
  checkpoints: [checkpointSchema],
  currentLocation: {
    type: locationSchema,
    required: true
  },
  status: {
    // 'delayed' 는 지연 감지 기능에서 추가. 기존 값은 그대로 유지한다.
    type: String,
    enum: ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'delayed'],
    default: 'pending',
    required: true
  },
  estimatedDelivery: {
    type: Date,
    required: true
  },

  // ── 지연 리스크 스코어링 (v1: 규칙 기반) ────────────────────────────
  // 자세한 계산은 utils/delay-risk.js 참고.
  transportMode: {
    type: String,
    enum: TRANSPORT_MODES,
    index: true
  },
  /** 집하 일시. 경과율 계산의 기준점이라 없으면 스코어링에서 제외된다. */
  shippedAt: {
    type: Date,
    index: true
  },
  /** shippedAt + 운송모드 표준 소요일 (pre-save 훅에서 자동 계산) */
  estimatedArrivalAt: {
    type: Date
  },
  /**
   * 경과율 스냅샷 (0 ~ 1+).
   * ⚠️ 시간이 지나면 낡는 값이다. 목록/집계 API 는 조회 시점에 다시 계산해
   *    응답하므로, 이 필드는 마지막 저장 시점의 참고값으로만 쓴다.
   */
  delayRiskScore: {
    type: Number,
    min: 0
  },
  delayRiskLevel: {
    type: String,
    enum: [RISK_LEVELS.NORMAL, RISK_LEVELS.AT_RISK, RISK_LEVELS.DELAYED]
  },
  history: [{
    location: locationSchema,
    status: {
      type: String,
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  customer: {
    name: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    phone: String
  },
  items: [{
    description: String,
    quantity: {
      type: Number,
      min: 1
    },
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for geospatial queries
shipmentSchema.index({ 'currentLocation.coordinates': '2dsphere' });

// 리스크 등급 필터는 transportMode + shippedAt 범위로 조회한다 (delay-risk.js 참고)
shipmentSchema.index({ transportMode: 1, shippedAt: 1 });

/**
 * 저장 전에 예상 도착일과 리스크 스냅샷을 채운다.
 * 스냅샷은 저장 시점 기준이라 시간이 지나면 낡으므로, 조회 API 는
 * 응답을 만들 때 다시 계산한다.
 */
shipmentSchema.pre('save', function assignDelayRisk(next) {
  if (this.shippedAt && this.transportMode) {
    this.estimatedArrivalAt = calculateEstimatedArrival(
      this.shippedAt,
      this.transportMode,
      TRANSIT_TIMES
    );
  }

  const risk = calculateDelayRisk(this, TRANSIT_TIMES);
  if (!risk.skipped) {
    this.delayRiskScore = risk.score;
    this.delayRiskLevel = risk.level;
  }

  next();
});

// Add a method to update location
shipmentSchema.methods.updateLocation = async function(locationData, status, description) {
  this.currentLocation = {
    type: 'Point',
    coordinates: [locationData.longitude, locationData.latitude],
    address: locationData.address,
    timestamp: new Date()
  };
  
  if (status) this.status = status;
  
  this.history.push({
    location: this.currentLocation,
    status: status || this.status,
    description: description || 'Location updated',
    timestamp: new Date()
  });
  
  // Check if we've reached any checkpoints
  if (this.checkpoints && this.checkpoints.length > 0) {
    const currentCoords = this.currentLocation.coordinates;
    
    // Check each checkpoint to see if we're close enough to mark it as reached
    this.checkpoints.forEach(checkpoint => {
      if (!checkpoint.reached) {
        const checkpointCoords = checkpoint.location.coordinates;
        
        // Calculate distance between current location and checkpoint (simplified)
        const distance = calculateDistance(currentCoords, checkpointCoords);
        
        // If within 0.5 km, mark as reached
        if (distance < 0.5) {
          checkpoint.reached = true;
          
          // Add to history
          this.history.push({
            location: this.currentLocation,
            status: this.status,
            description: `Reached checkpoint: ${checkpoint.name}`,
            timestamp: new Date()
          });
        }
      }
    });
  }
  
  return this.save();
};

// Helper function to calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(point2[1] - point1[1]);
  const dLon = toRad(point2[0] - point1[0]);
  const lat1 = toRad(point1[1]);
  const lat2 = toRad(point2[1]);

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

const Shipment = mongoose.model('Shipment', shipmentSchema);

module.exports = Shipment;
