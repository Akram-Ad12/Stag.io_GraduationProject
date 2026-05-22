export default function StatusBadge({ status }) {
  const map = {
    pending: { label: 'Pending', cls: 'badge-pending', icon: '⏳' },
    accepted_by_company: { label: 'Accepted', cls: 'badge-accepted', icon: '✅' },
    validated: { label: 'Validated', cls: 'badge-validated', icon: '🎓' },
    rejected: { label: 'Rejected', cls: 'badge-rejected', icon: '✗' },
  };
  const s = map[status] || { label: status, cls: 'badge-pending', icon: '•' };
  return (
    <span className={`badge ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}
