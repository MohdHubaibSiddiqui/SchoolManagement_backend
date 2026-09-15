const express = require("express");
const mongoose = require("mongoose");
const Student = require("../models/Student");
const Class = require("../models/Class");
const { authMiddleware, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

const validateStudentPayload = async (body) => {
  const {
    name,
    studentId,
    parentName,
    contactNumber,
    class: classId,
    studentType
  } = body;

  if (
    !name ||
    !studentId ||
    !parentName ||
    !contactNumber ||
    !classId ||
    !studentType
  ) {
    return "All student fields are required";
  }

  if (!["Day Scholar", "Hostler"].includes(studentType)) {
    return "Student type must be Day Scholar or Hostler";
  }

  if (!mongoose.isValidObjectId(classId)) {
    return "Invalid class";
  }

  const classExists = await Class.findById(classId);
  if (!classExists) return "Class not found";

  return null;
};

router.post("/", allowRoles("admin"), async (req, res) => {
  try {
    const validationError = await validateStudentPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const student = await Student.create(req.body);

    const populated = await Student.findById(student._id).populate(
      "class",
      "name classNumber"
    );

    res.status(201).json({
      success: true,
      message: "Student added successfully",
      data: populated
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === 11000
          ? "Student ID already exists"
          : "Server error",
      error: error.message
    });
  }
});

router.get("/", allowRoles("admin", "finance"), async (req, res) => {
  try {
    const { search = "", classId = "" } = req.query;

    const filter = {};

    if (search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: "i" } },
        { studentId: { $regex: search.trim(), $options: "i" } }
      ];
    }

    if (classId) {
      if (!mongoose.isValidObjectId(classId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid class filter"
        });
      }
      filter.class = classId;
    }

    const students = await Student.find(filter)
      .populate("class", "name classNumber")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.get("/:id", allowRoles("admin", "finance"), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "class",
      "name classNumber"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.put("/:id", allowRoles("admin"), async (req, res) => {
  try {
    const validationError = await validateStudentPayload(req.body);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        studentId: req.body.studentId,
        parentName: req.body.parentName,
        contactNumber: req.body.contactNumber,
        class: req.body.class,
        studentType: req.body.studentType
      },
      { new: true, runValidators: true }
    ).populate("class", "name classNumber");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,
      message: "Student updated successfully",
      data: student
    });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    res.status(status).json({
      success: false,
      message:
        error.code === 11000
          ? "Student ID already exists"
          : "Server error",
      error: error.message
    });
  }
});

router.delete("/:id", allowRoles("admin"), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    // Remove fee records belonging to the deleted student.
    const FeeRecord = require("../models/FeeRecord");
    await FeeRecord.deleteMany({ student: student._id });

    res.json({
      success: true,
      message: "Student and related fee records deleted successfully"
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
