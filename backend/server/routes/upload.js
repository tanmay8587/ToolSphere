import express from "express";
import upload from "../middleware/upload.js";
import { uploadImage, deleteImage } from "../controllers/uploadController.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

// Upload a single image (used for cover images, gallery, logos, icons, etc.)
router.post("/", verifyAdmin, upload.single("image"), uploadImage);

// Delete an image from Cloudinary by its public_id
router.delete("/", verifyAdmin, deleteImage);

export default router;