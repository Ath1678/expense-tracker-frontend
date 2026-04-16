const API_URL = "/api/user";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

const UserService = {
    getProfile: async () => {
        try {
            const res = await fetch(`${API_URL}/profile`, {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to fetch profile");
            return await res.json();
        } catch (err) {
            console.error("❌ Profile Error:", err);
            return null;
        }
    },

    updateLimit: async (limit) => {
        try {
            const res = await fetch(`${API_URL}/limit`, {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ limit }),
            });
            if (!res.ok) throw new Error("Failed to update limit");
            return await res.json();
        } catch (err) {
            console.error("❌ Link Update Error:", err);
            throw err;
        }
    }
};

export default UserService;
