const API_URL = "/api/incomes";

const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

const IncomeService = {
    getIncomes: async () => {
        try {
            const res = await fetch(API_URL, {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to fetch incomes");
            return await res.json();
        } catch (err) {
            console.error("❌ Fetch Income Error:", err);
            return [];
        }
    },

    addIncome: async (income) => {
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify(income),
            });
            if (!res.ok) throw new Error("Failed to add income");
            return await res.json();
        } catch (err) {
            console.error("❌ Add Income Error:", err);
            throw err;
        }
    },

    deleteIncome: async (id) => {
        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to delete income");
        } catch (err) {
            console.error("❌ Delete Income Error:", err);
            throw err;
        }
    },
};

export default IncomeService;
