const express = require("express");
const Class = require("../models/Class");
const { authMiddleware, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/", allowRoles("admin", "finance"), async (req, res) => {
  try {
    const classes = await Class.find().sort({ classNumber: 1 });

    res.json({
      success: true,
      data: classes
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
