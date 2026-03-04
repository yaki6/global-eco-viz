import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

const MARGIN = { top: 20, right: 30, bottom: 50, left: 60 };

export default function ScatterPlot({
  width, height, data, xKey, yKey, xLabel, yLabel,
  colorKey, colorScale, radiusKey, showTrend = false,
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data || !data.length || !width) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const w = width - MARGIN.left - MARGIN.right;
    const h = height - MARGIN.top - MARGIN.bottom;
    const g = svg.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    const filtered = data.filter(d => d[xKey] != null && d[yKey] != null);

    const x = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d[xKey])).nice()
      .range([0, w]);
    const y = d3.scaleLinear()
      .domain(d3.extent(filtered, d => d[yKey])).nice()
      .range([h, 0]);

    g.append('g').attr('transform', `translate(0,${h})`)
      .call(d3.axisBottom(x).ticks(8));
    g.append('g').call(d3.axisLeft(y).ticks(6));

    if (xLabel) {
      g.append('text').attr('x', w / 2).attr('y', h + 40)
        .attr('text-anchor', 'middle').attr('fill', '#718096')
        .attr('font-size', '12px').text(xLabel);
    }
    if (yLabel) {
      g.append('text').attr('transform', 'rotate(-90)')
        .attr('y', -45).attr('x', -h / 2)
        .attr('text-anchor', 'middle').attr('fill', '#718096')
        .attr('font-size', '12px').text(yLabel);
    }

    // Dots
    g.selectAll('circle').data(filtered).enter()
      .append('circle')
      .attr('cx', d => x(d[xKey]))
      .attr('cy', d => y(d[yKey]))
      .attr('r', d => radiusKey ? Math.max(2, Math.sqrt(d[radiusKey]) * 2) : 4)
      .attr('fill', d => colorKey && colorScale ? colorScale(d[colorKey]) : '#4a90b8')
      .attr('opacity', 0.6)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5);

    // Trend line
    if (showTrend && filtered.length > 5) {
      const xMean = d3.mean(filtered, d => d[xKey]);
      const yMean = d3.mean(filtered, d => d[yKey]);
      const num = d3.sum(filtered, d => (d[xKey] - xMean) * (d[yKey] - yMean));
      const den = d3.sum(filtered, d => (d[xKey] - xMean) ** 2);
      const slope = num / den;
      const intercept = yMean - slope * xMean;
      const xExt = d3.extent(filtered, d => d[xKey]);

      g.append('line')
        .attr('x1', x(xExt[0])).attr('y1', y(intercept + slope * xExt[0]))
        .attr('x2', x(xExt[1])).attr('y2', y(intercept + slope * xExt[1]))
        .attr('stroke', '#e53e3e').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,3').attr('opacity', 0.7);
    }
  }, [data, width, height, xKey, yKey, xLabel, yLabel, colorKey, colorScale, radiusKey, showTrend]);

  return <svg ref={svgRef} width={width} height={height} />;
}
