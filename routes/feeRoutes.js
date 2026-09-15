const express = require("express");
const mongoose = require("mongoose");
const FeeRecord = require("../models/FeeRecord");
const FeeStructure = require("../models/FeeStructure");
const { authMiddleware, allowRoles } = require("../middleware/authMiddleware");
const {
  isValidMonth,
  ensureMonthlyFeeRecords
} = require("../utils/feeUtils");

const router = express.Router();

router.use(authMiddleware, allowRoles("admin", "finance"));

router.get("/structures", async (req, res) => {
  try {
    const structures = await FeeStructure.find()
      .populate("class", "name classNumber")
      .sort({ "class.classNumber": 1 });

    res.json({ success: true, data: structures });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

// router.get("/", async (req, res) => {
//   try {
//     const {
//       month = new Date().toISOString().slice(0, 7),
//       classId = "",
//       status: rawStatus = "All",
//       search = ""
//     } = req.query;

//     const status = rawStatus || "All";

//     if (!isValidMonth(month)) {
//       return res.status(400).json({
//         success: false,
//         message: "Month must be in YYYY-MM format"
//       });
//     }

//     await ensureMonthlyFeeRecords(month);

//     const filter = { month };

//     if (classId) {
//       if (!mongoose.isValidObjectId(classId)) {
//         return res.status(400).json({
//           success: false,
//           message: "Invalid class filter"
//         });
//       }
//       filter.class = classId;
//     }

//     if (status !== "All") {
//       if (!["Paid", "Unpaid"].includes(status)) {
//         return res.status(400).json({
//           success: false,
//           message: "Status must be All, Paid or Unpaid"
//         });
//       }
//       filter.paymentStatus = status;
//     }

//     let records = await FeeRecord.find(filter)
//       .populate("student", "name studentId parentName contactNumber")
//       .populate("class", "name classNumber")
//       .populate("recordedBy", "name email")
//       .sort({ "class.classNumber": 1 });

//     if (search.trim()) {
//       const term = search.trim().toLowerCase();
//       records = records.filter(
//         (record) =>
//           record.student &&
//           (record.student.name.toLowerCase().includes(term) ||
//             record.student.studentId.toLowerCase().includes(term))
//       );
//     }

//     res.json({
//       success: true,
//       month,
//       count: records.length,
//       data: records
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// });
// routes/feeRoutes.js
router.get("/", async (req, res) => {
  try {
    const {
      month = new Date().toISOString().slice(0, 7),
      classId = "",
      status: rawStatus = "All",
      search = ""
    } = req.query;

    const status = rawStatus || "All";

    if (!isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message: "Month must be in YYYY-MM format"
      });
    }

    // Selected month ke liye missing fee records automatically create karega
    await ensureMonthlyFeeRecords(month);

    const filter = { month };

    // Class filter
    if (classId) {
      if (!mongoose.isValidObjectId(classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class filter"
        });
      }

      filter.class = classId;
    }

    // Payment status filter
    if (status !== "All") {
      if (!["Paid", "Unpaid"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Status must be All, Paid or Unpaid"
        });
      }

      filter.paymentStatus = status;
    }

    let records = await FeeRecord.find(filter)
      .populate("student", "name studentId parentName contactNumber")
      .populate("class", "name classNumber")
      .populate("recordedBy", "name email")
      .sort({ class: 1, "student.name": 1 });

    // Student name / ID search
    if (search.trim()) {
      const term = search.trim().toLowerCase();

      records = records.filter(
        (record) =>
          record.student &&
          (
            record.student.name.toLowerCase().includes(term) ||
            record.student.studentId.toLowerCase().includes(term)
          )
      );
    }

    res.json({
      success: true,
      month,
      count: records.length,
      data: records
    });

  } catch (error) {
    console.error("GET FEES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.patch("/:id/pay", allowRoles("finance"), async (req, res) => {
  try {
    const record = await FeeRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found"
      });
    }

    record.paymentStatus = "Paid";
    record.paymentDate = req.body.paymentDate
      ? new Date(req.body.paymentDate)
      : new Date();
    record.recordedBy = req.user._id;

    await record.save();

    const updated = await FeeRecord.findById(record._id)
      .populate("student", "name studentId")
      .populate("class", "name classNumber")
      .populate("recordedBy", "name email");

    res.json({
      success: true,
      message: "Fee marked as paid",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.patch("/:id", allowRoles("finance"), async (req, res) => {
  try {
    const { paymentStatus, paymentDate } = req.body;

    if (!["Paid", "Unpaid"].includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Payment status must be Paid or Unpaid"
      });
    }

    const record = await FeeRecord.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Fee record not found"
      });
    }

    record.paymentStatus = paymentStatus;
    record.paymentDate =
      paymentStatus === "Paid"
        ? paymentDate
          ? new Date(paymentDate)
          : record.paymentDate || new Date()
        : null;
    record.recordedBy = req.user._id;

    await record.save();

    const updated = await FeeRecord.findById(record._id)
      .populate("student", "name studentId")
      .populate("class", "name classNumber")
      .populate("recordedBy", "name email");

    res.json({
      success: true,
      message: "Fee record updated successfully",
      data: updated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

module.exports = router;
