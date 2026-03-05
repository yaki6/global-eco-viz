import { useState, useMemo } from 'react';
import { useChartData } from '../hooks/useChartData';
import ChartContainer from '../components/Charts/ChartContainer';
import LineChart from '../components/Charts/LineChart';
import BarChart from '../components/Charts/BarChart';
import CountrySelector from '../components/UI/CountrySelector';
import CompareControls, { getCompareColor } from '../components/UI/CompareControls';
import ChapterSection from '../components/Layout/ChapterSection';
import ScrollContainer from '../components/Layout/ScrollContainer';

const NARRATIVE = [
  {
    title: "The Rate of Return on Everything",
    text: `What if you had invested $1 in 1870? The answer depends enormously on the asset class you chose. Equities, housing, bonds, and bills have delivered vastly different returns over the past 150 years -- and the differences compound into staggering gaps over time.`,
    chartMode: 'multi_line',
  },
  {
    title: "Housing: The Surprising Risk-Adjusted Winner",
    text: `One of the most striking findings from the JST dataset is that housing has delivered returns comparable to equities -- but with significantly lower volatility. This gives housing a higher Sharpe ratio (return per unit of risk) than equities across most countries and time periods. Residential real estate has been a remarkably stable wealth generator across countries and centuries.`,
    chartMode: 'housing_focus',
  },
  {
    title: "Risky vs Safe Assets",
    text: `The gap between risky asset returns (equities + housing) and safe asset returns (bonds + bills) is the risk premium. Across 150 years and 18 countries, this premium has averaged 4-5% per year -- a consistent reward for bearing risk. The bar chart shows average real returns by asset class, computed using the Fisher equation: real = (1 + nominal) / (1 + inflation) - 1.`,
    chartMode: 'bar_compare',
  },
  {
    title: "The Risk Premium Across Countries",
    text: `The risk premium is remarkably consistent across countries, suggesting it reflects a fundamental feature of how economies price uncertainty rather than country-specific factors. Note that bill_rate in the dataset represents a yield level, not a total return like equity or bond returns -- making direct comparisons with those series approximate.`,
    chartMode: 'risky_safe',
  },
];

// Wong colorblind-safe palette
const ASSET_COLORS = {
  equity: '#0072B2',
  housing: '#009E73',
  bonds: '#E69F00',
  bills: '#CC79A7',
};

export default function Chapter2() {
  const { data, loading } = useChartData('/data/chapter2.json');
  const [country, setCountry] = useState('USA');
  const [compareMode, setCompareMode] = useState(false);
  const [countries, setCountries] = useState([]);
  const [offsets, setOffsets] = useState({});

  const chartData = useMemo(() => {
    if (!data || !data[country]) return [];
    const c = data[country];
    // Null out hyperinflation-era outliers (e.g. Germany 1922-23) for readable charts
    const clip = (v, threshold = 5) => (v != null && Math.abs(v) > threshold) ? null : v;
    const pct = (v) => v != null ? v * 100 : null;
    return c.years.map((yr, i) => ({
      year: yr,
      equity: pct(clip(c.equity[i])),
      housing: pct(clip(c.housing[i])),
      bonds: pct(clip(c.bonds[i])),
      bills: pct(clip(c.bills[i])),
      risky: pct(clip(c.risky[i])),
      safe: pct(clip(c.safe[i])),
    }));
  }, [data, country]);

  const barData = useMemo(() => {
    if (!data) return [];
    const median = (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    };
    const assets = [
      { key: 'equity', label: 'Equity', color: ASSET_COLORS.equity },
      { key: 'housing', label: 'Housing', color: ASSET_COLORS.housing },
      { key: 'bonds', label: 'Bonds', color: ASSET_COLORS.bonds },
      { key: 'bills', label: 'Bills', color: ASSET_COLORS.bills },
    ];
    return assets.map(asset => {
      const allVals = Object.values(data).flatMap(c =>
        c[asset.key].filter(v => v != null)
      );
      const med = median(allVals) * 100;
      return {
        asset: asset.label,
        avgReturn: Math.round(med * 100) / 100,
      };
    });
  }, [data]);

  const buildCompareLines = (metricKey, metricLabel) => {
    if (!data || !compareMode || countries.length === 0) return null;
    const clip = (v, threshold = 5) => (v != null && Math.abs(v) > threshold) ? null : v;
    const pct = (v) => v != null ? v * 100 : null;
    return countries.map((c, i) => {
      const countryData = data[c];
      if (!countryData) return null;
      const offset = offsets[c] || 0;
      const shiftedData = countryData.years.map((yr, j) => ({
        year: yr + offset,
        [metricKey]: pct(clip(countryData[metricKey][j])),
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
    const mode = NARRATIVE[activeIndex]?.chartMode || 'multi_line';

    // Bar chart mode doesn't support compare overlay
    if (mode === 'bar_compare') {
      return (
        <div className="w-full">
          <ChartContainer
            title="Median Annual Returns by Asset Class"
            subtitle="Median across all 18 countries, 1870-2020"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <BarChart
                width={width}
                height={height}
                data={barData}
                categoryKey="asset"
                valueKeys={[
                  { key: 'avgReturn', label: 'Median Return (%)', color: '#0072B2' },
                ]}
                yLabel="Median Annual Return (%)"
              />
            )}
          </ChartContainer>
          <p className="text-xs text-gray-500 mt-2 italic">
            Note: bill_rate is a yield level, not a total return comparable to eq_tr or bond_tr.
          </p>
        </div>
      );
    }

    // Compare mode
    if (compareMode && countries.length > 0) {
      let metricKey, metricLabel, title;
      if (mode === 'housing_focus') {
        metricKey = 'housing'; metricLabel = 'Housing'; title = 'Housing Returns -- Compare';
      } else if (mode === 'risky_safe') {
        metricKey = 'risky'; metricLabel = 'Risky Assets'; title = 'Risky Asset Returns -- Compare';
      } else {
        metricKey = 'equity'; metricLabel = 'Equity'; title = 'Equity Returns -- Compare';
      }
      const compareLines = buildCompareLines(metricKey, metricLabel) || [];

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
            subtitle="Overlay multiple countries (use offset to time-shift)"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={[]}
                lines={compareLines}
                yLabel="Annual Return (%)"
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    // Single country modes (unchanged)
    if (mode === 'housing_focus') {
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
            title={`Housing vs Equity Returns -- ${country}`}
            subtitle="Annual total returns: housing delivers equity-like returns with lower volatility"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'housing', label: 'Housing', color: ASSET_COLORS.housing, highlight: true },
                  { key: 'equity', label: 'Equities', color: ASSET_COLORS.equity },
                ]}
                yLabel="Annual Return (%)"
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    if (mode === 'risky_safe') {
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
            title={`Risky vs Safe Returns -- ${country}`}
            subtitle="Aggregate risky (equity+housing) vs safe (bonds+bills) returns"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'risky', label: 'Risky Assets', color: '#0072B2', highlight: true },
                  { key: 'safe', label: 'Safe Assets', color: '#E69F00', highlight: true },
                ]}
                yLabel="Annual Return (%)"
              />
            )}
          </ChartContainer>
          <p className="text-xs text-gray-500 mt-2 italic">
            Note: bill_rate is a yield level, not a total return comparable to eq_tr or bond_tr.
          </p>
        </div>
      );
    }

    // multi_line - all 4 assets
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
          title={`Asset Returns -- ${country}`}
          subtitle="Annual total returns by asset class"
          source="JST Macrohistory Database R6"
        >
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              lines={[
                { key: 'equity', label: 'Equities', color: ASSET_COLORS.equity, highlight: true },
                { key: 'housing', label: 'Housing', color: ASSET_COLORS.housing },
                { key: 'bonds', label: 'Bonds', color: ASSET_COLORS.bonds },
                { key: 'bills', label: 'Bills', color: ASSET_COLORS.bills },
              ]}
              yLabel="Annual Return (%)"
            />
          )}
        </ChartContainer>
      </div>
    );
  };

  return (
    <ChapterSection id="returns" number={2} title="The Rate of Return on Everything">
      <ScrollContainer
        narrativeSections={narrativeSections}
        chartRenderer={renderChart}
      />
    </ChapterSection>
  );
}
