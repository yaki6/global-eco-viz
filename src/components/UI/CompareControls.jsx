import * as d3 from 'd3';
import CountrySelector from './CountrySelector';

const COMPARE_COLORS = d3.schemeTableau10;

export function getCompareColor(index) {
  return COMPARE_COLORS[index % COMPARE_COLORS.length];
}

export default function CompareControls({
  compareMode,
  onToggleCompare,
  countries,
  onCountriesChange,
  offsets,
  onOffsetsChange,
  singleCountry,
  onSingleCountryChange,
}) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-2">
        {!compareMode && (
          <CountrySelector selected={singleCountry} onChange={onSingleCountryChange} />
        )}
        <button
          onClick={onToggleCompare}
          className={`px-3 py-1.5 text-xs rounded border transition-colors font-medium ${
            compareMode
              ? 'bg-navy text-white border-navy'
              : 'bg-white text-gray-600 border-gray-300 hover:border-navy'
          }`}
        >
          {compareMode ? 'Exit Compare' : 'Compare'}
        </button>
      </div>

      {compareMode && (
        <div className="space-y-2">
          <CountrySelector
            selected={countries}
            onChange={onCountriesChange}
            multi={true}
          />
          {countries.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {countries.map((c, i) => (
                <div
                  key={c}
                  className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs"
                >
                  <span
                    className="w-3 h-3 rounded-sm inline-block"
                    style={{ backgroundColor: getCompareColor(i) }}
                  />
                  <span className="font-medium">{c}</span>
                  <label className="text-gray-500 ml-1">offset:</label>
                  <input
                    type="number"
                    value={offsets[c] || 0}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      onOffsetsChange({ ...offsets, [c]: Math.max(-50, Math.min(50, val)) });
                    }}
                    className="w-12 border border-gray-300 rounded px-1 py-0.5 text-xs text-center"
                    min={-50}
                    max={50}
                  />
                  <span className="text-gray-400">yr</span>
                  <button
                    onClick={() => {
                      onCountriesChange(countries.filter(x => x !== c));
                      const next = { ...offsets };
                      delete next[c];
                      onOffsetsChange(next);
                    }}
                    className="text-gray-400 hover:text-red-500 ml-1"
                    title="Remove"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
          {countries.length === 0 && (
            <p className="text-xs text-gray-400 italic">Select countries above to compare</p>
          )}
        </div>
      )}
    </div>
  );
}
