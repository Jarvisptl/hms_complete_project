export default function StatCard({ title, value, note, icon = '•', tone = 'blue' }) {
  return (
    <div className={`card stat-card tone-${tone}`}>
      <div className="stat-top">
        <div>
          <p className="stat-label">{title}</p>
          <div className="stat-value">{value}</div>
        </div>
        <div className={`stat-icon tone-${tone}`}>{icon}</div>
      </div>
      <p className="muted">{note}</p>
    </div>
  );
}
