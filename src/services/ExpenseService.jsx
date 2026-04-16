const API_URL = "/api/expenses";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const ExpenseService = {
  getExpenses: async () => {
    try {
      const res = await fetch(API_URL, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return await res.json();
    } catch (err) {
      console.error("❌ Fetch Error:", err);
      return [];
    }
  },

  addExpense: async (expense) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(expense),
      });
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        const errorText = contentType && contentType.includes("application/json")
          ? (await res.json()).message
          : await res.text();
        console.error(`❌ Add Error: ${res.status}`, errorText);
        throw new Error(`Failed to add expense: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error("❌ Add Error:", err);
      throw err;
    }
  },

  deleteExpense: async (id) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete expense");
    } catch (err) {
      console.error("❌ Delete Error:", err);
      throw err;
    }
  },
};

export default ExpenseService;
