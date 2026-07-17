import { getToken } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Creates a new tool list for the logged-in user.
 * @param {string} name - The list name.
 * @param {boolean} isPublic - Whether the list is public.
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const createUserToolList = async (name, isPublic = false) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, isPublic }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error creating tool list:", error);
    return { success: false, message: error.message || "Failed to create tool list." };
  }
};

/**
 * Fetches all tool lists of the logged-in user (tool data populated).
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getUserToolLists = async () => {
  try {
    const token = getToken();
    if (!token) return { success: false, data: [] };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tool lists:", error);
    return { success: false, data: [] };
  }
};

/**
 * Fetches all tool lists shared with the logged-in user.
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getSharedUserToolLists = async () => {
  try {
    const token = getToken();
    if (!token) return { success: false, data: [] };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/shared`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching shared tool lists:", error);
    return { success: false, data: [] };
  }
};

/**
 * Fetches all public tool lists (no auth required).
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
export const getPublicUserToolLists = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/user-tool-lists/public`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching public tool lists:", error);
    return { success: false, data: [] };
  }
};

/**
 * Fetches a specific tool list by ID.
 * @param {string} listId
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const getUserToolListById = async (listId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/${listId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tool list:", error);
    return { success: false, message: error.message || "Failed to fetch tool list." };
  }
};

/**
 * Adds a tool to a tool list.
 * @param {string} listId
 * @param {string} toolId
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const addToolToList = async (listId, toolId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/${listId}/tools`, {
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
    console.error("Error adding tool to list:", error);
    return { success: false, message: error.message || "Failed to add tool to list." };
  }
};

/**
 * Removes a tool from a tool list.
 * @param {string} listId
 * @param {string} toolId
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const removeToolFromList = async (listId, toolId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/${listId}/tools`, {
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
    console.error("Error removing tool from list:", error);
    return { success: false, message: error.message || "Failed to remove tool from list." };
  }
};

/**
 * Renames a tool list or toggles public/private status.
 * @param {string} listId
 * @param {string} name - Optional new name.
 * @param {boolean} isPublic - Optional public status.
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const updateUserToolList = async (listId, name, isPublic) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const body = {};
    if (name !== undefined) body.name = name;
    if (isPublic !== undefined) body.isPublic = isPublic;

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/${listId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error updating tool list:", error);
    return { success: false, message: error.message || "Failed to update tool list." };
  }
};

/**
 * Deletes a tool list.
 * @param {string} listId
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export const deleteUserToolList = async (listId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/${listId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error deleting tool list:", error);
    return { success: false, message: error.message || "Failed to delete tool list." };
  }
};

/**
 * Shares a tool list with another user by email.
 * @param {string} listId
 * @param {string} email - Email of the user to share with.
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const shareUserToolList = async (listId, email) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/${listId}/share`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sharing tool list:", error);
    return { success: false, message: error.message || "Failed to share tool list." };
  }
};

/**
 * Removes a user from a shared tool list.
 * @param {string} listId
 * @param {string} userId - ID of the user to remove.
 * @returns {Promise<{success: boolean, data?: object, message?: string}>}
 */
export const unshareUserToolList = async (listId, userId) => {
  try {
    const token = getToken();
    if (!token) return { success: false, message: "Authentication required." };

    const response = await fetch(`${API_BASE_URL}/user-tool-lists/${listId}/share/${userId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error unsharing tool list:", error);
    return { success: false, message: error.message || "Failed to unshare tool list." };
  }
};