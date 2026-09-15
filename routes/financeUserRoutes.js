const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { authMiddleware, allowRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware, allowRoles("admin"));

router.post("/", async (req, res) => {
  try {
    const { name, email, password, phone, status = "active" } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required"
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      phone,
      role: "finance",
      status
    });

    res.status(201).json({
      success: true,
      message: "Finance user created successfully",
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
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

router.get("/", async (req, res) => {
  try {
    const users = await User.find({ role: "finance" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, email, password, phone, status } = req.body;
    const update = { name, email, phone, status };

    if (password) {
      update.password = await bcrypt.hash(password, 10);
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "finance" },
      update,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Finance user not found"
      });
    }

    res.json({
      success: true,
      message: "Finance user updated successfully",
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be active or inactive"
      });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.params.id, role: "finance" },
      { status },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Finance user not found"
      });
    }

    res.json({
      success: true,
      message: `Finance user ${status} successfully`,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id: req.params.id,
      role: "finance"
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Finance user not found"
      });
    }

    res.json({
      success: true,
      message: "Finance user removed successfully"
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
