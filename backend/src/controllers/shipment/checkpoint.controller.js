const Shipment = require("../../models/shipment.model");
const logger = require("../../utils/logger");
const { stripPii } = require("./shared");

// Add a checkpoint to shipment
exports.addCheckpoint = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { location, name, estimatedArrival, notes } = req.body;

    // Validate required fields
    if (!location || !location.coordinates || !location.address) {
      return res.status(400).json({
        success: false,
        error: "Location with coordinates and address is required",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Checkpoint name is required",
      });
    }

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    // Create new checkpoint
    const newCheckpoint = {
      location: {
        type: "Point",
        coordinates: location.coordinates,
        address: location.address,
        timestamp: new Date(),
      },
      name,
      estimatedArrival: estimatedArrival || null,
      reached: false,
      notes: notes || "",
    };

    // Add to checkpoints array
    shipment.checkpoints.push(newCheckpoint);

    await shipment.save();

    logger.info(`Checkpoint added to shipment ${trackingNumber}`);

    res.status(200).json({
      success: true,
      data: stripPii(shipment),
      message: "Checkpoint added successfully",
    });
  } catch (error) {
    logger.error("Error adding checkpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add checkpoint",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Update a checkpoint
exports.updateCheckpoint = async (req, res) => {
  try {
    const { trackingNumber, checkpointId } = req.params;
    const { name, estimatedArrival, reached, notes, location } = req.body;

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    // Find the checkpoint
    const checkpoint = shipment.checkpoints.id(checkpointId);

    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        error: "Checkpoint not found",
      });
    }

    // Update fields if provided
    if (name) checkpoint.name = name;
    if (estimatedArrival !== undefined)
      checkpoint.estimatedArrival = estimatedArrival;
    // 도달 여부는 덮어쓰기 전에 기억해 둔다. 먼저 대입하면 아래 "처음 도달" 판단이 늘 거짓이 돼
    // 이력이 쌓이지 않았다.
    const wasReached = checkpoint.reached;
    if (reached !== undefined) checkpoint.reached = reached;
    if (notes !== undefined) checkpoint.notes = notes;

    // Update location if provided
    if (location && location.coordinates && location.address) {
      checkpoint.location = {
        type: "Point",
        coordinates: location.coordinates,
        address: location.address,
        timestamp: new Date(),
      };
    }

    // If checkpoint is marked as reached, add to history
    if (reached && !wasReached) {
      shipment.history.push({
        location: shipment.currentLocation,
        status: shipment.status,
        description: `Checkpoint reached: ${checkpoint.name}`,
        timestamp: new Date(),
      });

      checkpoint.reached = true;
    }

    await shipment.save();

    logger.info(
      `Checkpoint ${checkpointId} updated for shipment ${trackingNumber}`,
    );

    res.status(200).json({
      success: true,
      data: stripPii(shipment),
      message: "Checkpoint updated successfully",
    });
  } catch (error) {
    logger.error("Error updating checkpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update checkpoint",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Delete a checkpoint
exports.deleteCheckpoint = async (req, res) => {
  try {
    const { trackingNumber, checkpointId } = req.params;

    const shipment = await Shipment.findOne({ trackingNumber });

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found",
      });
    }

    // Find and remove the checkpoint
    const checkpoint = shipment.checkpoints.id(checkpointId);

    if (!checkpoint) {
      return res.status(404).json({
        success: false,
        error: "Checkpoint not found",
      });
    }

    // Mongoose 7 부터 하위 문서 remove() 가 없어 항상 500 이었다. deleteOne() 이 같은 일을 한다.
    checkpoint.deleteOne();

    await shipment.save();

    logger.info(
      `Checkpoint ${checkpointId} deleted from shipment ${trackingNumber}`,
    );

    res.status(200).json({
      success: true,
      data: stripPii(shipment),
      message: "Checkpoint deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting checkpoint:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete checkpoint",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};
