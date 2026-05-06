const Project = require("../models/Project");
const Endpoint = require("../models/Endpoint");
const RequestLog = require("../models/RequestLog");
const mongoose = require("mongoose");

exports.createProject = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Project name is required" });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const existingProject = await Project.findOne({ userId, slug });
    if (existingProject) {
      return res.status(409).json({
        message: "You already have a project with a similar name"
      });
    }

    const newProject = await Project.create({
      name: name.trim(),
      slug,
      userId
    });

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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. User session is invalid or missing."
      });
    }

    const loggedInUserId = req.user.id;

    const projects = await Project.find({ userId: loggedInUserId })
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error("Error fetching projects:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ success: false, message: "Invalid Project ID format" });
    }

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

    await Endpoint.deleteMany({ projectId });
    await RequestLog.deleteMany({ projectId });
    await Project.findByIdAndDelete(projectId);

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
