const mongoose = require("mongoose");

const requestLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Endpoint",
      required: true
    },
    method: {
      type: String,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      required: true
    },
    responseTime: {
      type: Number,
      required: true
    },
    ipAddress: {
      type: String,
      default: "unknown"
    }
  },
  { timestamps: true }
);

requestLogSchema.index({ endpointId: 1, createdAt: -1 });
requestLogSchema.index({ projectId: 1, createdAt: -1 });
requestLogSchema.index({ userId: 1, projectId: 1, createdAt: -1 });

module.exports = mongoose.model("RequestLog", requestLogSchema);
