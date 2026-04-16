import React from "react";

export default function ExpenseCard({ expense }) {
  return (
    <div className="expense-card">
      <span>{expense.title}</span>
      <span>₹{expense.amount}</span>
    </div>
  );
}
