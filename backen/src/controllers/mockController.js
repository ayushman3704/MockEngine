const mongoose = require("mongoose");
const Endpoint = require("../models/Endpoint");
const Project = require("../models/Project");
const RequestLog = require("../models/RequestLog");
const { faker } = require("@faker-js/faker");

const getRequestIp = (req) => {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.ip || "unknown";
};

const recordRequestLog = async (
  req,
  { userId, projectId, endpointId, path, statusCode, startedAt }
) => {
  try {
    await RequestLog.create({
      userId,
      projectId,
      endpointId,
      method: req.method,
      path,
      statusCode,
      responseTime: Math.round(Date.now() - startedAt),
      ipAddress: getRequestIp(req)
    });
  } catch (error) {
    console.error("Request log error:", error);
  }
};

exports.generateMockData = async (req, res) => {
  const startedAt = Date.now();

  try {
    const { userId, projectId } = req.params;
    const rawPath = req.path.replace(/\/$/, "");
    const formattedPath = rawPath === "" ? "/" : rawPath;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const project = await Project.findOne({
      _id: projectId,
      userId
    }).lean();

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const endpoint = await Endpoint.findOne({
      projectId: project._id,
      userId,
      path: formattedPath
    }).lean();

    if (!endpoint) {
      return res.status(404).json({ success: false, message: "Endpoint schema not found" });
    }

    if (endpoint.config.forceError) {
      const errorCode = endpoint.config.errorCode || 500;

      await recordRequestLog(req, {
        userId,
        projectId: project._id,
        endpointId: endpoint._id,
        path: formattedPath,
        statusCode: errorCode,
        startedAt
      });

      return res.status(errorCode).json({
        success: false,
        error: `Mock error response with status ${errorCode}`
      });
    }

    if (endpoint.config.delay && endpoint.config.delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, endpoint.config.delay));
    }

    const generators = {
      uuid: () => faker.string.uuid(),
      fullName: () => faker.person.fullName(),
      email: () => faker.internet.email(),
      number: () => faker.number.int(),
      date: () => faker.date.recent().toISOString(),
      string: () => faker.lorem.word(),
      boolean: () => faker.datatype.boolean()
    };

    const MAX_ITEMS = 1000;
    const itemCount = Math.min(endpoint.config.itemCount || 10, MAX_ITEMS);
    const result = [];

    for (let i = 0; i < itemCount; i++) {
      const item = {};

      endpoint.fields.forEach((field) => {
        const generator = generators[field.dataType];
        item[field.fieldName] = generator ? generator() : null;
      });

      result.push(item);
    }

    await recordRequestLog(req, {
      userId,
      projectId: project._id,
      endpointId: endpoint._id,
      path: formattedPath,
      statusCode: 200,
      startedAt
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error("Mock generation error:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
};
