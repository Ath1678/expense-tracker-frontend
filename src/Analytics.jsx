export default function Analytics({ expenses }) {
  if (!Array.isArray(expenses)) {
    return <p>No analytics available</p>;
  }

  return (
    <div>
      <h2>Analytics</h2>
      <p>Total Expenses Count: {expenses.length}</p>
    </div>
  );
}
