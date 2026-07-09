import axios from "axios";
import { getAdminToken } from "../utils/auth";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/upload`
  : "http://localhost:5000/api/upload";

export const uploadFile = async (file, onProgress) => {
  const formData = new FormData();
  formData.append("image", file);

  const token = getAdminToken();

  try {
    const { data } = await axios.post(API_URL, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token && { Authorization: `Bearer ${token}` }),
      },

      onUploadProgress: (progressEvent) => {
        if (!progressEvent.total) return;

        const percent = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );

        if (onProgress) onProgress(percent);
      },
    });

    // SAFE RESPONSE HANDLING
    return data.url || data.image || data.secure_url;

  } catch (error) {
    throw new Error(
      error.response?.data?.message || "Image upload failed."
    );
  }
};
