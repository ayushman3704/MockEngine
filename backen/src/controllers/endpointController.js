// controllers/endpointController.js

const mongoose = require("mongoose");
const Project = require("../models/Project");
const Endpoint = require("../models/Endpoint");

const ALLOWED_DATA_TYPES = [
  "uuid",
  "email",
  "number",
  "fullName",
  "string",
  "date",
  "boolean"
];

// Security: Regular expressions for strict validation
const PATH_REGEX = /^\/[a-zA-Z0-9_\-\/]+$/; 
const FIELD_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_ERROR_CODE = 400;
const MAX_ERROR_CODE = 599;

exports.createEndpoint = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, itemCount, delay, forceError, errorCode, fields } = req.body;
    const userId = req.user.id; // coming from auth middleware

    // -----------------------------
    // 1️⃣ Validate projectId format
    // -----------------------------
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId format" });
    }

    // -----------------------------
    // 2️⃣ Check project exists & belongs to user
    // -----------------------------
    const project = await Project.findOne({
      _id: projectId,
      userId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or unauthorized"
      });
    }

    // -----------------------------
    // 3️⃣ Validate required fields & Path format
    // -----------------------------
    if (!path || typeof path !== "string") {
      return res.status(400).json({ message: "Path is required" });
    }

    // Normalize path (always start with /)
    const normalizedPath = path.startsWith("/")
      ? path.trim()
      : `/${path.trim()}`;

    // Ensure path only contains URL-safe characters
    if (!PATH_REGEX.test(normalizedPath)) {
      return res.status(400).json({ 
        message: "Path can only contain letters, numbers, hyphens, underscores, and slashes" 
      });
    }

    // -----------------------------
    // 4️⃣ Prevent duplicate endpoint path inside project
    // -----------------------------
    const existingEndpoint = await Endpoint.findOne({
      projectId,
      path: normalizedPath
    });

    if (existingEndpoint) {
      return res.status(409).json({
        message: "Endpoint with this path already exists in this project"
      });
    }

    // -----------------------------
    // 5️⃣ Validate itemCount
    // -----------------------------
    const parsedItemCount = Number(itemCount) || 10;

    if (parsedItemCount < 1 || parsedItemCount > 1000) {
      return res.status(400).json({
        message: "itemCount must be between 1 and 1000"
      });
    }

    // -----------------------------
    // 6️⃣ Validate fields array & structure
    // -----------------------------
    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        message: "Fields array is required and cannot be empty"
      });
    }

    // Cap the number of fields to protect server memory
    if (fields.length > 50) {
      return res.status(400).json({
        message: "Maximum 50 fields allowed per endpoint"
      });
    }

    const validatedFields = [];

    for (const field of fields) {
      if (!field.fieldName || !field.dataType) {
        return res.status(400).json({
          message: "Each field must have fieldName and dataType"
        });
      }

      const cleanFieldName = field.fieldName.trim();

      // Ensure JSON keys are valid and safe
      if (!FIELD_NAME_REGEX.test(cleanFieldName)) {
        return res.status(400).json({
          message: `Invalid fieldName: '${cleanFieldName}'. Only letters, numbers, and underscores are allowed.`
        });
      }

      if (!ALLOWED_DATA_TYPES.includes(field.dataType)) {
        return res.status(400).json({
          message: `Invalid dataType: ${field.dataType}`
        });
      }

      validatedFields.push({
        fieldName: cleanFieldName,
        dataType: field.dataType
      });
    }

    const parsedErrorCode = Number(errorCode) || 500;

    if (parsedErrorCode < MIN_ERROR_CODE || parsedErrorCode > MAX_ERROR_CODE) {
      return res.status(400).json({
        message: "errorCode must be between 400 and 599"
      });
    }

    // -----------------------------
    // 7️⃣ Create endpoint
    // -----------------------------
    const newEndpoint = await Endpoint.create({
      projectId,
      userId,
      path: normalizedPath,
      config: {
        itemCount: parsedItemCount,
        delay: Number(delay) || 0,
        forceError: Boolean(forceError),
        errorCode: parsedErrorCode
      },
      fields: validatedFields
    });

    // -----------------------------
    // 8️⃣ Return response
    // -----------------------------
    return res.status(201).json({
      message: "Endpoint created successfully",
      endpoint: newEndpoint
    });

  } catch (error) {
    console.error("Create Endpoint Error:", error);
    return res.status(500).json({
      message: "Internal Server Error"
    });
  }
};


exports.getProjectEndpoints = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    const loggedInUserId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID format"
      });
    }

    const project = await Project.findOne({
      _id: projectId,
      userId: loggedInUserId
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found or unauthorized access"
      });
    }

    const endpoints = await Endpoint.find({
      projectId,
      userId: loggedInUserId
    })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: endpoints.length,
      data: endpoints
    });

  } catch (error) {
    console.error("Error fetching endpoints:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};



exports.updateEndpoint = async (req, res) => {
  try {
    const { endpointId } = req.params;
    const { path, fields, config } = req.body;

    // 1️⃣ Auth Check
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    // 2️⃣ ObjectId Validation
    if (!mongoose.Types.ObjectId.isValid(endpointId)) {
      return res.status(400).json({ success: false, message: "Invalid Endpoint ID format" });
    }

    // 3️⃣ Build update object safely (Preventing Data Wipeouts)
    const updateData = {};

    // --- PATH VALIDATION ---
    if (path !== undefined) {
      if (typeof path !== "string" || path.trim() === "") {
        return res.status(400).json({ success: false, message: "Path must be a valid string" });
      }
      updateData.path = path.startsWith("/") ? path.trim() : `/${path.trim()}`;
    }

    // --- FIELDS VALIDATION ---
    if (fields !== undefined) {
      if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ success: false, message: "Fields array cannot be empty" });
      }
      if (fields.length > 50) {
        return res.status(400).json({ success: false, message: "Maximum 50 fields allowed" });
      }
      updateData.fields = fields; 
    }

    // --- CONFIG VALIDATION & DOT-NOTATION UPDATE ---
    // Instead of replacing the whole object, we update exact keys
    if (config !== undefined) {
      if (config.itemCount !== undefined) {
        const count = Number(config.itemCount);
        if (count < 1 || count > 1000) {
          return res.status(400).json({ success: false, message: "itemCount must be between 1 and 1000" });
        }
        updateData['config.itemCount'] = count;
      }

      if (config.delay !== undefined) {
        updateData['config.delay'] = Number(config.delay);
      }

      if (config.forceError !== undefined) {
        updateData['config.forceError'] = Boolean(config.forceError);
      }

      if (config.errorCode !== undefined) {
        const errorCode = Number(config.errorCode);
        if (errorCode < MIN_ERROR_CODE || errorCode > MAX_ERROR_CODE) {
          return res.status(400).json({ success: false, message: "errorCode must be between 400 and 599" });
        }
        updateData['config.errorCode'] = errorCode;
      }
    }

    // 4️⃣ Update endpoint with ownership verification
    const updatedEndpoint = await Endpoint.findOneAndUpdate(
      {
        _id: endpointId,
        userId: req.user.id
      },
      { $set: updateData }, // Explicity using $set is a good practice
      {
        new: true,
        runValidators: true
      }
    );

    // 5️⃣ Check result
    if (!updatedEndpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found or you are not authorized to update it"
      });
    }

    // 6️⃣ Success response
    return res.status(200).json({
      success: true,
      message: "Endpoint updated successfully",
      data: updatedEndpoint
    });

  } catch (error) {
    console.error("Update Endpoint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while updating endpoint"
    });
  }
};



exports.deleteEndpoint = async (req, res) => {
  try {
    const { endpointId } = req.params;

    // 1️⃣ Guard Clause: Authentication Check
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    // 2️⃣ Format Validation: Prevent MongoDB CastErrors
    if (!mongoose.Types.ObjectId.isValid(endpointId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Endpoint ID format"
      });
    }

    // 3️⃣ Atomic Database Operation: Find, Verify Ownership, and Delete
    const deletedEndpoint = await Endpoint.findOneAndDelete({
      _id: endpointId,
      userId: req.user.id
    });

    // 4️⃣ Result Check: Did the document exist and belong to the user?
    if (!deletedEndpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found or you are not authorized to delete it"
      });
    }

    // 5️⃣ Success Response
    return res.status(200).json({
      success: true,
      message: "Endpoint deleted successfully",
      data: {
        id: deletedEndpoint._id
      }
    });

  } catch (error) {
    console.error("Delete Endpoint Error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while deleting endpoint"
    });
  }
};
