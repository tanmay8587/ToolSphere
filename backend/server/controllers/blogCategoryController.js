import BlogCategory from "../models/BlogCategory.js";
import Blog from "../models/Blog.js";

/* ===========================
   GET ALL CATEGORIES
   =========================== */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await BlogCategory.find({}).sort({ name: 1 });
    res.json({ success: true, categories });
  } catch (err) {
    console.error("Get categories error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch categories" });
  }
};

/* ===========================
   GET SINGLE CATEGORY
   =========================== */
export const getCategoryById = async (req, res) => {
  try {
    const category = await BlogCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, category });
  } catch (err) {
    console.error("Get category error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch category" });
  }
};

/* ===========================
   CREATE CATEGORY
   =========================== */
export const createCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Check for duplicate category name
    const existingCategory = await BlogCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    // Create category
    const category = new BlogCategory({
      name: name.trim(),
      description: description?.trim() || "",
      color: color?.trim() || "#3B82F6",
    });

    await category.save();
    res.status(201).json({ success: true, category });
  } catch (err) {
    console.error("Create category error:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name or slug already exists",
      });
    }
    res.status(500).json({ success: false, message: "Failed to create category" });
  }
};

/* ===========================
   UPDATE CATEGORY
   =========================== */
export const updateCategory = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const categoryId = req.params.id;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    // Check for duplicate category name (excluding current category)
    const existingCategory = await BlogCategory.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      _id: { $ne: categoryId },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = await BlogCategory.findByIdAndUpdate(
      categoryId,
      {
        name: name.trim(),
        description: description?.trim() || "",
        color: color?.trim() || "#3B82F6",
      },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, category });
  } catch (err) {
    console.error("Update category error:", err);
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Category with this name or slug already exists",
      });
    }
    res.status(500).json({ success: false, message: "Failed to update category" });
  }
};

/* ===========================
   DELETE CATEGORY
   =========================== */
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    // Check if category is being used by any blogs
    const blogsUsingCategory = await Blog.countDocuments({ category: categoryId });
    
    if (blogsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It is being used by ${blogsUsingCategory} blog(s).`,
      });
    }

    const category = await BlogCategory.findByIdAndDelete(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.json({ success: true, message: "Category deleted successfully" });
  } catch (err) {
    console.error("Delete category error:", err);
    res.status(500).json({ success: false, message: "Failed to delete category" });
  }
};