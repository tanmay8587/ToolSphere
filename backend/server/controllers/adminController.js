import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import Tool from "../models/Tool.js";
import User from "../models/User.js";
import Category from "../models/Category.js";

/* ==========================================
   ADMIN LOGIN
========================================== */

export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required"
      });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password"
      });
    }

    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Invalid Email or Password"
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    res.json({
      success: true,
      message: "Login Successful",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Login failed",
    });
  }
};

/* ==========================================
   ADMIN PROFILE
========================================== */

export const getProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
      .select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    res.json({
      success: true,
      admin
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

/* ==========================================
   UPDATE ADMIN PROFILE
========================================== */

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required"
        });
      }
      updateData.name = name.trim();
    }

    if (email !== undefined) {
      if (!email.trim()) {
        return res.status(400).json({
          success: false,
          message: "Email is required"
        });
      }
      // Check email uniqueness
      const existing = await Admin.findOne({
        email: email.toLowerCase(),
        _id: { $ne: req.admin.id }
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        });
      }
      updateData.email = email.toLowerCase().trim();
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update"
      });
    }

    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

/* ==========================================
   CHANGE ADMIN PASSWORD
========================================== */

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required"
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match"
      });
    }

    // Password validation: minimum 8 characters, uppercase, lowercase, number, and special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)"
      });
    }

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    const validPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

/* ==========================================
   ADMIN SEARCH
========================================== */

export const adminSearch = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.json({ success: true, results: { tools: [], categories: [], users: [] } });
    }

    const search = q.trim();
    const regex = new RegExp(search, "i");

    // Search tools
    const tools = await Tool.find({
      isDeleted: false,
      $or: [
        { name: regex },
        { description: regex },
        { category: regex },
        { tags: { $in: [regex] } }
      ]
    })
      .select("name category slug logo status")
      .limit(10)
      .lean();

    // Search categories
    const categories = await Category.find({
      name: regex
    })
      .select("name icon description")
      .limit(10)
      .lean();

    // Search users
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex }
      ]
    })
      .select("name email")
      .limit(10)
      .lean();

    res.json({
      success: true,
      results: {
        tools,
        categories,
        users
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Search failed"
    });
  }
};

/* ==========================================
   DASHBOARD
========================================== */

export const getDashboard = async (req, res) => {
  try {
    const totalTools = await Tool.countDocuments({
      isDeleted: false
    });

    const activeTools = await Tool.countDocuments({
      status: "active",
      isDeleted: false
    });

    const pendingTools = await Tool.countDocuments({
      status: "pending",
      isDeleted: false
    });

    const featuredTools = await Tool.countDocuments({
      featured: true,
      isDeleted: false
    });

    const totalCategories =
      (await Tool.distinct("category", {
        isDeleted: false
      })).length;

    const totalUsers = await User.countDocuments({});

    res.json({
      success: true,
      stats: {
        totalTools,
        activeTools,
        pendingTools,
        featuredTools,
        totalCategories,
        totalUsers
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard",
    });
  }
};