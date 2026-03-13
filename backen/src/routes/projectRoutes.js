const express = require("express");
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");


const router = express.Router();

router.post("/", authMiddleware.protect, projectController.createProject);
router.get("/", authMiddleware.protect, projectController.getAllProjects);
router.delete('/:projectId', authMiddleware.protect, projectController.deleteProject);

module.exports = router;
