// controllers/projectController.js

const Project = require("../models/Project");
const Endpoint = require('../models/Endpoint'); // ⚠️ Yeh zaroori hai cascade delete ke liye
const mongoose = require('mongoose');

exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id; // From authMiddleware

    // 1️⃣ Validate input
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Project name is required" });
    }

    // 2️⃣ Generate a URL-friendly slug (e.g., "My API" -> "my-api")
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-") // Replace spaces & special chars with hyphens
      .replace(/(^-|-$)+/g, "");   // Remove leading/trailing hyphens

    // 3️⃣ Prevent duplicate project names for the same user
    const existingProject = await Project.findOne({ userId, slug });
    if (existingProject) {
      return res.status(409).json({ 
        message: "You already have a project with a similar name" 
      });
    }

    // 4️⃣ Save to Database
    const newProject = await Project.create({
      name: name.trim(),
      slug,
      userId
    });

    // 5️⃣ Send response
    return res.status(201).json({
      message: "Project created successfully",
      project: newProject
    });

  } catch (error) {
    console.error("Create Project Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};



exports.getAllProjects = async (req, res) => {
  try {
    // 1️⃣ Security Check: Ensure user is authenticated and req.user exists
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. User session is invalid or missing."
      });
    }

    const loggedInUserId = req.user.id;

    // 2️⃣ Database Query: Fetch all projects for this specific user
    const projects = await Project.find({ userId: loggedInUserId })
      .select('-__v')          // Remove the Mongoose internal version key
      .sort({ createdAt: -1 }) // Sort in descending order (newest projects first)
      .lean();                 // Convert heavy Mongoose documents into lightweight plain JS objects

    // 3️⃣ Return Success Response
    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });

  } catch (error) {
    console.error("Error fetching projects:", error);
    
    // 4️⃣ Return Error Response
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};



// ... aapke purane functions (createProject, getProjects) ...

// 🗑️ Delete Project Logic
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    // 1️⃣ Guard Clause: Auth & Format Validation
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized access" });
    }
    
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid Project ID format" });
    }

    // 2️⃣ Verify Ownership & Existence (Atomic Find)
    // Hum findOneAndDelete direct nahi kar rahe kyunki humein pehle endpoints bhi delete karne hain
    const project = await Project.findOne({ 
      _id: projectId, 
      userId: req.user.id 
    });

    if (!project) {
      return res.status(404).json({ 
        success: false, 
        message: "Project not found or you are not authorized to delete it" 
      });
    }

    // 3️⃣ CASCADING DELETE: Is project ke saare Endpoints uda do
    // 'deleteMany' ek highly optimized MongoDB operation hai jo ek sath multiple documents delete karta hai
    await Endpoint.deleteMany({ projectId: projectId });

    // 4️⃣ Delete the actual Project
    await Project.findByIdAndDelete(projectId);

    // 5️⃣ Success Response
    return res.status(200).json({
      success: true,
      message: "Project and all its associated endpoints deleted successfully",
      data: {
        id: projectId
      }
    });

  } catch (error) {
    console.error("Delete Project Error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error while deleting project" 
    });
  }
};