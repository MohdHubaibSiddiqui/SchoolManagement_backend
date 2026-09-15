const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    classNumber: {
      type: Number,
      required: true,
      unique: true,
      min: 1,
      max: 10
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Class", classSchema);
