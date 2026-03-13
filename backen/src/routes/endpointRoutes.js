const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const endpointController = require("../controllers/endpointController");

const router = express.Router();

router.post("/:projectId/endpoints", authMiddleware.protect, endpointController.createEndpoint);
router.get("/:projectId/endpoints", authMiddleware.protect, endpointController.getProjectEndpoints);
router.put("/:endpointId", authMiddleware.protect, endpointController.updateEndpoint);
router.delete("/:endpointId", authMiddleware.protect, endpointController.deleteEndpoint);

module.exports = router;


