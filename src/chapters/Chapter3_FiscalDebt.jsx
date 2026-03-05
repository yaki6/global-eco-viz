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
    title: "The Rise of Government Debt",
    text: `Government debt-to-GDP ratios have followed dramatic arcs over the past 150 years. Wars, recessions, and policy choices have all left their mark. Most advanced economies entered the 20th century with modest debt levels, only to see them soar during the two World Wars.`,
    chartMode: 'debt_line',
  },
  {
    title: "Revenue vs Expenditure",
    text: `The fiscal balance -- the gap between government revenue and expenditure as shares of GDP -- tells the story of state expansion. Over 150 years, government spending has grown from roughly 10% of GDP to 40-50% in most advanced economies, reflecting the rise of the welfare state and public services.`,
    chartMode: 'rev_exp',
  },
  {
    title: "The r - g Gap",
    text: `Debt sustainability depends critically on the gap between the real interest rate (r) and real GDP growth (g). When r exceeds g, the debt-to-GDP ratio rises even without new borrowing -- a "snowball effect." When g exceeds r, economies can gradually grow out of debt. This dynamic has driven the great deleveraging episodes after both World Wars.`,
    chartMode: 'r_minus_g',
  },
  {
    title: "The Modern Debt Challenge",
    text: `Since the 1980s, many advanced economies have accumulated peacetime debt levels that would have been unthinkable in earlier eras. The 2008 financial crisis and COVID-19 pandemic accelerated this trend. Yet historically low interest rates have kept debt service costs manageable -- for now. The red bands show that financial crises often coincide with or follow debt accumulation episodes.`,
    chartMode: 'debt_with_crisis',
  },
];

export default function Chapter3() {
  const { data, loading } = useChartData('/data/chapter3.json');
  const [country, setCountry] = useState('USA');
  const [compareMode, setCompareMode] = useState(false);
  const [countries, setCountries] = useState([]);
  const [offsets, setOffsets] = useState({});

  const chartData = useMemo(() => {
    if (!data || !data[country]) return [];
    const c = data[country];
    return c.years.map((yr, i) => {
      const realGdpGrowth = i > 0 && c.real_gdp_pc[i] != null && c.real_gdp_pc[i - 1] != null
        ? (c.real_gdp_pc[i] / c.real_gdp_pc[i - 1] - 1) * 100
        : null;
      return {
        year: yr,
        debt_gdp: c.debt_gdp[i] != null ? c.debt_gdp[i] * 100 : null,
        revenue_gdp: c.revenue_gdp[i] != null ? c.revenue_gdp[i] * 100 : null,
        expenditure_gdp: c.expenditure_gdp[i] != null ? c.expenditure_gdp[i] * 100 : null,
        real_gdp_pc: c.real_gdp_pc[i],
        real_gdp_growth: realGdpGrowth,
        crisis: c.crisis[i],
      };
    });
  }, [data, country]);

  const crisisYears = useMemo(() => {
    return chartData.filter(d => d.crisis === 1).map(d => d.year);
  }, [chartData]);

  const buildCompareLines = (metricKey, metricLabel) => {
    if (!data || !compareMode || countries.length === 0) return null;
    return countries.map((c, i) => {
      const countryData = data[c];
      if (!countryData) return null;
      const offset = offsets[c] || 0;
      let shiftedData;
      if (metricKey === 'real_gdp_growth') {
        shiftedData = countryData.years.map((yr, j) => {
          const growth = j > 0 && countryData.real_gdp_pc[j] != null && countryData.real_gdp_pc[j - 1] != null
            ? (countryData.real_gdp_pc[j] / countryData.real_gdp_pc[j - 1] - 1) * 100
            : null;
          return { year: yr + offset, [metricKey]: growth };
        });
      } else {
        const needsPercent = ['debt_gdp', 'revenue_gdp', 'expenditure_gdp'].includes(metricKey);
        shiftedData = countryData.years.map((yr, j) => ({
          year: yr + offset,
          [metricKey]: countryData[metricKey][j] != null
            ? (needsPercent ? countryData[metricKey][j] * 100 : countryData[metricKey][j])
            : null,
        }));
      }
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
    const mode = NARRATIVE[activeIndex]?.chartMode || 'debt_line';

    // Compare mode
    if (compareMode && countries.length > 0) {
      let metricKey, title, yLabel;
      if (mode === 'rev_exp') {
        metricKey = 'revenue_gdp'; title = 'Government Revenue/GDP -- Compare'; yLabel = 'Share of GDP (%)';
      } else if (mode === 'r_minus_g') {
        metricKey = 'real_gdp_growth'; title = 'Real GDP Growth -- Compare'; yLabel = 'Growth Rate (%)';
      } else {
        metricKey = 'debt_gdp'; title = 'Public Debt/GDP -- Compare'; yLabel = 'Debt / GDP (%)';
      }
      const compareLines = buildCompareLines(metricKey, title) || [];

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
                yLabel={yLabel}
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    // Single country modes (unchanged)
    if (mode === 'rev_exp') {
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
            title={`Government Revenue & Expenditure -- ${country}`}
            subtitle="As share of GDP"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'revenue_gdp', label: 'Revenue/GDP (%)', color: '#009E73', highlight: true },
                  { key: 'expenditure_gdp', label: 'Expenditure/GDP (%)', color: '#d35f5f', highlight: true },
                ]}
                yLabel="Share of GDP (%)"
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    if (mode === 'r_minus_g') {
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
            title={`Real GDP Growth (g) -- ${country}`}
            subtitle="Year-over-year growth in real GDP per capita (interest rate data not available)"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'real_gdp_growth', label: 'Real GDP Growth (%)', color: '#0072B2', highlight: true },
                ]}
                crisisYears={crisisYears}
                yLabel="Growth Rate (%)"
              />
            )}
          </ChartContainer>
          <p className="text-xs text-gray-500 mt-2 italic">
            When growth exceeds interest rates, debt/GDP falls even without surpluses.
          </p>
        </div>
      );
    }

    if (mode === 'debt_with_crisis') {
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
            title={`Public Debt / GDP -- ${country}`}
            subtitle="Central government debt as share of GDP"
            source="JST Macrohistory Database R6"
          >
            {({ width, height }) => (
              <LineChart
                width={width}
                height={height}
                data={chartData}
                lines={[
                  { key: 'debt_gdp', label: 'Debt/GDP (%)', color: '#CC79A7', highlight: true },
                ]}
                crisisYears={crisisYears}
                yLabel="Debt / GDP (%)"
              />
            )}
          </ChartContainer>
          <p className="text-xs text-crisis-red mt-2">
            Shaded bands = systemic banking crisis years (JST classification)
          </p>
        </div>
      );
    }

    // debt_line (no crisis bands)
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
          title={`Public Debt / GDP -- ${country}`}
          subtitle="Central government debt as share of GDP"
          source="JST Macrohistory Database R6"
        >
          {({ width, height }) => (
            <LineChart
              width={width}
              height={height}
              data={chartData}
              lines={[
                { key: 'debt_gdp', label: 'Debt/GDP (%)', color: '#CC79A7', highlight: true },
              ]}
              yLabel="Debt / GDP (%)"
            />
          )}
        </ChartContainer>
      </div>
    );
  };

  return (
    <ChapterSection id="fiscal" number={3} title="Fiscal Policy & Debt Sustainability">
      <ScrollContainer
        narrativeSections={narrativeSections}
        chartRenderer={renderChart}
      />
    </ChapterSection>
  );
}
