const API_URL = "/api/recurring";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

const RecurringService = {
    getRecurring: async () => {
        try {
            const res = await fetch(API_URL, {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to fetch recurring expenses");
            return await res.json();
        } catch (err) {
            console.error("❌ Fetch Error:", err);
            return [];
        }
    },

    addRecurring: async (item) => {
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(item),
            });
            if (!res.ok) throw new Error("Failed to add recurring expense");
            return await res.json();
        } catch (err) {
            console.error("❌ Add Error:", err);
            throw err;
        }
    },

    deleteRecurring: async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to delete recurring expense");
        } catch (err) {
            console.error("❌ Delete Error:", err);
            throw err;
        }
    },

    processPayment: async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}/pay`, {
                method: "PUT",
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to process payment");
            return await res.json();
        } catch (err) {
            console.error("❌ Payment Error:", err);
            throw err;
        }
    }
};

export default RecurringService;
