import { useState, useMemo } from 'react';
import { useChartData } from '../hooks/useChartData';
import ChartContainer from '../components/Charts/ChartContainer';
import LineChart from '../components/Charts/LineChart';
import CountrySelector from '../components/UI/CountrySelector';
import CompareControls, { getCompareColor } from '../components/UI/CompareControls';
import ChapterSection from '../components/Layout/ChapterSection';
import ScrollContainer from '../components/Layout/ScrollContainer';

const NARRATIVE = [
  {
    title: "The Credit Boom Pattern",
    text: `Throughout modern economic history, financial crises have followed a remarkably consistent pattern. Before nearly every major banking crisis, there is a period of rapid credit expansion -- banks lend aggressively, asset prices rise, and optimism pervades the economy. The ratio of private credit to GDP captures this dynamic.`,
    chartMode: 'credit_line',
  },
  {
    title: "Credit and House Prices",
    text: `Credit booms and housing booms are deeply intertwined. As banks extend more mortgage lending, house prices rise; rising house prices increase collateral values, enabling even more lending. This self-reinforcing cycle -- "The Great Mortgaging" -- has become the dominant feature of modern financial systems.`,
    chartMode: 'credit_house',
  },
  {
    title: "The Crisis Aftermath",
    text: `Banking crises are devastating. They typically result in sharp contractions in GDP, rising unemployment, and collapsing asset prices. The shaded bands on the chart mark years of systemic banking crises -- note how they cluster after periods of rapid credit growth, confirming the credit-boom-bust pattern.`,
    chartMode: 'credit_with_crisis',
  },
  {
    title: "Cross-Country Patterns",
    text: `This pattern is not unique to any single country. From Australia's 1893 crisis following a housing credit boom, to the 2008 Global Financial Crisis that swept across the developed world, the credit-boom-bust cycle appears across all 18 countries in our dataset spanning 150 years. Try switching countries to see the pattern repeat.`,
    chartMode: 'house_with_crisis',
  },
];

export default function Chapter1() {
  const { data, loading } = useChartData('/data/chapter1.json');
  const [country, setCountry] = useState('USA');
  const [compareMode, setCompareMode] = useState(false);
  const [countries, setCountries] = useState([]);
  const [offsets, setOffsets] = useState({});

  const chartData = useMemo(() => {
    if (!data || !data[country]) return [];
    const c = data[country];
    const raw = c.years.map((yr, i) => ({
      year: yr,
      credit_gdp: c.credit_gdp[i],
      crisis: c.crisis[i],
      house_prices: c.house_prices[i],
    }));
    // Min-max normalize both series to 0-100 range so they're visually comparable
    const creditVals = raw.map(d => d.credit_gdp).filter(v => v != null);
    const houseVals = raw.map(d => d.house_prices).filter(v => v != null);
    const creditMin = Math.min(...creditVals), creditMax = Math.max(...creditVals);
    const houseMin = Math.min(...houseVals), houseMax = Math.max(...houseVals);
    const norm = (v, min, max) => (max > min && v != null) ? ((v - min) / (max - min)) * 100 : null;
    return raw.map(d => ({
      ...d,
      credit_gdp_idx: norm(d.credit_gdp, creditMin, creditMax),
      house_prices_idx: norm(d.house_prices, houseMin, houseMax),
    }));
  }, [data, country]);

  const crisisYears = useMemo(() => {
    return chartData.filter(d => d.crisis === 1).map(d => d.year);
  }, [chartData]);

  // Build per-country shifted data for compare mode
  const buildCompareLines = (metricKey, metricLabel, { indexed = false } = {}) => {
    if (!data || !compareMode || countries.length === 0) return null;
    return countries.map((c, i) => {
      const countryData = data[c];
      if (!countryData) return null;
      const offset = offsets[c] || 0;
      const rawValues = countryData[metricKey];

      let values = rawValues;
      if (indexed) {
        // Min-max normalize to 0-100 range
        const valid = rawValues.filter(v => v != null);
        const min = Math.min(...valid), max = Math.max(...valid);
        values = rawValues.map(v => (max > min && v != null) ? ((v - min) / (max - min)) * 100 : null);
      }

      const shiftedData = countryData.years.map((yr, j) => ({
        year: yr + offset,
        [metricKey]: values[j],
      }));
      return {
        key: metricKey,
        label: `${c} ${offset !== 0 ? `(${offset > 0 ? '+' : ''}${offset}yr)` : ''}`,
        color: getCompareColor(i),
        highlight: true,
        data: shiftedData,
      };
    }).filter(Boolean);
  };

  if (loading) return <div className="py-20 text-center text-gray-400">Loading data...</div>;

  const narrativeSections = NARRATIVE.map((section, i) => (
    <div key={i}>
      <h3 className="font-heading text-xl text-navy mb-3">{section.title}</h3>
      <p className="text-gray-700 leading-relaxed text-lg">{section.text}</p>
    </div>
  ));

  const renderChart = (activeIndex) => {
    const mode = NARRATIVE[activeIndex]?.chartMode || 'credit_line';

    // Compare mode: overlay multiple countries
    if (compareMode && countries.length > 0) {
      const isDual = mode === 'credit_house' || mode === 'house_with_crisis';
      const compareLines = buildCompareLines('credit_gdp', 'Credit/GDP', { indexed: isDual });

      // For dual-metric modes, also show house prices
      let allLines = compareLines || [];
      if (isDual) {
        const houseLines = buildCompareLines('house_prices', 'House Prices', { indexed: true });
        if (houseLines) {
          allLines = [
            ...compareLines,
            ...houseLines.map(l => ({ ...l, label: `${l.label} (HP)` })),
          ];
        }
      }

      const title = isDual
        ? 'Credit & Housing -- Compare'
        : 'Private Credit / GDP -- Compare';
      const compareYLabel = isDual ? 'Normalized (0-100)' : 'Credit / GDP Ratio';

      return (
        <div className="w-full">
          <CompareControls
            compareMode={compareMode}
            onToggleCompare={() => setCompareMode(false)}
            countries={countries}
            onCountriesChange={setCountries}
            offsets={offsets}
            onOffsetsChange={setOffsets}
            singleCountry={country}
            onSingleCountryChange={setCountry}
          />
          <ChartContainer
            title={title}
            subtitle="Overlay multiple countries (use offset to align credit booms)"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={[]}
                lines={allLines}
                yLabel={compareYLabel}
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    // Single country mode (unchanged)
    const isDualSingle = mode === 'credit_house' || mode === 'house_with_crisis';
    const linesMap = {
      credit_line: [
        { key: 'credit_gdp', label: 'Credit/GDP', color: '#0072B2', highlight: true },
      ],
      credit_house: [
        { key: 'credit_gdp_idx', label: 'Credit/GDP (indexed)', color: '#0072B2', highlight: true },
        { key: 'house_prices_idx', label: 'House Prices (indexed)', color: '#E69F00' },
      ],
      credit_with_crisis: [
        { key: 'credit_gdp', label: 'Credit/GDP', color: '#0072B2', highlight: true },
      ],
      house_with_crisis: [
        { key: 'credit_gdp_idx', label: 'Credit/GDP (indexed)', color: '#0072B2', highlight: true },
        { key: 'house_prices_idx', label: 'House Prices (indexed)', color: '#E69F00' },
      ],
    };

    const showCrisis = mode === 'credit_with_crisis' || mode === 'house_with_crisis';
    const lines = linesMap[mode] || linesMap.credit_line;
    const yLabel = isDualSingle ? 'Normalized (0 = min, 100 = max)' : 'Credit / GDP Ratio';

    const subtitle = isDualSingle
      ? 'Both series normalized to 0-100 range for visual comparison'
      : 'Ratio of total loans to non-financial private sector to GDP';

    return (
      <div className="w-full">
        <CompareControls
          compareMode={compareMode}
          onToggleCompare={() => setCompareMode(true)}
          countries={countries}
          onCountriesChange={setCountries}
          offsets={offsets}
          onOffsetsChange={setOffsets}
          singleCountry={country}
          onSingleCountryChange={setCountry}
        />
        <ChartContainer
          title={`Private Credit & Housing -- ${country}`}
          subtitle={subtitle}
          source="JST Macrohistory Database R6"
        >
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              lines={lines}
              crisisYears={showCrisis ? crisisYears : []}
              yLabel={yLabel}
            />
          )}
        </ChartContainer>
        {showCrisis && (
          <p className="text-xs text-crisis-red mt-2">
            Shaded bands = systemic banking crisis years (JST classification)
          </p>
        )}
      </div>
    );
  };

  return (
    <ChapterSection id="credit" number={1} title="Credit Cycles & Financial Crises">
      <ScrollContainer
        narrativeSections={narrativeSections}
        chartRenderer={renderChart}
      />
    </ChapterSection>
  );
}
