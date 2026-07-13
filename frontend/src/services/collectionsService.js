import { getToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Creates a new collection for the logged-in user.
 * @param {string} name - The collection name.
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const createCollection = async (name) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/collections`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating collection:", error);
    return { success: false, message: error.message || "Failed to create collection." };
  }
};

/**
 * Fetches all collections of the logged-in user (tool data populated).
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getCollections = async () => {
  try {
    const token = getToken();
    if (!token) return { success: false, data: [] };

    const response = await fetch(`${API_BASE_URL}/collections`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching collections:", error);
    return { success: false, data: [] };
  }
};

/**
 * Adds a tool to a collection.
 * @param {string} collectionId
 * @param {string} toolId
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const addToolToCollection = async (collectionId, toolId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/tools`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ toolId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error adding tool to collection:", error);
    return { success: false, message: error.message || "Failed to add tool to collection." };
  }
};

/**
 * Renames a collection.
 * @param {string} collectionId
 * @param {string} name
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const renameCollection = async (collectionId, name) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error renaming collection:", error);
    return { success: false, message: error.message || "Failed to rename collection." };
  }
};

/**
 * Removes a tool from a collection.
 * @param {string} collectionId
 * @param {string} toolId
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const removeToolFromCollection = async (collectionId, toolId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}/tools`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ toolId }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error removing tool from collection:", error);
    return { success: false, message: error.message || "Failed to remove tool from collection." };
  }
};

/**
 * Deletes a collection.
 * @param {string} collectionId
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const deleteCollection = async (collectionId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/collections/${collectionId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting collection:", error);
    return { success: false, message: error.message || "Failed to delete collection." };
  }
};
