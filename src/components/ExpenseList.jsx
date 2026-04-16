export default function ExpenseList({ items }) {
  return (
    <table className="exp-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>₹ Amount</th>
          <th>Category</th>
        </tr>
      </thead>

      <tbody>
        {items.map((x) => (
          <tr key={x.id}>
            <td>{x.title}</td>
            <td>₹ {x.amount}</td>
            <td>
              <span className="badge">{x.category}</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
