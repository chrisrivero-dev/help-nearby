export default function FindResources({
  onCategorySelect,
  onSubcategorySelect,
}: {
  onCategorySelect: (category: string) => void;
  onSubcategorySelect: (subcategory: string) => void;
}) {
  const categories = [
    { id: 'housing', label: 'HOUSING' },
    { id: 'food', label: 'FOOD' },
    { id: 'safety', label: 'SAFETY' },
    { id: 'finance', label: 'FINANCE' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: '1rem',
        width: 'calc(100% - 6rem)',
        marginRight: '3rem',
        marginLeft: '3rem',
        padding: '1rem',
        borderRadius: '0px',
        backgroundColor: 'inherit',
      }}
    >
      {categories.map((category) => (
        <div
          key={category.id}
          style={{ position: 'relative', flex: 1, height: '80px' }}
        >
          <div
            style={{
              position: 'absolute',
              backgroundColor: '#be9090',
              width: '100%',
              height: '100%',
              zIndex: 0,
              left: '-8px',
              top: '8px',
              borderRadius: '0px',
            }}
          />
          <div
            style={{
              width: '100%',
              height: '80px',
              backgroundColor: '#ece1e1',
              // border: '4px solid #000',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              cursor: 'pointer',
              userSelect: 'none',
              borderRadius: '0px',
            }}
            onClick={() => onCategorySelect(category.id)}
          >
            {category.label}
          </div>
        </div>
      ))}
    </div>
  );
}
