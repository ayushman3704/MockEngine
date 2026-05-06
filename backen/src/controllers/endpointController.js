const mongoose = require("mongoose");
const Project = require("../models/Project");
const Endpoint = require("../models/Endpoint");
const RequestLog = require("../models/RequestLog");

const ALLOWED_DATA_TYPES = [
  "uuid",
  "email",
  "number",
  "fullName",
  "string",
  "date",
  "boolean"
];

const PATH_REGEX = /^\/[a-zA-Z0-9_\-\/]+$/;
const FIELD_NAME_REGEX = /^[a-zA-Z0-9_]+$/;
const MIN_ERROR_CODE = 400;
const MAX_ERROR_CODE = 599;

exports.createEndpoint = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { path, itemCount, delay, forceError, errorCode, fields } = req.body;
    const userId = req.user.id;

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: "Invalid projectId format" });
    }

    const project = await Project.findOne({
      _id: projectId,
      userId
    });

    if (!project) {
      return res.status(404).json({
        message: "Project not found or unauthorized"
      });
    }

    if (!path || typeof path !== "string") {
      return res.status(400).json({ message: "Path is required" });
    }

    const normalizedPath = path.startsWith("/") ? path.trim() : `/${path.trim()}`;

    if (!PATH_REGEX.test(normalizedPath)) {
      return res.status(400).json({
        message: "Path can only contain letters, numbers, hyphens, underscores, and slashes"
      });
    }

    const existingEndpoint = await Endpoint.findOne({
      projectId,
      path: normalizedPath
    });

    if (existingEndpoint) {
      return res.status(409).json({
        message: "Endpoint with this path already exists in this project"
      });
    }

    const parsedItemCount = Number(itemCount) || 10;

    if (parsedItemCount < 1 || parsedItemCount > 1000) {
      return res.status(400).json({
        message: "itemCount must be between 1 and 1000"
      });
    }

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        message: "Fields array is required and cannot be empty"
      });
    }

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

    const newEndpoint = await Endpoint.create({
      projectId,
      userId,
      path: normalizedPath,
      method,
      config: {
        itemCount: parsedItemCount,
        delay: Number(delay) || 0,
        forceError: Boolean(forceError),
        errorCode: parsedErrorCode
      },
      fields: validatedFields
    });

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
      .select("-__v")
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

exports.getEndpointAnalytics = async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid project ID format"
      });
    }

    const loggedInUserId = req.user.id;
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

    const [endpoints, aggregatedLogs, recentLogs] = await Promise.all([
      Endpoint.find({
        projectId,
        userId: loggedInUserId
      })
        .select("_id path method")
        .lean(),
      RequestLog.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(loggedInUserId),
            projectId: new mongoose.Types.ObjectId(projectId)
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$endpointId",
            hitCount: { $sum: 1 },
            avgResponseTime: { $avg: "$responseTime" },
            lastStatusCode: { $first: "$statusCode" },
            lastAccessedAt: { $first: "$createdAt" }
          }
        }
      ]),
      RequestLog.find({
        userId: loggedInUserId,
        projectId
      })
        .sort({ createdAt: -1 })
        .limit(12)
        .select("endpointId method path statusCode responseTime ipAddress createdAt")
        .lean()
    ]);

    const analyticsMap = new Map(
      aggregatedLogs.map((entry) => [
        String(entry._id),
        {
          hitCount: entry.hitCount,
          avgResponseTime: Math.round(entry.avgResponseTime || 0),
          lastStatusCode: entry.lastStatusCode || null,
          lastAccessedAt: entry.lastAccessedAt || null
        }
      ])
    );

    const endpointSummaries = endpoints.map((endpoint) => ({
      endpointId: String(endpoint._id),
      path: endpoint.path,
      method: endpoint.method,
      hitCount: analyticsMap.get(String(endpoint._id))?.hitCount || 0,
      avgResponseTime: analyticsMap.get(String(endpoint._id))?.avgResponseTime || 0,
      lastStatusCode: analyticsMap.get(String(endpoint._id))?.lastStatusCode || null,
      lastAccessedAt: analyticsMap.get(String(endpoint._id))?.lastAccessedAt || null
    }));

    return res.status(200).json({
      success: true,
      data: endpointSummaries,
      recentLogs: recentLogs.map((log) => ({
        id: String(log._id),
        endpointId: log.endpointId ? String(log.endpointId) : null,
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
        responseTime: log.responseTime,
        ipAddress: log.ipAddress,
        createdAt: log.createdAt
      }))
    });
  } catch (error) {
    console.error("Error fetching endpoint analytics:", error);

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

    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    if (!mongoose.Types.ObjectId.isValid(endpointId)) {
      return res.status(400).json({ success: false, message: "Invalid Endpoint ID format" });
    }

    const updateData = {};

    if (path !== undefined) {
      if (typeof path !== "string" || path.trim() === "") {
        return res.status(400).json({ success: false, message: "Path must be a valid string" });
      }

      const normalizedPath = path.startsWith("/") ? path.trim() : `/${path.trim()}`;

      if (!PATH_REGEX.test(normalizedPath)) {
        return res.status(400).json({
          success: false,
          message: "Path can only contain letters, numbers, hyphens, underscores, and slashes"
        });
      }

      updateData.path = normalizedPath;
    }

    if (fields !== undefined) {
      if (!Array.isArray(fields) || fields.length === 0) {
        return res.status(400).json({ success: false, message: "Fields array cannot be empty" });
      }

      if (fields.length > 50) {
        return res.status(400).json({ success: false, message: "Maximum 50 fields allowed" });
      }

      const validatedFields = fields.map((field) => {
        const cleanFieldName = field.fieldName?.trim();

        if (!cleanFieldName || !field.dataType) {
          throw new Error("Each field must have fieldName and dataType");
        }

        if (!FIELD_NAME_REGEX.test(cleanFieldName)) {
          throw new Error(
            `Invalid fieldName: '${cleanFieldName}'. Only letters, numbers, and underscores are allowed.`
          );
        }

        if (!ALLOWED_DATA_TYPES.includes(field.dataType)) {
          throw new Error(`Invalid dataType: ${field.dataType}`);
        }

        return {
          fieldName: cleanFieldName,
          dataType: field.dataType
        };
      });

      updateData.fields = validatedFields;
    }

    if (config !== undefined) {
      if (config.itemCount !== undefined) {
        const count = Number(config.itemCount);
        if (count < 1 || count > 1000) {
          return res.status(400).json({ success: false, message: "itemCount must be between 1 and 1000" });
        }
        updateData["config.itemCount"] = count;
      }

      if (config.delay !== undefined) {
        updateData["config.delay"] = Number(config.delay);
      }

      if (config.forceError !== undefined) {
        updateData["config.forceError"] = Boolean(config.forceError);
      }

      if (config.errorCode !== undefined) {
        const errorCode = Number(config.errorCode);
        if (errorCode < MIN_ERROR_CODE || errorCode > MAX_ERROR_CODE) {
          return res.status(400).json({ success: false, message: "errorCode must be between 400 and 599" });
        }
        updateData["config.errorCode"] = errorCode;
      }
    }

    const updatedEndpoint = await Endpoint.findOneAndUpdate(
      {
        _id: endpointId,
        userId: req.user.id
      },
      { $set: updateData },
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    if (!updatedEndpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found or you are not authorized to update it"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Endpoint updated successfully",
      data: updatedEndpoint
    });
  } catch (error) {
    console.error("Update Endpoint Error:", error);

    if (error.message?.includes("fieldName") || error.message?.includes("dataType")) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: "Server error while updating endpoint"
    });
  }
};

exports.deleteEndpoint = async (req, res) => {
  try {
    const { endpointId } = req.params;

    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(endpointId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Endpoint ID format"
      });
    }

    const deletedEndpoint = await Endpoint.findOneAndDelete({
      _id: endpointId,
      userId: req.user.id
    });

    if (!deletedEndpoint) {
      return res.status(404).json({
        success: false,
        message: "Endpoint not found or you are not authorized to delete it"
      });
    }

    await RequestLog.deleteMany({ endpointId: deletedEndpoint._id });

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
