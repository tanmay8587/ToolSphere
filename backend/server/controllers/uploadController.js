import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// ================= UPLOAD IMAGE =================

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image selected",
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "ai-tools-directory",
        resource_type: "image",
        transformation: [
          {
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            success: false,
            message: "Cloudinary upload failed",
          });
        }

        return res.json({
          success: true,
          url: result.secure_url,
          publicId: result.public_id,
          secure_url: result.secure_url,
          public_id: result.public_id,
        });
      }
    );

    streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};

// ================= DELETE IMAGE =================

export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "publicId is required",
      });
    }

    await cloudinary.uploader.destroy(publicId);

    return res.json({
      success: true,
      message: "Image deleted successfully",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Delete failed",
    });
  }
};
