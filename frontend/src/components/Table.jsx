export default function Table({ columns, rows, emptyText = 'No records found.' }) {
  const safeRows = rows ?? [];

  if (!safeRows.length) {
    return (
      <div className="card empty-state">
        <h3>No data yet</h3>
        <p className="muted">{emptyText}</p>
      </div>
    );
  }

  return (
    <div className="card table-card">
      <div className="table-toolbar">
        <h3>Records overview</h3>
        <span className="muted">{safeRows.length} item{safeRows.length === 1 ? '' : 's'}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {safeRows.map((row, index) => (
              <tr key={row._id ?? index}>
                {columns.map((column) => (
                  <td key={column.key} data-label={column.header}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
