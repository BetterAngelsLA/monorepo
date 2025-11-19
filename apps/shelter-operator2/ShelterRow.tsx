import type { Shelter } from './page';

type Props = { shelter: Shelter };

export function ShelterRow({ shelter }: Props) {
  const { name, address, totalBeds } = shelter;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr 0.5fr',
        alignItems: 'center',
        padding: '16px 24px',
        fontSize: '14px',
        borderBottom: '1px solid #e5e7eb'
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
    >
      {/* Name */}
      <div style={{ fontWeight: 500, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {name ?? 'N/A'}
      </div>

      {/* Address */}
      <div style={{ color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {address ?? 'N/A'}
      </div>

      {/* Capacity */}
      <div style={{ textAlign: 'right', whiteSpace: 'nowrap', color: '#374151' }}>
        {totalBeds ?? 'N/A'}
      </div>
    </div>
  );
}
