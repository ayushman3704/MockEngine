// models/RequestLog.js
const mongoose = require("mongoose");

const requestLogSchema = new mongoose.Schema(
  {
    endpointId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Endpoint"
    },
    statusCode: Number,
    responseTime: Number,
    ipAddress: String
  },
  { timestamps: true }
);

module.exports = mongoose.model("RequestLog", requestLogSchema);