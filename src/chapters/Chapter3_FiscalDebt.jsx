import { useState, useMemo } from 'react';
import { useChartData } from '../hooks/useChartData';
import ChartContainer from '../components/Charts/ChartContainer';
import LineChart from '../components/Charts/LineChart';
import CountrySelector from '../components/UI/CountrySelector';
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

  const chartData = useMemo(() => {
    if (!data || !data[country]) return [];
    const c = data[country];
    return c.years.map((yr, i) => {
      const realGdpGrowth = i > 0 && c.real_gdp_pc[i] != null && c.real_gdp_pc[i - 1] != null
        ? (c.real_gdp_pc[i] / c.real_gdp_pc[i - 1] - 1) * 100
        : null;
      return {
        year: yr,
        debt_gdp: c.debt_gdp[i],
        revenue_gdp: c.revenue_gdp[i],
        expenditure_gdp: c.expenditure_gdp[i],
        real_gdp_pc: c.real_gdp_pc[i],
        real_gdp_growth: realGdpGrowth,
        crisis: c.crisis[i],
      };
    });
  }, [data, country]);

  const crisisYears = useMemo(() => {
    return chartData.filter(d => d.crisis === 1).map(d => d.year);
  }, [chartData]);

  if (loading) return <div className="py-20 text-center text-gray-400">Loading data...</div>;

  const narrativeSections = NARRATIVE.map((section, i) => (
    <div key={i}>
      <h3 className="font-heading text-xl text-navy mb-3">{section.title}</h3>
      <p className="text-gray-700 leading-relaxed text-lg">{section.text}</p>
    </div>
  ));

  const renderChart = (activeIndex) => {
    const mode = NARRATIVE[activeIndex]?.chartMode || 'debt_line';

    if (mode === 'rev_exp') {
      return (
        <div className="w-full">
          <div className="mb-4">
            <CountrySelector selected={country} onChange={setCountry} />
          </div>
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
                  { key: 'revenue_gdp', label: 'Revenue/GDP', color: '#009E73', highlight: true },
                  { key: 'expenditure_gdp', label: 'Expenditure/GDP', color: '#d35f5f', highlight: true },
                ]}
                yLabel="Share of GDP"
              />
            )}
          </ChartContainer>
        </div>
      );
    }

    if (mode === 'r_minus_g') {
      return (
        <div className="w-full">
          <div className="mb-4">
            <CountrySelector selected={country} onChange={setCountry} />
          </div>
          <ChartContainer
            title={`Real GDP Growth -- ${country}`}
            subtitle="Year-over-year growth in real GDP per capita"
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
          <div className="mb-4">
            <CountrySelector selected={country} onChange={setCountry} />
          </div>
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
                  { key: 'debt_gdp', label: 'Debt/GDP', color: '#CC79A7', highlight: true },
                ]}
                crisisYears={crisisYears}
                yLabel="Debt / GDP Ratio"
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
        <div className="mb-4">
          <CountrySelector selected={country} onChange={setCountry} />
        </div>
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
                { key: 'debt_gdp', label: 'Debt/GDP', color: '#CC79A7', highlight: true },
              ]}
              yLabel="Debt / GDP Ratio"
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
