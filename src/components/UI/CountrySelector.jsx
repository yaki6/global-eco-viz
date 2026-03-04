const COUNTRIES = [
  { name: 'Australia', iso: 'AUS' }, { name: 'Belgium', iso: 'BEL' },
  { name: 'Canada', iso: 'CAN' }, { name: 'Switzerland', iso: 'CHE' },
  { name: 'Germany', iso: 'DEU' }, { name: 'Denmark', iso: 'DNK' },
  { name: 'Spain', iso: 'ESP' }, { name: 'Finland', iso: 'FIN' },
  { name: 'France', iso: 'FRA' }, { name: 'United Kingdom', iso: 'GBR' },
  { name: 'Ireland', iso: 'IRL' }, { name: 'Italy', iso: 'ITA' },
  { name: 'Japan', iso: 'JPN' }, { name: 'Netherlands', iso: 'NLD' },
  { name: 'Norway', iso: 'NOR' }, { name: 'Portugal', iso: 'PRT' },
  { name: 'Sweden', iso: 'SWE' }, { name: 'USA', iso: 'USA' },
];

export default function CountrySelector({ selected, onChange, multi = false }) {
  if (multi) {
    return (
      <div className="flex flex-wrap gap-1.5 my-3">
        {COUNTRIES.map(c => (
          <button
            key={c.name}
            onClick={() => {
              const next = selected.includes(c.name)
                ? selected.filter(s => s !== c.name)
                : [...selected, c.name];
              onChange(next);
            }}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              selected.includes(c.name)
                ? 'bg-navy text-white border-navy'
                : 'bg-white text-gray-600 border-gray-300 hover:border-navy'
            }`}
          >
            {c.iso}
          </button>
        ))}
      </div>
    );
  }

  return (
    <select
      value={selected}
      onChange={(e) => onChange(e.target.value)}
      className="border border-gray-300 rounded px-3 py-1.5 text-sm bg-white focus:border-navy focus:outline-none"
    >
      {COUNTRIES.map(c => (
        <option key={c.name} value={c.name}>{c.name}</option>
      ))}
    </select>
  );
}

export { COUNTRIES };
