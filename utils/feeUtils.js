const Student = require("../models/Student");
const FeeStructure = require("../models/FeeStructure");
const FeeRecord = require("../models/FeeRecord");

const isValidMonth = (month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

const getMonthlyFee = async (classId, studentType) => {
  const structure = await FeeStructure.findOne({
    class: classId,
    studentType
  });

  if (!structure) {
    throw new Error(`Fee structure not found for ${studentType}`);
  }

  return structure.monthlyFee;
};

// Creates missing records for a selected month.
// Existing paid/unpaid records are never overwritten.
const ensureMonthlyFeeRecords = async (month) => {
  if (!isValidMonth(month)) {
    throw new Error("Month must be in YYYY-MM format");
  }

  const students = await Student.find().select("_id class studentType");
  const existing = await FeeRecord.find({ month }).select("student");

  const existingIds = new Set(existing.map((item) => item.student.toString()));
  const missing = students.filter(
    (student) => !existingIds.has(student._id.toString())
  );

  if (!missing.length) return;

  const structures = await FeeStructure.find();
  const feeMap = new Map(
    structures.map(
      (item) => [`${item.class.toString()}-${item.studentType}`, item.monthlyFee]
    )
  );

  const records = [];

  for (const student of missing) {
    const key = `${student.class.toString()}-${student.studentType}`;
    const amount = feeMap.get(key);

    if (amount === undefined) continue;

    records.push({
      student: student._id,
      class: student.class,
      studentType: student.studentType,
      month,
      amount,
      paymentStatus: "Unpaid"
    });
  }

  if (records.length) {
    await FeeRecord.insertMany(records, { ordered: false }).catch(() => {});
  }
};

module.exports = {
  isValidMonth,
  getMonthlyFee,
  ensureMonthlyFeeRecords
};
