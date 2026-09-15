const mongoose = require("mongoose");

const feeStructureSchema = new mongoose.Schema(
  {
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true
    },
    studentType: {
      type: String,
      enum: ["Day Scholar", "Hostler"],
      required: true
    },
    monthlyFee: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { timestamps: true }
);

feeStructureSchema.index({ class: 1, studentType: 1 }, { unique: true });

module.exports = mongoose.model("FeeStructure", feeStructureSchema);
