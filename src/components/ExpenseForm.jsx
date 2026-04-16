import { useState } from "react";

export default function ExpenseForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");

  function submit(e) {
    e.preventDefault();
    onAdd({ title, amount, category });
    setTitle("");
    setAmount("");
    setCategory("");
  }

  return (
    <form className="expense-form" onSubmit={submit}>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <input
        placeholder="Amount"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">Category</option>
        <option value="Food">Food</option>
        <option value="Travel">Travel</option>
        <option value="Bills">Bills</option>
        <option value="Other">Other</option>
      </select>

      <button type="submit">Add</button>
    </form>
  );
}
