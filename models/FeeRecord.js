const mongoose = require("mongoose");

const feeRecordSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true
    },
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
    month: {
      type: String,
      required: true,
      match: /^\d{4}-(0[1-9]|1[0-2])$/
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Unpaid"],
      default: "Unpaid"
    },
    paymentDate: {
      type: Date,
      default: null
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  { timestamps: true }
);

feeRecordSchema.index({ student: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("FeeRecord", feeRecordSchema);
