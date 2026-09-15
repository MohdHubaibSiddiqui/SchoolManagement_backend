const express = require("express");
const Student = require("../models/Student");
const Class = require("../models/Class");
const User = require("../models/User");
const FeeRecord = require("../models/FeeRecord");
const { authMiddleware, allowRoles } = require("../middleware/authMiddleware");
const { isValidMonth, ensureMonthlyFeeRecords } = require("../utils/feeUtils");

const router = express.Router();

router.get("/", authMiddleware, allowRoles("admin", "finance"), async (req, res) => {
  try {
    const month =
      req.query.month || new Date().toISOString().slice(0, 7);

    if (!isValidMonth(month)) {
      return res.status(400).json({
        success: false,
        message: "Month must be in YYYY-MM format"
      });
    }

    await ensureMonthlyFeeRecords(month);

    const [totalStudents, totalClasses, financeUsers, feeRecords] =
      await Promise.all([
        Student.countDocuments(),
        Class.countDocuments(),
        User.countDocuments({ role: "finance", status: "active" }),
        FeeRecord.find({ month })
      ]);

    const expectedFees = feeRecords.reduce((sum, item) => sum + item.amount, 0);
    const collectedFees = feeRecords
      .filter((item) => item.paymentStatus === "Paid")
      .reduce((sum, item) => sum + item.amount, 0);
    const pendingFees = expectedFees - collectedFees;
    const paidStudents = feeRecords.filter(
      (item) => item.paymentStatus === "Paid"
    ).length;
    const unpaidStudents = feeRecords.filter(
      (item) => item.paymentStatus === "Unpaid"
    ).length;

    res.json({
      success: true,
      month,
      data: {
        totalStudents,
        totalClasses,
        financeUsers,
        expectedFees,
        collectedFees,
        pendingFees,
        paidStudents,
        unpaidStudents
      }
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
