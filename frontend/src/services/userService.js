const API_BASE = import.meta.env.VITE_API_URL;

/* ===========================
   SAFE REQUEST WRAPPER
=========================== */
async function request(path) {
  try {
    const response = await fetch(`${API_BASE}${path}`);

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[userService] Request failed for "${path}":`, error);
    return {
      success: false,
      message: error.message || "Request failed",
    };
  }
}

/* ===========================
   GET PUBLIC USER PROFILE
=========================== */
export async function getPublicUserProfile(userId) {
  const token = localStorage.getItem("token");

  try {
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/users/public/${userId}`, {
      headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      return { success: false, data: null };
    }

    return {
      success: data?.success ?? false,
      data: data?.data ?? null,
    };
  } catch (error) {
    console.error("[userService] getPublicUserProfile failed:", error);
    return {
      success: false,
      data: null,
    };
  }
}

/* ===========================
   GET USER PROFILE (AUTHENTICATED)
=========================== */
export async function getProfile() {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return {
      success: data?.success ?? false,
      user: data?.user ?? null,
      bookmarks: data?.bookmarks ?? [],
      reviews: data?.reviews ?? [],
    };
  } catch (error) {
    console.error("[userService] getProfile failed:", error);
    return {
      success: false,
      message: error.message || "Failed to fetch profile",
    };
  }
}

/* ===========================
   FOLLOW / UNFOLLOW USER
=========================== */
export async function followUser(userId) {
  const token = localStorage.getItem("token");
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return {
      success: data?.success ?? false,
      message: data?.message ?? "User followed successfully.",
      followersCount: data?.followersCount ?? 0,
      followingCount: data?.followingCount ?? 0,
    };
  } catch (error) {
    console.error("[userService] followUser failed:", error);
    return {
      success: false,
      message: error.message || "Failed to follow user",
    };
  }
}

export async function unfollowUser(userId) {
  const token = localStorage.getItem("token");
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return {
      success: data?.success ?? false,
      message: data?.message ?? "User unfollowed successfully.",
      followersCount: data?.followersCount ?? 0,
      followingCount: data?.followingCount ?? 0,
    };
  } catch (error) {
    console.error("[userService] unfollowUser failed:", error);
    return {
      success: false,
      message: error.message || "Failed to unfollow user",
    };
  }
}

/* ===========================
   UPDATE PROFILE
=========================== */
export async function updateProfile(profileData) {
  const token = localStorage.getItem("token");
  
  if (!token) {
    return { success: false, message: "Not authenticated" };
  }

  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.message || `Request failed: ${response.status}`);
    }

    return {
      success: data?.success ?? false,
      user: data?.user ?? null,
      message: data?.message ?? "Profile updated",
    };
  } catch (error) {
    console.error("[userService] updateProfile failed:", error);
    return {
      success: false,
      message: error.message || "Failed to update profile",
    };
  }
}