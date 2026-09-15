const express = require("express");
const User = require("../models/User");
const { authMiddleware, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/me", authMiddleware, allowRoles("admin"), async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
});

module.exports = router;
