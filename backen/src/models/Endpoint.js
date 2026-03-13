const mongoose = require("mongoose");

const fieldSchema = new mongoose.Schema({
  fieldName: {
    type: String,
    required: true,
    trim: true // Added trim
  },
  dataType: {
    type: String,
    required: true,
    enum: ["uuid", "email", "number", "fullName", "string", "date", "boolean"]
  }
});

const endpointSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    path: {
      type: String,
      required: true,
      trim: true // Ensures clean URLs like "/users"
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Restricts to valid HTTP methods
      default: 'GET'
    },
    config: {
      itemCount: {
        type: Number,
        default: 10
      },
      delay: {
        type: Number,
        default: 0
      },
      forceError: {
        type: Boolean,
        default: false
      },
      errorCode: {
        type: Number, // Allows testing specific errors like 403 or 502
        default: 500
      }
    },
    fields: [fieldSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Endpoint", endpointSchema);