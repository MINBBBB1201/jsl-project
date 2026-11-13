const Shipment = require("../../models/shipment.model");
const logger = require("../../utils/logger");
const mongoose = require("mongoose");
const TRANSIT_TIMES = require("../../config/transit-times");
const { buildRiskLevelQuery, RISK_LEVELS } = require("../../utils/delay-risk");
const shipmentEvents = require("../../services/shipment-events.service");
const {
  PII_EXCLUDED_FIELDS,
  stripPii,
  withFreshRisk,
  generateTrackingNumber,
  calculateEstimatedDelivery,
} = require("./shared");

// Create a new shipment
exports.createShipment = async (req, res) => {
  try {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      logger.warn(
        "MongoDB not connected during shipment creation, attempting to reconnect...",
      );
      try {
        // Try to reconnect
        const { connectDB } = require("../../config/database");
        await connectDB();
        logger.info("MongoDB reconnected successfully for shipment creation");
      } catch (connError) {
        logger.error(
          "Failed to reconnect to MongoDB for shipment creation:",
          connError,
        );
        return res.status(500).json({
          success: false,
          error: "Database connection error. Please try again later.",
        });
      }
    }

    const { origin, destination, checkpoints, customer, items } = req.body;

    // Validate required fields
    if (!origin || !origin.coordinates || !origin.address) {
      return res.status(400).json({
        success: false,
        error: "Origin with coordinates and address is required",
      });
    }

    if (!destination || !destination.coordinates || !destination.address) {
      return res.status(400).json({
        success: false,
        error: "Destination with coordinates and address is required",
      });
    }

    if (!customer || !customer.name || !customer.email) {
      return res.status(400).json({
        success: false,
        error: "Customer with name and email is required",
      });
    }

    // Process checkpoints if provided
    let validatedCheckpoints = [];
    if (checkpoints && Array.isArray(checkpoints) && checkpoints.length > 0) {
      // Validate each checkpoint
      for (const checkpoint of checkpoints) {
        if (
          !checkpoint.location ||
          !checkpoint.location.coordinates ||
          !checkpoint.location.address
        ) {
          return res.status(400).json({
            success: false,
            error:
              "Each checkpoint must have location with coordinates and address",
          });
        }

        if (!checkpoint.name) {
          return res.status(400).json({
            success: false,
            error: "Each checkpoint must have a name",
          });
        }

        validatedCheckpoints.push({
          location: {
            type: "Point",
            coordinates: checkpoint.location.coordinates,
            address: checkpoint.location.address,
            timestamp: new Date(),
          },
          name: checkpoint.name,
          estimatedArrival: checkpoint.estimatedArrival || null,
          reached: false,
          notes: checkpoint.notes || "",
        });
      }
    }

    // Create new shipment
    const shipment = new Shipment({
      trackingNumber: generateTrackingNumber(),
      origin: {
        type: "Point",
        coordinates: origin.coordinates,
        address: origin.address,
        timestamp: new Date(),
      },
      destination: {
        type: "Point",
        coordinates: destination.coordinates,
        address: destination.address,
        timestamp: new Date(),
      },
      checkpoints: validatedCheckpoints,
      currentLocation: {
        type: "Point",
        coordinates: origin.coordinates,
        address: origin.address,
        timestamp: new Date(),
      },
      status: "pending",
      estimatedDelivery:
        req.body.estimatedDelivery || calculateEstimatedDelivery(),
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
      },
      items: items || [],
      history: [
        {
          location: {
            type: "Point",
            coordinates: origin.coordinates,
            address: origin.address,
            timestamp: new Date(),
          },
          status: "pending",
          description: "Shipment created",
          timestamp: new Date(),
        },
      ],
    });

    // Save with retry mechanism
    let savedShipment;
    try {
      savedShipment = await shipment.save();
    } catch (saveError) {
      // If first save fails, try one more time
      if (
        saveError.name === "MongoNetworkError" ||
        saveError.name === "MongoTimeoutError" ||
        (saveError.message && saveError.message.includes("connection"))
      ) {
        logger.warn(
          "MongoDB save error, attempting to reconnect and retry:",
          saveError,
        );

        // 재연결 후 한 번 더. 여기서 또 던지면 바깥 catch 로 간다.
        const { connectDB } = require("../../config/database");
        await connectDB();
        savedShipment = await shipment.save();
        logger.info("Shipment saved successfully after retry");
      } else {
        throw saveError; // Will be caught by outer catch block
      }
    }

    logger.info(`New shipment created: ${savedShipment.trackingNumber}`);

    res.status(201).json({
      success: true,
      data: stripPii(savedShipment),
      message: "Shipment created successfully",
    });
  } catch (error) {
    logger.error("Error creating shipment:", error);

    // Provide more specific error messages based on the error type
    let errorMessage = "Failed to create shipment";

    if (error.name === "ValidationError") {
      errorMessage =
        "Invalid shipment data: " +
        Object.values(error.errors)
          .map((e) => e.message)
          .join(", ");
    } else if (error.name === "MongoServerError" && error.code === 11000) {
      errorMessage = "Duplicate tracking number. Please try again.";
    } else if (error.name === "MongoNetworkError") {
      errorMessage =
        "Network error connecting to database. Please try again later.";
    }

    res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update shipment location
exports.updateShipmentLocation = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { coordinates, address, status, description } = req.body;

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    // Update location and status
    await shipment.updateLocation(
      {
        longitude: coordinates[0],
        latitude: coordinates[1],
        address: address,
      },
      status,
      description,
    );

    logger.info(`Shipment ${trackingNumber} location updated`);

    // Get updated shipment
    const updatedShipment = await Shipment.findOne({ trackingNumber });

    // 위치 갱신에도 상태가 함께 바뀔 수 있어 같은 알림 트리거를 태운다
    await shipmentEvents.handleShipmentSaved(updatedShipment);

    res.status(200).json({
      success: true,
      data: stripPii(updatedShipment),
      message: "Shipment location updated successfully",
    });
  } catch (error) {
    logger.error("Error updating shipment location:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update shipment location",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Get all shipments with filtering and sorting
exports.getAllShipments = async (req, res) => {
  try {
    // Check MongoDB connection first
    if (mongoose.connection.readyState !== 1) {
      logger.warn(
        "MongoDB not connected when fetching shipments, attempting to reconnect...",
      );
      try {
        // Try to reconnect
        const { connectDB } = require("../../config/database");
        await connectDB();
        logger.info("MongoDB reconnected successfully for fetching shipments");
      } catch (connError) {
        logger.error(
          "Failed to reconnect to MongoDB for fetching shipments:",
          connError,
        );
        return res.status(500).json({
          success: false,
          error: "Database connection error. Please try again later.",
        });
      }
    }

    const {
      status,
      riskLevel,
      transportMode,
      sortBy,
      sortOrder,
      limit = 50,
      page = 1,
    } = req.query;
    const now = new Date();
    const query = {};

    // Apply filters
    if (status) {
      query.status = status;
    }

    if (transportMode) {
      query.transportMode = transportMode;
    }

    // 리스크 등급 필터.
    // 저장된 delayRiskLevel 은 낡을 수 있어 shippedAt 날짜 범위로 조회한다.
    if (riskLevel) {
      const riskQuery = buildRiskLevelQuery(riskLevel, TRANSIT_TIMES, { now });
      if (!riskQuery) {
        return res.status(400).json({
          success: false,
          error: `riskLevel 은 ${Object.values(RISK_LEVELS).join(", ")} 중 하나여야 합니다.`,
        });
      }
      query.$or = riskQuery.$or;
      // status 를 명시적으로 넘긴 경우 그 필터를 우선한다
      if (!status) {
        query.status = riskQuery.status;
      }
    }

    // Apply sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      // Default sort by createdAt in descending order (newest first)
      sortOptions.createdAt = -1;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const limitValue = parseInt(limit);

    // Fetch shipments with retry mechanism
    let shipments;
    try {
      shipments = await Shipment.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitValue)
        .select(`-__v ${PII_EXCLUDED_FIELDS}`);
    } catch (fetchError) {
      // If first fetch fails, try one more time
      if (
        fetchError.name === "MongoNetworkError" ||
        fetchError.name === "MongoTimeoutError" ||
        (fetchError.message && fetchError.message.includes("connection"))
      ) {
        logger.warn(
          "MongoDB fetch error, attempting to reconnect and retry:",
          fetchError,
        );

        // 재연결 후 한 번 더. 여기서 또 던지면 바깥 catch 로 간다.
        const { connectDB } = require("../../config/database");
        await connectDB();
        shipments = await Shipment.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitValue)
          .select(`-__v ${PII_EXCLUDED_FIELDS}`);

        logger.info("Shipments fetched successfully after retry");
      } else {
        throw fetchError; // Will be caught by outer catch block
      }
    }

    // Get total count for pagination info
    const totalCount = await Shipment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: shipments.map((shipment) => withFreshRisk(shipment, now)),
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: limitValue,
        pages: Math.ceil(totalCount / limitValue),
      },
    });
  } catch (error) {
    logger.error("Error fetching shipments:", error);

    // Provide more specific error messages based on the error type
    let errorMessage = "Failed to fetch shipments";

    if (error.name === "MongoNetworkError") {
      errorMessage =
        "Network error connecting to database. Please try again later.";
    } else if (error.name === "MongoServerError") {
      errorMessage = "Database server error. Please try again later.";
    }

    res.status(500).json({
      success: false,
      error: errorMessage,
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update shipment status
exports.updateShipmentStatus = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { status, description } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: "Status is required",
      });
    }

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    // Update status
    shipment.status = status;

    // Add to history
    shipment.history.push({
      location: shipment.currentLocation,
      status,
      description: description || `Status updated to ${status}`,
      timestamp: new Date(),
    });

    await shipment.save();

    logger.info(`Shipment ${trackingNumber} status updated to ${status}`);

    // 배송완료 / 지연위험 알림 트리거 (실패해도 상태 변경은 이미 저장됐다)
    await shipmentEvents.handleShipmentSaved(shipment);

    res.status(200).json({
      success: true,
      data: shipment,
      message: "Shipment status updated successfully",
    });
  } catch (error) {
    logger.error("Error updating shipment status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update shipment status",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update shipment location manually
exports.updateShipmentLocationManually = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { coordinates, address, status, description } = req.body;

    // Validate coordinates
    if (
      !coordinates ||
      !Array.isArray(coordinates) ||
      coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        error: "Valid coordinates [longitude, latitude] are required",
      });
    }

    // Validate address
    if (!address) {
      return res.status(400).json({
        success: false,
        error: "Address is required",
      });
    }

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    // Update current location
    shipment.currentLocation = {
      type: "Point",
      coordinates: coordinates,
      address: address,
      timestamp: new Date(),
    };

    // Update status if provided
    if (status) {
      shipment.status = status;
    }

    // Add to history
    shipment.history.push({
      location: shipment.currentLocation,
      status: status || shipment.status,
      description: description || "Location updated manually",
      timestamp: new Date(),
    });

    await shipment.save();

    logger.info(`Shipment ${trackingNumber} location updated manually`);

    await shipmentEvents.handleShipmentSaved(shipment);

    res.status(200).json({
      success: true,
      data: shipment,
      message: "Shipment location updated successfully",
    });
  } catch (error) {
    logger.error("Error updating shipment location manually:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update shipment location",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
