const express = require("express");
const Student = require("../models/Student");
const Class = require("../models/Class");
const FeeRecord = require("../models/FeeRecord");
const { authMiddleware, allowRoles } = require("../middleware/authMiddleware");
const { isValidMonth, ensureMonthlyFeeRecords } = require("../utils/feeUtils");

const router = express.Router();

router.get("/monthly", authMiddleware, allowRoles("admin", "finance"), async (req, res) => {
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

    const [students, classes, records] = await Promise.all([
      Student.find().select("_id class"),
      Class.find().sort({ classNumber: 1 }),
      FeeRecord.find({ month })
    ]);

    const totalStudents = students.length;
    const expectedFees = records.reduce((sum, r) => sum + r.amount, 0);
    const collectedFees = records
      .filter((r) => r.paymentStatus === "Paid")
      .reduce((sum, r) => sum + r.amount, 0);

    const classWise = classes.map((classItem) => {
      const classRecords = records.filter(
        (record) => record.class.toString() === classItem._id.toString()
      );

      const expected = classRecords.reduce((sum, r) => sum + r.amount, 0);
      const collected = classRecords
        .filter((r) => r.paymentStatus === "Paid")
        .reduce((sum, r) => sum + r.amount, 0);

      return {
        classId: classItem._id,
        className: classItem.name,
        classNumber: classItem.classNumber,
        totalStudents: classRecords.length,
        paidStudents: classRecords.filter(
          (r) => r.paymentStatus === "Paid"
        ).length,
        unpaidStudents: classRecords.filter(
          (r) => r.paymentStatus === "Unpaid"
        ).length,
        expectedFees: expected,
        collectedFees: collected,
        pendingFees: expected - collected
      };
    });

    res.json({
      success: true,
      data: {
        month,
        totalStudents,
        expectedFees,
        collectedFees,
        pendingFees: expectedFees - collectedFees,
        paidStudents: records.filter((r) => r.paymentStatus === "Paid").length,
        unpaidStudents: records.filter((r) => r.paymentStatus === "Unpaid").length,
        classWise
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
